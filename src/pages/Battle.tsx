import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { cn } from "@/lib/utils";
import {
  Swords,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  Trophy,
  Zap,
  CheckCircle2,
  XCircle,
  Bot,
  Users,
  RotateCcw,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getFallbackQuestions } from "@/data/mockSatQuestions";
import {
  playClickSound,
  playSuccessSound,
  playErrorSound,
  playChestRewardSound,
} from "@/utils/audio";

interface BattleQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface BotCompetitor {
  name: string;
  icon: "bot" | "zap" | "target";
  targetSat: string;
  accuracy: number;
}

const AI_BOTS: BotCompetitor[] = [
  { name: "Alex (1540)", icon: "bot", targetSat: "MIT Aspirant", accuracy: 0.8 },
  { name: "Sofia (1490)", icon: "zap", targetSat: "Stanford Bound", accuracy: 0.75 },
  { name: "David (1510)", icon: "target", targetSat: "Harvard Target", accuracy: 0.78 },
];

export const Battle = () => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const isRu = language === "ru";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");

  // Local Guest state
  const [guestName, setGuestName] = useState("");
  const [isGuestJoined, setIsGuestJoined] = useState(false);

  const myPlayerId = useMemo(() => {
    if (user?.id) return user.id;
    let stored = sessionStorage.getItem("satango_battle_guest_id");
    if (!stored) {
      stored = `guest_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("satango_battle_guest_id", stored);
    }
    return stored;
  }, [user?.id]);

  const myDisplayName = useMemo(() => {
    if (user) {
      return (
        profile?.display_name ||
        user.email?.split("@")[0] ||
        (isRu ? "Игрок" : "Player")
      );
    }
    return guestName.trim() || (isRu ? "Гость" : "Guest");
  }, [user, profile, guestName, isRu]);

  // Mode: "hub" | "ai" | "pvp"
  const [battleMode, setBattleMode] = useState<"hub" | "ai" | "pvp">(
    roomId ? "pvp" : "hub"
  );
  const [isHost, setIsHost] = useState(false);

  // Check if I am the host of this room
  const isRoomHost = useMemo(() => {
    if (!roomId) return false;
    return isHost || sessionStorage.getItem(`satango_room_host_${roomId}`) === "true";
  }, [roomId, isHost]);

  // PVP State
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [pvpGameStarted, setPvpGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Questions & gameplay state
  const [activeQuestions, setActiveQuestions] = useState<BattleQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [myDone, setMyDone] = useState(false);

  // Opponent progress (live updates via WebSockets)
  const [oppScore, setOppScore] = useState(0);
  const [oppCurrentIndex, setOppCurrentIndex] = useState(0);
  const [oppDone, setOppDone] = useState(false);

  // AI Opponent simulation state
  const [activeBot, setActiveBot] = useState<BotCompetitor>(AI_BOTS[0]);
  const [isAiBattleFinished, setIsAiBattleFinished] = useState(false);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Channel reference
  const channelRef = useRef<any>(null);

  // Helper to load questions
  const loadQuestions = useCallback(async (): Promise<BattleQuestion[]> => {
    try {
      const { data: dbQuestions } = await supabase
        .from("questions")
        .select("id, question_text, options, correct_answer, explanation")
        .limit(30);

      if (dbQuestions && dbQuestions.length >= 5) {
        return [...dbQuestions]
          .sort(() => 0.5 - Math.random())
          .slice(0, 5)
          .map((q) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options as string[],
            correct_answer: q.correct_answer,
            explanation: q.explanation || undefined,
          }));
      }
    } catch {
      // Fallback
    }

    const fallbacks = getFallbackQuestions(null, null, 5);
    return fallbacks.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));
  }, []);

  // =========================================================================
  // SUPABASE REALTIME PRESENCE & BROADCAST ENGINE
  // =========================================================================
  useEffect(() => {
    if (!roomId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // If friend opened URL without auth and hasn't picked name yet, wait
    if (!user && !isGuestJoined && !isRoomHost) return;

    setBattleMode("pvp");

    const channelName = `battle_room_${roomId.toLowerCase().trim()}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: myPlayerId },
      },
    });

    channelRef.current = channel;

    channel
      // Handshake 1: Player joined
      .on("broadcast", { event: "PLAYER_JOINED" }, (payload: any) => {
        const { senderId, name } = payload.payload;
        if (senderId !== myPlayerId) {
          setOpponentName(name || (isRu ? "Соперник" : "Opponent"));
          setOpponentConnected(true);
          playSuccessSound();
          toast.success(
            isRu
              ? `⚔️ ${name || "Соперник"} готов к дуэли!`
              : `⚔️ ${name || "Opponent"} ready to battle!`
          );

          // Respond back with ACK + Questions
          channel.send({
            type: "broadcast",
            event: "PLAYER_ACK",
            payload: {
              senderId: myPlayerId,
              name: myDisplayName,
              questions: activeQuestions,
            },
          });
        }
      })
      // Handshake 2: Player ACK
      .on("broadcast", { event: "PLAYER_ACK" }, (payload: any) => {
        const { senderId, name, questions } = payload.payload;
        if (senderId !== myPlayerId) {
          setOpponentName(name || (isRu ? "Соперник" : "Opponent"));
          setOpponentConnected(true);
          if (questions && questions.length > 0) {
            setActiveQuestions(questions);
          }
        }
      })
      // Presence tracking
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherKeys = Object.keys(state).filter((k) => k !== myPlayerId);
        if (otherKeys.length > 0) {
          const firstOther = (state[otherKeys[0]] as any)?.[0];
          if (firstOther) {
            setOpponentName(firstOther.name || (isRu ? "Соперник" : "Opponent"));
            setOpponentConnected(true);
          }
        }
      })
      .on("presence", { event: "leave" }, ({ key }: any) => {
        if (key !== myPlayerId) {
          setOpponentConnected(false);
          toast.info(isRu ? "Соперник покинул комнату." : "Opponent left the room.");
        }
      })
      // Match starts
      .on("broadcast", { event: "START_MATCH" }, (payload: any) => {
        const { questions } = payload.payload;
        if (questions && questions.length > 0) {
          setActiveQuestions(questions);
        }
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setMyScore(0);
        setMyDone(false);
        setOppScore(0);
        setOppCurrentIndex(0);
        setOppDone(false);
        setPvpGameStarted(true);
        playClickSound();
        toast.info(isRu ? "🔥 Бой начался! Удачи!" : "🔥 Match started! Good luck!");
      })
      // Live Score Update
      .on("broadcast", { event: "SCORE_UPDATE" }, (payload: any) => {
        const { senderId, score, questionIndex, done } = payload.payload;
        if (senderId !== myPlayerId) {
          setOppScore(score);
          setOppCurrentIndex(questionIndex);
          if (done) {
            setOppDone(true);
          }
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({
            name: myDisplayName,
            id: myPlayerId,
          });
          channel.send({
            type: "broadcast",
            event: "PLAYER_JOINED",
            payload: {
              senderId: myPlayerId,
              name: myDisplayName,
            },
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, myPlayerId, myDisplayName, user, isGuestJoined, isRu, activeQuestions]);

  // =========================================================================
  // AI OPPONENT SIMULATION
  // =========================================================================
  useEffect(() => {
    if (battleMode !== "ai" || isAiBattleFinished || activeQuestions.length === 0) {
      if (botTimerRef.current) clearInterval(botTimerRef.current);
      return;
    }

    const intervalTime = 6000 + Math.random() * 3000;
    botTimerRef.current = setInterval(() => {
      setOppCurrentIndex((prevIdx) => {
        if (prevIdx >= activeQuestions.length - 1) {
          if (botTimerRef.current) clearInterval(botTimerRef.current);
          setOppDone(true);
          return prevIdx;
        }

        const next = prevIdx + 1;
        if (Math.random() < activeBot.accuracy) {
          setOppScore((s) => s + 1);
        }
        return next;
      });
    }, intervalTime);

    return () => {
      if (botTimerRef.current) clearInterval(botTimerRef.current);
    };
  }, [battleMode, isAiBattleFinished, activeQuestions.length, activeBot.accuracy]);

  // Award victory XP helper
  const awardWinnerXP = async (amount: number = 100) => {
    playChestRewardSound();
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    if (!user) return;
    try {
      const { data: progress } = await supabase
        .from("user_progress")
        .select("xp")
        .eq("user_id", user.id)
        .single();

      if (progress) {
        await supabase
          .from("user_progress")
          .update({ xp: (progress.xp || 0) + amount })
          .eq("user_id", user.id);
      }
      toast.success(
        isRu
          ? `🏆 Победа в дуэли! +${amount} XP начислено!`
          : `🏆 Battle Victory! +${amount} XP awarded!`
      );
    } catch {
      // Ignored
    }
  };

  // =========================================================================
  // ACTIONS: START AI BATTLE
  // =========================================================================
  const startAiBattle = async (bot: BotCompetitor) => {
    playClickSound();
    setLoading(true);
    setActiveBot(bot);

    const questions = await loadQuestions();
    setActiveQuestions(questions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setMyScore(0);
    setMyDone(false);
    setOppScore(0);
    setOppCurrentIndex(0);
    setOppDone(false);
    setIsAiBattleFinished(false);
    setBattleMode("ai");
    setLoading(false);
  };

  // =========================================================================
  // ACTIONS: CREATE 1v1 PVP ROOM (HOST)
  // =========================================================================
  const createRoom = async () => {
    playClickSound();
    setLoading(true);

    try {
      const questions = await loadQuestions();
      setActiveQuestions(questions);
      setPvpGameStarted(false);

      const generatedCode = `SAT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      sessionStorage.setItem(`satango_room_host_${generatedCode}`, "true");
      setIsHost(true);
      setIsGuestJoined(true);
      if (!user && !guestName) {
        setGuestName(isRu ? "Создатель комнаты" : "Host");
      }

      // Gracefully persist to Supabase battles table if possible
      if (user) {
        try {
          await supabase.from("battles").insert({
            id: crypto.randomUUID(),
            created_by: user.id,
            status: "pending",
            questions_data: questions as any,
            scores: {
              [user.id]: { score: 0, current: 0, done: false },
            },
          });
        } catch {
          // Broadcast channel works even without DB table
        }
      }

      navigate(`/battle?room=${generatedCode}`);
    } catch (err) {
      console.error("Room creation error", err);
      toast.error(
        isRu
          ? "Ошибка создания. Запуск дуэли с ИИ-ботом..."
          : "Error creating room. Starting AI match..."
      );
      startAiBattle(AI_BOTS[0]);
    } finally {
      setLoading(false);
    }
  };

  // Start the PVP match
  const startPvpMatch = async () => {
    playClickSound();
    let questionsToSend = activeQuestions;
    if (questionsToSend.length === 0) {
      questionsToSend = await loadQuestions();
      setActiveQuestions(questionsToSend);
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "START_MATCH",
        payload: {
          questions: questionsToSend,
        },
      });
    }

    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setMyScore(0);
    setMyDone(false);
    setOppScore(0);
    setOppCurrentIndex(0);
    setOppDone(false);
    setPvpGameStarted(true);
  };

  // Rematch action
  const requestRematch = async () => {
    playClickSound();
    setLoading(true);
    const newQuestions = await loadQuestions();
    setActiveQuestions(newQuestions);

    if (battleMode === "ai") {
      startAiBattle(activeBot);
    } else if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "START_MATCH",
        payload: { questions: newQuestions },
      });
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setMyScore(0);
      setMyDone(false);
      setOppScore(0);
      setOppCurrentIndex(0);
      setOppDone(false);
      setPvpGameStarted(true);
    }
    setLoading(false);
  };

  // =========================================================================
  // ACTIONS: ANSWER A QUESTION
  // =========================================================================
  const handleAnswer = (answerIndex: number) => {
    if (showResult || activeQuestions.length === 0) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const question = activeQuestions[currentIndex];
    const isCorrect = answerIndex === question.correct_answer;
    const newScore = isCorrect ? myScore + 1 : myScore;

    if (isCorrect) {
      playSuccessSound();
      setMyScore(newScore);
    } else {
      playErrorSound();
    }

    const nextIndex = currentIndex + 1;
    const isFinished = nextIndex >= activeQuestions.length;

    if (isFinished) {
      setMyDone(true);
    }

    // AI Mode
    if (battleMode === "ai") {
      if (isFinished) {
        setIsAiBattleFinished(true);
        if (botTimerRef.current) clearInterval(botTimerRef.current);
        if (newScore > oppScore) {
          awardWinnerXP(50);
        } else if (newScore === oppScore) {
          toast.info(isRu ? "Ничья! Достойный поединок." : "It's a draw! Well played.");
        } else {
          toast.error(isRu ? "Поражение! Попробуйте еще раз." : "Defeat! Keep practicing.");
        }
      }
      return;
    }

    // PVP Mode: Broadcast progress over WebSockets
    if (battleMode === "pvp" && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "SCORE_UPDATE",
        payload: {
          senderId: myPlayerId,
          score: newScore,
          questionIndex: nextIndex,
          done: isFinished,
        },
      });

      if (isFinished && oppDone) {
        if (newScore > oppScore) {
          awardWinnerXP(100);
        } else if (newScore === oppScore) {
          toast.info(isRu ? "Ничья! Отличный матч." : "It's a Draw! Well played.");
        } else {
          toast.error(isRu ? "Поражение! В следующий раз повезет." : "Defeat! Keep practicing.");
        }
      }
    }
  };

  const nextQuestion = () => {
    playClickSound();
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/battle?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    playClickSound();
    toast.success(isRu ? "Ссылка на дуэль скопирована!" : "Battle link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // =========================================================================
  // VIEW 1: DUEL SELECTION HUB
  // =========================================================================
  if (battleMode === "hub" && !roomId) {
    return (
      <AppShell title={isRu ? "SAT Дуэль 1v1" : "SAT Battle Arena"}>
        <div className="max-w-4xl mx-auto space-y-8 font-sans">
          {/* Header */}
          <div className="border-b border-border/60 pb-5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {isRu ? "1v1 SAT Дуэли на скорость" : "1v1 SAT Battle Mode"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isRu
                ? "5 экспресс-вопросов SAT в реальном времени. Тренируйте скорость решения против умного бота или бросьте вызов однокласснику."
                : "5 rapid Digital SAT questions in real-time. Practice against AI bots or challenge a classmate to test your speed."}
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: AI Battle */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-5 shadow-xs hover:border-neutral-500 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {isRu ? "Мгновенный старт" : "Instant Match"}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isRu ? "Дуэль против ИИ-бота" : "Solo Battle vs AI Bot"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isRu
                      ? "Бот отвечает в реальном времени с адаптивной скоростью (6–9 сек). Идеально для разминки в любое время."
                      : "The AI bot solves problems in real-time with authentic pacing. Ideal for warming up anytime."}
                  </p>
                </div>

                {/* Bot Picker */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    {isRu ? "Выберите соперника:" : "Select your opponent:"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {AI_BOTS.map((bot) => (
                      <button
                        key={bot.name}
                        onClick={() => startAiBattle(bot)}
                        disabled={loading}
                        className="p-3 rounded-xl border border-border/70 hover:border-blue-500/50 hover:bg-muted/50 transition-colors text-center space-y-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 active:scale-95"
                      >
                        <div className="h-6 flex items-center justify-center">
                          {bot.icon === "bot" && <Bot className="w-5 h-5 text-blue-400" />}
                          {bot.icon === "zap" && <Zap className="w-5 h-5 text-violet-400" />}
                          {bot.icon === "target" && <Target className="w-5 h-5 text-rose-400" />}
                        </div>
                        <span className="text-xs font-bold text-foreground block truncate">
                          {bot.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {bot.targetSat}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => startAiBattle(AI_BOTS[0])}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 text-neutral-950" />
                  <span>
                    {loading
                      ? isRu
                        ? "Загрузка..."
                        : "Loading..."
                      : isRu
                      ? "Начать дуэль с Alex (1540)"
                      : "Quick Duel vs Alex (1540)"}
                  </span>
                </button>
              </div>
            </div>

            {/* Card 2: PVP Friend Duel */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-5 shadow-xs hover:border-neutral-500 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    {isRu ? "Live Мультиплеер" : "1v1 PvP Live"}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isRu ? "Сразиться с другом" : "Challenge a Classmate"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isRu
                      ? "Создайте лобби и отправьте ссылку в Telegram или WhatsApp. Другу даже не обязательно регистрироваться заранее."
                      : "Create a private duel room, send an invite link to your peer, and prove who knows SAT better."}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Trophy className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isRu ? "Награды дуэли:" : "Battle Rewards:"}</span>
                  </div>
                  <p>
                    {isRu
                      ? "Победитель получает +100 XP и поднимается в таблице лидеров платформы."
                      : "Winner earns +100 XP and climbs the global SATANGO leaderboard."}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={createRoom}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                >
                  <Swords className="w-4 h-4 text-neutral-950" />
                  <span>
                    {loading
                      ? isRu
                        ? "Создание комнаты..."
                        : "Preparing Arena..."
                      : isRu
                      ? "Создать дуэльную комнату"
                      : "Create 1v1 Room"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // =========================================================================
  // VIEW 2: GUEST JOIN CARD (FRIEND OPENED INVITE LINK BUT HAS NO NAME YET)
  // =========================================================================
  if (battleMode === "pvp" && roomId && !user && !isGuestJoined && !isRoomHost) {
    return (
      <AppShell title={isRu ? "Приглашение на дуэль" : "Duel Invitation"}>
        <div className="max-w-md mx-auto py-12 px-4 space-y-6 font-sans text-center">
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Swords className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {isRu ? "Вас вызвали на SAT Дуэль 1v1!" : "You've been challenged to a Duel!"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isRu
                ? "5 экспресс-вопросов Digital SAT на время. Введите ваше имя для участия:"
                : "5 rapid Digital SAT questions. Enter your name to enter the arena:"}
            </p>
          </div>

          <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-4 shadow-sm text-left">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                {isRu ? "Ваше имя или никнейм:" : "Your Name or Nickname:"}
              </label>
              <input
                type="text"
                maxLength={25}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder={isRu ? "Например: Алихан" : "e.g. Alex"}
                className="w-full bg-muted/60 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              onClick={() => {
                const nameToUse = guestName.trim() || (isRu ? "Игрок" : "Player");
                setGuestName(nameToUse);
                setIsGuestJoined(true);
                playClickSound();
                toast.success(isRu ? "Вы в комнате дуэли!" : "Entered the battle room!");
              }}
              className="w-full h-11 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs transition-all shadow-xs active:scale-[0.98]"
            >
              <span>{isRu ? "Вступить в бой!" : "Enter Arena!"}</span>
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {isRu
              ? "Без нудной регистрации. Игра запустится прямо в браузере."
              : "No lengthy registration required. Plays right inside your browser."}
          </p>
        </div>
      </AppShell>
    );
  }

  // =========================================================================
  // VIEW 3: PVP LOBBY (WAITING FOR OPPONENT OR READY TO LAUNCH)
  // =========================================================================
  if (battleMode === "pvp" && !pvpGameStarted) {
    const shareUrl = `${window.location.origin}/battle?room=${roomId}`;

    return (
      <AppShell title={isRu ? "Лобби дуэли" : "SAT Battle Lobby"}>
        <div className="max-w-md mx-auto py-8 px-4 space-y-6 font-sans text-center">
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Swords className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {opponentConnected
                ? isRu
                  ? "Соперник подключился!"
                  : "Opponent Connected!"
                : isRu
                ? "Комната готова"
                : "Room Ready"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {opponentConnected
                ? isRu
                  ? `Готовы к поединку: ${myDisplayName} vs ${opponentName}`
                  : `Duel ready: ${myDisplayName} vs ${opponentName}`
                : isRu
                ? "Отправьте ссылку другу, чтобы он зашёл в бой."
                : "Send this invite link to your friend to start."}
            </p>
          </div>

          {/* Versus Badges */}
          <div className="flex items-center justify-center gap-4 bg-card border border-border/80 p-4 rounded-2xl shadow-xs">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mx-auto text-blue-400 font-bold text-xs">
                {myDisplayName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-foreground block truncate max-w-[100px]">
                {myDisplayName}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold block">Online</span>
            </div>

            <div className="text-xs font-mono-tech font-black text-muted-foreground">VS</div>

            <div className="text-center space-y-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mx-auto font-bold text-xs border",
                  opponentConnected
                    ? "bg-violet-500/10 border-violet-500/25 text-violet-400"
                    : "bg-muted/40 border-border text-muted-foreground"
                )}
              >
                {opponentConnected ? (opponentName?.slice(0, 2).toUpperCase() || "OP") : "?"}
              </div>
              <span className="text-xs font-bold text-foreground block truncate max-w-[100px]">
                {opponentConnected ? opponentName : isRu ? "Ожидание..." : "Waiting..."}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold block",
                  opponentConnected ? "text-emerald-400" : "text-amber-400 animate-pulse"
                )}
              >
                {opponentConnected ? "Ready" : isRu ? "Подключение..." : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Copy link bar */}
          <div className="flex items-center gap-2 bg-card border border-border/80 p-2.5 rounded-xl shadow-xs">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent border-none text-xs font-medium text-foreground select-all focus:outline-none truncate px-1"
            />
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? (isRu ? "Скопировано" : "Copied") : (isRu ? "Копия" : "Copy")}</span>
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
                isRu ? "Сразись со мной в SAT дуэли на SATANGO! ⚔️" : "Fight me in a Digital SAT Battle on SATANGO! ⚔️"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                (isRu ? "Сразись со мной в SAT дуэли на SATANGO! ⚔️ " : "Fight me in a Digital SAT Battle on SATANGO! ⚔️ ") + shareUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Launch button */}
          <button
            onClick={startPvpMatch}
            className={cn(
              "w-full h-11 rounded-xl font-bold text-xs transition-all shadow-md active:scale-[0.98]",
              opponentConnected
                ? "bg-white hover:bg-neutral-200 text-neutral-950"
                : "bg-white/10 hover:bg-white/20 text-neutral-300"
            )}
          >
            <span>
              {opponentConnected
                ? isRu
                  ? "Начать поединок!"
                  : "Start Match Now!"
                : isRu
                ? "Начать бой (или ждать соперника)"
                : "Start Match (or wait for peer)"}
            </span>
          </button>

          <div className="pt-2">
            <button
              onClick={() => {
                setBattleMode("hub");
                navigate("/battle");
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-4"
            >
              {isRu ? "Вернуться в хаб дуэлей" : "Back to Arena"}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // =========================================================================
  // VIEW 4: ACTIVE BATTLE SCREEN (AI OR PVP)
  // =========================================================================
  const isCompletedView =
    (battleMode === "ai" && isAiBattleFinished) ||
    (battleMode === "pvp" && myDone && oppDone);

  if (!isCompletedView && activeQuestions.length > 0 && currentIndex < activeQuestions.length) {
    const question = activeQuestions[currentIndex];
    const options = question.options;

    const oppDisplayName = battleMode === "ai" ? activeBot.name : opponentName || (isRu ? "Соперник" : "Opponent");
    const oppScoreDisplay = oppScore;
    const oppCurrentDisplay = oppCurrentIndex + 1;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Dynamic header showing live duel score */}
        <header className="h-14 border-b border-border/70 bg-card px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
          <button
            onClick={() => {
              if (confirm(isRu ? "Покинуть дуэль?" : "Leave battle?")) {
                setBattleMode("hub");
                navigate("/battle");
              }
            }}
            className="w-8 h-8 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Versus live pill */}
          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="text-right">
              <span className="block text-foreground truncate max-w-[90px]">{myDisplayName}</span>
              <span className="text-white tabular-nums font-mono-tech">{myScore}/5</span>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-mono-tech">
              vs
            </div>
            <div>
              <span className="block text-muted-foreground truncate max-w-[90px]">{oppDisplayName}</span>
              <span className="text-muted-foreground tabular-nums font-mono-tech">
                {oppScoreDisplay}/5 (Q{Math.min(5, oppCurrentDisplay)})
              </span>
            </div>
          </div>

          {/* Round counter */}
          <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted/60 border border-border/70 text-foreground tabular-nums">
            Q{currentIndex + 1} / {activeQuestions.length}
          </div>
        </header>

        {/* Question Area */}
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-3 shadow-xs">
            <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              SAT Rapid Question
            </span>
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
              {question.question_text}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === question.correct_answer;

              let btnStyle = "bg-card border-border/80 hover:border-neutral-500 hover:bg-muted/40";
              if (showResult) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "bg-rose-500/15 border-rose-500 text-rose-300";
                } else {
                  btnStyle = "opacity-50 border-border/50 bg-card";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-3.5 sm:p-4 rounded-xl border text-left font-medium text-xs sm:text-sm transition-colors flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 active:scale-[0.99]",
                    btnStyle
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>
                  {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation if answered */}
          {showResult && question.explanation && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{isRu ? "Объяснение:" : "Explanation:"}</strong> {question.explanation}
            </div>
          )}

          {/* Next Button */}
          {showResult && (
            <div className="pt-2">
              <button
                onClick={nextQuestion}
                className="w-full h-11 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs transition-all shadow-xs active:scale-[0.98]"
              >
                {currentIndex + 1 >= activeQuestions.length
                  ? isRu
                    ? "Посмотреть итоги дуэли"
                    : "View Final Results"
                  : isRu
                  ? "Следующий вопрос"
                  : "Next Question"}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 5: FINAL RESULTS SCREEN
  // =========================================================================
  const oppFinalScore = oppScore;
  const oppFinalName = battleMode === "ai" ? activeBot.name : opponentName || (isRu ? "Соперник" : "Opponent");
  const didWin = myScore > oppFinalScore;
  const didDraw = myScore === oppFinalScore;

  return (
    <AppShell title={isRu ? "Итоги дуэли" : "Battle Results"}>
      <div className="max-w-md mx-auto py-10 px-4 space-y-6 font-sans text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mx-auto text-blue-400">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {didWin
              ? isRu
                ? "Победа в дуэли!"
                : "Battle Won!"
              : didDraw
              ? isRu
                ? "Боевая ничья!"
                : "It's a Draw!"
              : isRu
              ? "Поражение!"
              : "Defeat!"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {didWin
              ? isRu
                ? "Отличная скорость и точность! Вы доказали мастерство."
                : "Congratulations! You proved your SAT mastery."
              : didDraw
              ? isRu
                ? "Равный счет! Сразитесь еще раз для выявления лидера."
                : "A tight match! You are evenly matched."
              : isRu
              ? "Не расстраивайтесь. Тренируйте Desmos и грамматику в хаках."
              : "Keep studying and challenge them to a rematch."}
          </p>
        </div>

        {/* Scores summary */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 flex items-center justify-around shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block truncate max-w-[120px]">
              {myDisplayName}
            </span>
            <span className="text-3xl font-extrabold text-foreground tabular-nums">{myScore}/5</span>
          </div>
          <div className="w-px h-10 bg-border/60" />
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block truncate max-w-[120px]">
              {oppFinalName}
            </span>
            <span className="text-3xl font-extrabold text-muted-foreground tabular-nums">
              {oppFinalScore}/5
            </span>
          </div>
        </div>

        {didWin && user && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRu ? "+100 XP начислено за победу!" : "+100 XP Victory Bonus Added!"}</span>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            onClick={requestRematch}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs transition-all shadow-xs active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{loading ? (isRu ? "Генерация..." : "Loading...") : (isRu ? "Сыграть реванш" : "Play Rematch")}</span>
          </button>
          <button
            onClick={() => {
              setBattleMode("hub");
              navigate("/battle");
            }}
            className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            {isRu ? "В главное меню дуэлей" : "Back to Duel Hub"}
          </button>
        </div>
      </div>
    </AppShell>
  );
};

export default Battle;
