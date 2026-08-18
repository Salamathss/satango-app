import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Swords, Copy, Check, Share2, ArrowLeft, Trophy, Zap, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface BattleQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
}

interface BattleState {
  id: string;
  created_by: string;
  opponent_id: string | null;
  status: "pending" | "active" | "completed";
  scores: Record<string, { score: number; current: number; done: boolean }>;
  questions_data: BattleQuestion[];
}

export const Battle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");

  const [battle, setBattle] = useState<BattleState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Local game state for active battle
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Realtime subscription setup
  useEffect(() => {
    if (!roomId || !user) return;

    const fetchBattle = async () => {
      const { data, error } = await supabase
        .from("battles")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) {
        toast.error("Battle room not found.");
        navigate("/battle");
        return;
      }
      setBattle(data as any);
    };

    fetchBattle();

    const channel = supabase
      .channel(`battle:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "battles",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setBattle(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user, navigate]);

  // Award victory XP
  const awardWinnerXP = async () => {
    if (!user) return;
    const { data: progress } = await supabase
      .from("user_progress")
      .select("xp")
      .eq("user_id", user.id)
      .single();

    if (progress) {
      await supabase
        .from("user_progress")
        .update({ xp: (progress.xp || 0) + 100 })
        .eq("user_id", user.id);
      
      toast.success("🏆 Battle Victory! +100 XP awarded!");
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Create Battle Room
  const createRoom = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch 100 questions to pick 5 random ones
      const { data: allQuestions } = await supabase
        .from("questions")
        .select("id, question_text, options, correct_answer")
        .limit(100);

      if (!allQuestions || allQuestions.length < 5) {
        toast.error("Not enough questions in database to start a battle.");
        setLoading(false);
        return;
      }

      // Select 5 random questions
      const selected = [...allQuestions]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5)
        .map((q) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options as string[],
          correct_answer: q.correct_answer,
        }));

      // Insert battle
      const { data, error } = await supabase
        .from("battles")
        .insert({
          created_by: user.id,
          status: "pending",
          questions_data: selected,
          scores: {
            [user.id]: { score: 0, current: 0, done: false },
          },
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/battle?room=${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create battle room.");
    } finally {
      setLoading(false);
    }
  };

  // Join Battle Room
  const joinRoom = async () => {
    if (!user || !roomId || !battle) return;
    setLoading(true);

    try {
      const updatedScores = {
        ...battle.scores,
        [user.id]: { score: 0, current: 0, done: false },
      };

      const { error } = await supabase
        .from("battles")
        .update({
          opponent_id: user.id,
          status: "active",
          scores: updatedScores,
        })
        .eq("id", roomId);

      if (error) throw error;
      toast.success("Joined the battle! Ready to fight!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to join battle room.");
    } finally {
      setLoading(false);
    }
  };

  // Answer Submission
  const handleAnswer = async (answerIndex: number) => {
    if (!user || !battle || showResult) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const question = battle.questions_data[currentIndex];
    const isCorrect = answerIndex === question.correct_answer;

    // Update local and database scores
    const userStats = battle.scores[user.id] || { score: 0, current: 0, done: false };
    const nextIndex = currentIndex + 1;
    const isFinished = nextIndex >= battle.questions_data.length;

    const newScore = isCorrect ? userStats.score + 1 : userStats.score;

    const updatedScores = {
      ...battle.scores,
      [user.id]: {
        score: newScore,
        current: nextIndex,
        done: isFinished,
      },
    };

    let updatedStatus = battle.status;
    const opponentId = battle.created_by === user.id ? battle.opponent_id : battle.created_by;
    const opponentStats = opponentId ? battle.scores[opponentId] : null;

    if (isFinished && opponentStats?.done) {
      updatedStatus = "completed";
    }

    const { error } = await supabase
      .from("battles")
      .update({
        scores: updatedScores,
        status: updatedStatus,
      })
      .eq("id", roomId!);

    if (error) {
      console.error("Failed to update scores", error);
    }

    if (isFinished && opponentStats?.done) {
      // Determine winner when both are done
      const myFinal = newScore;
      const oppFinal = opponentStats.score;
      if (myFinal > oppFinal) {
        awardWinnerXP();
      } else if (myFinal === oppFinal) {
        toast.info("🤝 It's a Draw! Well played.");
      } else {
        toast.error("💔 Defeat! Keep practicing to get stronger.");
      }
    } else if (isFinished) {
      toast.info("Waiting for opponent to finish...");
    }
  };

  const nextQuestion = () => {
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/battle?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    toast.success("Battle link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 1. Setup / Lobby phase
  if (!roomId) {
    return (
      <AppShell title="SAT Battle">
        <div className="max-w-md mx-auto text-center py-12 px-4 space-y-6 animate-spring-in">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <Swords className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">SAT Battle Mode</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Challenge a friend to a fast-paced 5-question SAT duel. Compete in real-time, test your speed, and earn <span className="text-xp font-bold">+100 XP</span> on victory!
            </p>
          </div>
          <Button
            onClick={createRoom}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-black tap-feedback active:scale-[0.98]"
          >
            {loading ? "Preparing Battle..." : "Create Duel Room"}
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!battle) {
    return (
      <AppShell title="SAT Battle">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-center space-y-2">
            <Swords className="w-10 h-10 text-muted-foreground mx-auto animate-spin" />
            <p className="text-muted-foreground font-semibold">Entering Duel Arena...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const myProgress = battle.scores[user?.id || ""] || { score: 0, current: 0, done: false };
  const opponentId = battle.created_by === user?.id ? battle.opponent_id : battle.created_by;
  const opponentProgress = opponentId ? battle.scores[opponentId] : null;

  // 2. Pending match lobby
  if (battle.status === "pending") {
    const shareUrl = `${window.location.origin}/battle?room=${roomId}`;
    return (
      <AppShell title="SAT Battle Lobby">
        <div className="max-w-md mx-auto py-8 px-4 space-y-6 animate-spring-in text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-pulse">
            <Swords className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black">Lobby Prepared</h2>
            <p className="text-muted-foreground text-sm">
              Send the invite link to your classmate to start the duel.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-card border border-border/50 p-3 rounded-2xl">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent border-none text-xs font-semibold select-all focus:outline-none truncate"
            />
            <Button size="icon" variant="ghost" onClick={copyLink} className="h-9 w-9 shrink-0">
              {isCopied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Fight me in a Digital SAT Battle on SATANGO! ⚔️")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-12 bg-[#229ED9] hover:bg-[#229ED9]/90 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Telegram
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Fight me in a Digital SAT Battle on SATANGO! ⚔️ " + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" /> WhatsApp
            </a>
          </div>

          {opponentId && (
            <Button onClick={joinRoom} disabled={loading} className="w-full h-12 rounded-2xl font-black">
              {loading ? "Starting..." : "Start Battle!"}
            </Button>
          )}

          {battle.created_by !== user?.id && !opponentId && (
            <Button onClick={joinRoom} disabled={loading} className="w-full h-14 rounded-2xl text-base font-black">
              {loading ? "Joining Arena..." : "Join & Fight!"}
            </Button>
          )}
        </div>
      </AppShell>
    );
  }

  // 3. Active Battle phase
  if (battle.status === "active" && !myProgress.done) {
    const question = battle.questions_data[currentIndex];
    const options = question.options;

    return (
      <div className="min-h-screen bg-background flex flex-col safe-top">
        {/* Dynamic header showing live duel score */}
        <div className="px-4 py-3 border-b border-border/50 bg-card flex items-center justify-between shadow-sm">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 font-extrabold text-xs">
            <div className="text-right">
              <span className="block font-black text-primary">You</span>
              <span className="text-muted-foreground">{myProgress.score}/5 pts</span>
            </div>
            <div className="bg-muted px-2.5 py-1 rounded-xl text-muted-foreground">VS</div>
            <div>
              <span className="block font-black text-muted-foreground">Opponent</span>
              <span className="text-muted-foreground">
                {opponentProgress ? `${opponentProgress.score}/5 pts (Q${opponentProgress.current + 1})` : "Waiting..."}
              </span>
            </div>
          </div>

          <div className="text-[10px] bg-primary/10 text-primary font-black px-2 py-1 rounded-md">
            Q{currentIndex + 1}/5
          </div>
        </div>

        {/* Scrollable question content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-36">
          <h2 className="text-xl font-bold leading-snug tracking-tight">{question.question_text}</h2>
          <div className="space-y-3">
            {options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === question.correct_answer;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-3xl text-left font-semibold text-[15px] transition-all duration-300 active:scale-[0.98] border-2 min-h-[64px]",
                    !showResult && "bg-card border-border hover:border-primary",
                    showResult && isCorrect && "bg-primary/10 border-primary scale-105",
                    showResult && isSelected && !isCorrect && "bg-destructive/10 border-destructive",
                    showResult && !isSelected && !isCorrect && "opacity-50 border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-2xl bg-muted flex items-center justify-center text-sm font-extrabold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next/Finish action footer */}
        {showResult && (
          <div className="fixed inset-x-0 bottom-0 px-4 pt-3 pb-6 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
            <Button
              onClick={nextQuestion}
              className="w-full h-14 rounded-3xl font-extrabold text-base active:scale-[0.97]"
            >
              {currentIndex + 1 >= battle.questions_data.length ? "Submit Duel Results" : "Next Question"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 4. Completed / Finished screen
  const myScore = myProgress.score;
  const oppScore = opponentProgress?.score ?? 0;
  const didWin = myScore > oppScore;
  const didDraw = myScore === oppScore;

  return (
    <AppShell title="Battle Results">
      <div className="max-w-md mx-auto text-center py-12 px-4 space-y-6 animate-spring-in">
        <span className="text-6xl block">
          {didWin ? "👑" : didDraw ? "🤝" : "💔"}
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">
            {didWin ? "Battle Won!" : didDraw ? "It's a Draw!" : "Defeat!"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {didWin ? "Congratulations! You proved your mastery." : didDraw ? "A tight match! You are evenly matched." : "Keep studying and challenge them to a rematch."}
          </p>
        </div>

        {/* Scores summary */}
        <div className="bg-card border border-border/50 rounded-3xl p-5 flex items-center justify-around">
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">YOUR SCORE</span>
            <span className="text-3xl font-black text-primary">{myScore}/5</span>
          </div>
          <div className="w-[1px] h-10 bg-border/50" />
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">OPPONENT SCORE</span>
            <span className="text-3xl font-black text-muted-foreground">{oppScore}/5</span>
          </div>
        </div>

        {didWin && (
          <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-xp">
            <Zap className="w-4 h-4" />
            <span>+100 XP Victory Bonus Added!</span>
          </div>
        )}

        <Button onClick={() => navigate("/")} className="w-full h-12 rounded-2xl font-black">
          Back to Dashboard
        </Button>
      </div>
    </AppShell>
  );
};

export default Battle;
