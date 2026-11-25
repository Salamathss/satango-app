// src/hooks/useBoosters.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { playSuccessSound, playClickSound } from "@/utils/audio";

export type BoosterType = "fiftyFifty" | "desmosHacks" | "similarDrills";

export interface BoosterMeta {
  id: BoosterType;
  nameRu: string;
  nameEn: string;
  taglineRu: string;
  taglineEn: string;
  descriptionRu: string;
  descriptionEn: string;
  cost: number;
  iconName: string;
  gradient: string;
  accentColor: string;
}

export const BOOSTER_ITEMS: Record<BoosterType, BoosterMeta> = {
  fiftyFifty: {
    id: "fiftyFifty",
    nameRu: "Подсказка 50/50",
    nameEn: "50/50 Elimination",
    taglineRu: "Убирает 2 неверных варианта",
    taglineEn: "Removes 2 incorrect choices",
    descriptionRu: "ИИ анализирует дистракторы вопроса и мгновенно вычеркивает два заведомо ложных ответа, оставляя шанс 1 из 2.",
    descriptionEn: "AI evaluates question distractors and strikes out two wrong options, narrowing your choices to 1-in-2.",
    cost: 60,
    iconName: "Divide",
    gradient: "from-amber-500/20 via-card to-card",
    accentColor: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  desmosHacks: {
    id: "desmosHacks",
    nameRu: "Desmos-хаки",
    nameEn: "Desmos Hack Cheatsheet",
    taglineRu: "Шпаргалка обхода ловушек Math",
    taglineEn: "Math trap bypass & regression formulas",
    descriptionRu: "Готовые шаблоны регрессий (~), трюки нахождения корней и формулы для мгновенного решения задач Math в калькуляторе.",
    descriptionEn: "Instant regression templates (~), root finding shortcuts, and cheat formulas for Digital SAT Math.",
    cost: 100,
    iconName: "Binary",
    gradient: "from-sky-500/20 via-card to-card",
    accentColor: "text-sky-500 bg-sky-500/10 border-sky-500/30",
  },
  similarDrills: {
    id: "similarDrills",
    nameRu: "Генератор похожих задач",
    nameEn: "AI Similar Question Generator",
    taglineRu: "Тренировка на ошибках",
    taglineEn: "Clone-pattern mastery drills",
    descriptionRu: "Мгновенная генерация аналогичной задачи по строгим шаблонам College Board для закрепления пройденного паттерна.",
    descriptionEn: "Instantly creates clone SAT questions using College Board blueprints to turn weak spots into strengths.",
    cost: 80,
    iconName: "Sparkles",
    gradient: "from-violet-500/20 via-card to-card",
    accentColor: "text-violet-500 bg-violet-500/10 border-violet-500/30",
  },
};

const STORAGE_KEY_PREFIX = "satango_boosters_";
const SYNC_EVENT_NAME = "satango_boosters_sync";

interface BoostersState {
  fiftyFifty: number;
  desmosHacks: number;
  similarDrills: number;
}

const DEFAULT_COUNTS: BoostersState = {
  fiftyFifty: 2,
  desmosHacks: 1,
  similarDrills: 2,
};

export const useBoosters = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || "guest";
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

  const loadInitialCounts = (): BoostersState => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...DEFAULT_COUNTS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_COUNTS;
  };

  const [counts, setCounts] = useState<BoostersState>(loadInitialCounts);

  const { data: progress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_progress")
        .select("gems, streak, hearts")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const gems = user ? (progress?.gems ?? 0) : 150;

  // Persist state changes & broadcast to other mounted components
  const updateCounts = useCallback(
    (updater: (prev: BoostersState) => BoostersState) => {
      setCounts((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent(SYNC_EVENT_NAME, { detail: { userId, counts: next } })
          );
        } catch {
          // localStorage quota
        }
        return next;
      });
    },
    [storageKey, userId]
  );

  // Listen for sync events from other components/tabs
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; counts: BoostersState }>;
      if (customEvent.detail?.userId === userId && customEvent.detail?.counts) {
        setCounts(customEvent.detail.counts);
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    return () => window.removeEventListener(SYNC_EVENT_NAME, handleSync);
  }, [userId]);

  // Sync when user changes
  useEffect(() => {
    setCounts(loadInitialCounts());
  }, [storageKey]);

  const purchaseBooster = useCallback(
    async (type: BoosterType): Promise<boolean> => {
      const item = BOOSTER_ITEMS[type];
      if (!item) return false;

      if (gems < item.cost) {
        toast.error(`Недостаточно гемов! Нужно ${item.cost} 💎 (у вас ${gems} 💎)`);
        return false;
      }

      playClickSound();

      if (user) {
        try {
          const { data, error } = await (supabase as any).rpc("up_spend_gems", {
            _amount: item.cost,
          });
          if (error || (data && !(data as any).ok)) {
            toast.error("Не удалось списать гемы. Проверьте баланс.");
            return false;
          }
        } catch (err) {
          console.error("Purchase RPC failed:", err);
          toast.error("Ошибка соединения при покупке бустера.");
          return false;
        }
      }

      updateCounts((prev) => ({
        ...prev,
        [type]: prev[type] + 1,
      }));

      playSuccessSound();
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
      toast.success(`Куплен бустер «${item.nameRu}»! 🎉`);
      return true;
    },
    [gems, user, queryClient, updateCounts]
  );

  const consumeBooster = useCallback(
    (type: BoosterType): boolean => {
      let consumed = false;
      updateCounts((prev) => {
        if (prev[type] <= 0) return prev;
        consumed = true;
        return {
          ...prev,
          [type]: Math.max(0, prev[type] - 1),
        };
      });
      return consumed;
    },
    [updateCounts]
  );

  return {
    counts,
    gems,
    purchaseBooster,
    consumeBooster,
    items: BOOSTER_ITEMS,
  };
};
