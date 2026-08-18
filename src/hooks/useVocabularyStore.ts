import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getVocabWord } from "@/lib/vocabulary";

const LOCAL_STORAGE_KEY = "satango_saved_vocabulary_v2";

export interface SavedWordState {
  wordKey: string;
  status: "saved" | "mastered";
}

export function useVocabularyStore() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Local state fallback
  const [localSaved, setLocalSaved] = useState<SavedWordState[]>(() => {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY);
      return item ? JSON.parse(item) : [];
    } catch (e) {
      return [];
    }
  });

  // Query all saved/mastered vocabulary from Supabase
  const { data: dbSaved = [], isLoading } = useQuery({
    queryKey: ["user-saved-vocabulary-v2", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const { data, error } = await supabase
          .from("user_vocabulary")
          .select("word_key, status")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching vocabulary:", error);
          return [];
        }
        return (data ?? []).map((r) => ({
          wordKey: r.word_key,
          status: (r.status === "mastered" ? "mastered" : "saved") as "saved" | "mastered",
        }));
      } catch (e) {
        console.error("Exception fetching vocabulary:", e);
        return [];
      }
    },
    enabled: !!user,
    retry: false,
  });

  // Union of local and DB states
  const savedWords = useMemo(() => {
    const map = new Map<string, "saved" | "mastered">();
    // Load local first
    localSaved.forEach((item) => map.set(item.wordKey, item.status));
    // DB overwrites/augments local
    dbSaved.forEach((item) => map.set(item.wordKey, item.status));

    return Array.from(map.entries()).map(([wordKey, status]) => ({
      wordKey,
      status,
    }));
  }, [localSaved, dbSaved]);

  const saveWord = useCallback(
    async (wordKey: string) => {
      const existing = savedWords.find((w) => w.wordKey === wordKey);
      if (existing && existing.status === "saved") {
        toast.info("Слово уже в вашей коллекции");
        return;
      }

      const updatedLocal = [
        ...localSaved.filter((w) => w.wordKey !== wordKey),
        { wordKey, status: "saved" as const },
      ];
      setLocalSaved(updatedLocal);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLocal));
      } catch (e) {}

      if (user) {
        try {
          const vocabWord = getVocabWord(wordKey);
          const { error } = await supabase.from("user_vocabulary").upsert(
            {
              user_id: user.id,
              word_key: wordKey,
              status: "saved",
              word: vocabWord?.word || wordKey,
              definition: vocabWord?.definition || "",
              translation: "",
              example: vocabWord?.example_sentence || "",
            },
            { onConflict: "user_id,word_key" }
          );

          if (error) {
            console.warn("Supabase upsert failed:", error);
            toast.success("Добавлено (сохранено в браузере)");
            return;
          }
          qc.invalidateQueries({ queryKey: ["user-saved-vocabulary-v2", user.id] });
          toast.success("Добавлено в Мои слова");
        } catch (err) {
          console.warn("Supabase exception:", err);
          toast.success("Добавлено (сохранено в браузере)");
        }
      } else {
        toast.success("Добавлено в Мои слова (локально)");
      }
    },
    [user, savedWords, localSaved, qc]
  );

  const toggleWordStatus = useCallback(
    async (wordKey: string, nextStatus: "saved" | "mastered") => {
      const updatedLocal = [
        ...localSaved.filter((w) => w.wordKey !== wordKey),
        { wordKey, status: nextStatus },
      ];
      setLocalSaved(updatedLocal);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLocal));
      } catch (e) {}

      if (user) {
        try {
          const vocabWord = getVocabWord(wordKey);
          const { error } = await supabase.from("user_vocabulary").upsert(
            {
              user_id: user.id,
              word_key: wordKey,
              status: nextStatus,
              word: vocabWord?.word || wordKey,
              definition: vocabWord?.definition || "",
              translation: "",
              example: vocabWord?.example_sentence || "",
            },
            { onConflict: "user_id,word_key" }
          );

          if (error) {
            console.warn("Supabase status toggle failed:", error);
            toast.success(nextStatus === "mastered" ? "Отмечено как выученное" : "Вернули на повторение");
            return;
          }
          qc.invalidateQueries({ queryKey: ["user-saved-vocabulary-v2", user.id] });
          toast.success(nextStatus === "mastered" ? "Отмечено как выученное!" : "Вернули на повторение");
        } catch (err) {
          console.warn("Supabase toggle exception:", err);
          toast.success(nextStatus === "mastered" ? "Отмечено как выученное" : "Вернули на повторение");
        }
      } else {
        toast.success(nextStatus === "mastered" ? "Отмечено как выученное!" : "Вернули на повторение");
      }
    },
    [user, localSaved, qc]
  );

  return {
    savedWords,
    isLoading: user ? isLoading : false,
    saveWord,
    toggleWordStatus,
  };
}
