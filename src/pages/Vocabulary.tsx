import React, { useState, useMemo, useEffect } from "react";
import AppShell from "@/components/AppShell";
import SeoHead from "@/components/SeoHead";
import { CONTEXT_PASSAGES, getVocabWord, type ContextPassage, type VocabWord } from "@/lib/vocabulary";
import { useVocabularyStore } from "@/hooks/useVocabularyStore";
import {
  BookOpen,
  Sparkles,
  BookmarkPlus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCw,
  Check,
  Search,
  Volume2,
  BrainCircuit,
  Info,
  Flame,
  CheckSquare,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type TabType = "trainer" | "my-words";
type FilterType = "all" | "review" | "mastered";

interface DailyStats {
  streak: number;
  lastActiveDate: string | null;
  completedToday: number;
  correctToday: number;
}

// Helper for Text-to-Speech
const speakWord = (word: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    // Prefer a natural-sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === "en-US" && /(Google|Samantha|Natural)/i.test(v.name));
    utterance.voice = preferred || voices.find(v => v.lang === "en-US") || null;
    window.speechSynthesis.speak(utterance);
  } else {
    toast.error("Голосовой движок не поддерживается в вашем браузере");
  }
};

export default function Vocabulary() {
  const [activeTab, setActiveTab] = useState<TabType>("trainer");
  const { savedWords, saveWord, toggleWordStatus } = useVocabularyStore();

  // Daily Statistics & Streak state
  const [stats, setStats] = useState<DailyStats>(() => {
    try {
      const stored = localStorage.getItem("satango_vocab_daily_stats");
      if (stored) {
        const parsed = JSON.parse(stored) as DailyStats;
        const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");

        if (parsed.lastActiveDate === today) {
          return parsed;
        } else if (parsed.lastActiveDate === yesterday) {
          return {
            ...parsed,
            completedToday: 0,
            correctToday: 0,
          };
        } else {
          // Streak broken
          return {
            streak: 0,
            lastActiveDate: parsed.lastActiveDate,
            completedToday: 0,
            correctToday: 0,
          };
        }
      }
    } catch (e) {}

    return {
      streak: 0,
      lastActiveDate: null,
      completedToday: 0,
      correctToday: 0,
    };
  });

  // Save stats when updated
  const saveStats = (newStats: DailyStats) => {
    setStats(newStats);
    try {
      localStorage.setItem("satango_vocab_daily_stats", JSON.stringify(newStats));
    } catch (e) {}
  };

  // Update stats on answer submission
  const handleAnswerSubmitted = (isCorrect: boolean) => {
    const today = new Date().toLocaleDateString("en-CA");
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
    
    let newStreak = stats.streak;
    if (stats.lastActiveDate !== today) {
      if (stats.lastActiveDate === yesterday || stats.streak === 0) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const nextStats: DailyStats = {
      streak: newStreak,
      lastActiveDate: today,
      completedToday: stats.completedToday + 1,
      correctToday: stats.correctToday + (isCorrect ? 1 : 0),
    };

    saveStats(nextStats);
  };

  // Live Accuracy Calculation
  const accuracyPct = useMemo(() => {
    if (stats.completedToday === 0) return 0;
    return Math.round((stats.correctToday / stats.completedToday) * 100);
  }, [stats]);

  // Saved Active Words (saved status) count
  const activeSavedCount = useMemo(() => {
    return savedWords.filter((w) => w.status === "saved").length;
  }, [savedWords]);

  return (
    <AppShell title="Vocabulary" showStats={false}>
      <SeoHead
        title="SAT Vocabulary Context Trainer & Flashcards | Satango"
        description="Master Digital SAT vocabulary in realistic reading contexts with tone & nuance analysis and interactive flashcards."
        path="/vocabulary"
      />
      <div className="min-h-screen bg-background pb-24 pt-6 px-4 max-w-4xl mx-auto space-y-6">
        
        {/* Header & Subtitle */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-tech uppercase text-muted-foreground tracking-widest">
              <BrainCircuit className="w-4 h-4 text-primary" />
              <span>[ sat.vocab_lab ]</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SAT Vocabulary Lab
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Тренируйте контекстное использование слов из секции SAT Reading & Writing и сохраняйте их в личный словарь.
            </p>
          </div>
        </header>

        {/* 📈 Statistics Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-border/60 bg-card rounded-2xl p-3.5 flex items-center gap-3 shadow-sm hover:border-border transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Flame className="w-5.5 h-5.5 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono-tech uppercase text-muted-foreground leading-none">Streak</p>
              <p className="text-base sm:text-lg font-bold tracking-tight mt-1 leading-none">{stats.streak} дн.</p>
            </div>
          </div>

          <div className="border border-border/60 bg-card rounded-2xl p-3.5 flex items-center gap-3 shadow-sm hover:border-border transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CheckSquare className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono-tech uppercase text-muted-foreground leading-none">Карточки</p>
              <p className="text-base sm:text-lg font-bold tracking-tight mt-1 leading-none">{stats.completedToday}</p>
            </div>
          </div>

          <div className="border border-border/60 bg-card rounded-2xl p-3.5 flex items-center gap-3 shadow-sm hover:border-border transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono-tech uppercase text-muted-foreground leading-none">Точность</p>
              <p className="text-base sm:text-lg font-bold tracking-tight mt-1 leading-none">{accuracyPct}%</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border border-border bg-card/50 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("trainer")}
            className={cn(
              "flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
              activeTab === "trainer"
                ? "bg-background text-foreground shadow-sm font-semibold border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Контекстный тренажер</span>
          </button>

          <button
            onClick={() => setActiveTab("my-words")}
            className={cn(
              "flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
              activeTab === "my-words"
                ? "bg-background text-foreground shadow-sm font-semibold border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Мои слова</span>
            <span
              className={cn(
                "ml-1 px-2 py-0.5 text-xs rounded-full font-mono font-bold transition-colors",
                activeSavedCount > 0
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {activeSavedCount}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "trainer" ? (
          <ContextTrainerTab onSaveWord={saveWord} onAnswer={handleAnswerSubmitted} />
        ) : (
          <MyWordsTab
            savedWords={savedWords}
            onToggleStatus={toggleWordStatus}
            onSwitchToTrainer={() => setActiveTab("trainer")}
          />
        )}
      </div>
    </AppShell>
  );
}

/* ==================================================================== */
/* TAB 1: Контекстный тренажер                                           */
/* ==================================================================== */

interface ContextTrainerProps {
  onSaveWord: (wordKey: string) => Promise<void>;
  onAnswer: (isCorrect: boolean) => void;
}

function ContextTrainerTab({ onSaveWord, onAnswer }: ContextTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [analyzeContext, setAnalyzeContext] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const passage: ContextPassage = CONTEXT_PASSAGES[currentIndex % CONTEXT_PASSAGES.length];
  const isAnswered = selectedOption !== null;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    onAnswer(idx === passage.correct_index);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setAnalyzeContext(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleAddAndNext = async () => {
    setIsSaving(true);
    await onSaveWord(passage.word_key);
    setIsSaving(false);
    handleNext();
  };

  // Render passage with optional marker word highlighting
  const renderPassageText = () => {
    const text = passage.passage;
    const parts = text.split("[ ______ ]");

    if (!analyzeContext || !passage.marker_words || passage.marker_words.length === 0) {
      return (
        <span className="leading-relaxed">
          {parts[0]}
          <span className="inline-block px-3 py-0.5 mx-1 rounded border-b-2 border-primary bg-primary/10 font-mono font-bold text-primary">
            [ ______ ]
          </span>
          {parts[1]}
        </span>
      );
    }

    let annotated = text;
    passage.marker_words.forEach((mw) => {
      const regex = new RegExp(`(${mw})`, "gi");
      annotated = annotated.replace(regex, "___MARK___$1___ENDMARK___");
    });

    const segments = annotated.split(/(___MARK___|___ENDMARK___)/);
    let isMarked = false;

    return (
      <span className="leading-relaxed">
        {segments.map((seg, i) => {
          if (seg === "___MARK___") {
            isMarked = true;
            return null;
          }
          if (seg === "___ENDMARK___") {
            isMarked = false;
            return null;
          }

          if (seg.includes("[ ______ ]")) {
            const subParts = seg.split("[ ______ ]");
            return (
              <React.Fragment key={i}>
                {subParts[0]}
                <span className="inline-block px-3 py-0.5 mx-1 rounded border-b-2 border-primary bg-primary/10 font-mono font-bold text-primary">
                  [ ______ ]
                </span>
                {subParts[1]}
              </React.Fragment>
            );
          }

          if (isMarked) {
            return (
              <mark
                key={i}
                className="bg-amber-500/20 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded border-b border-amber-500/50 font-medium"
              >
                {seg}
              </mark>
            );
          }

          return <span key={i}>{seg}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Passage Card */}
      <div className="border border-border bg-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <span className="text-xs font-mono-tech text-muted-foreground uppercase tracking-wider">
            [ Question {currentIndex + 1} / {CONTEXT_PASSAGES.length} ]
          </span>

          <button
            onClick={() => setAnalyzeContext((prev) => !prev)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border",
              analyzeContext
                ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold"
                : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Analyze Context</span>
            {analyzeContext && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
          </button>
        </div>

        {/* Text */}
        <div className="text-base sm:text-lg text-foreground font-serif tracking-normal leading-relaxed">
          {renderPassageText()}
        </div>

        {analyzeContext && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-lg flex items-start gap-2 border border-amber-500/20">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Ключевые слова-маркеры подсвечены желтым. Они задают тональность и подсказывают правильное слово по смыслу.
            </span>
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        <p className="text-xs font-mono-tech text-muted-foreground uppercase tracking-widest">
          Выберите подходящее по смыслу слово:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {passage.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === passage.correct_index;

            let optionStyle = "border-border bg-card hover:border-border-hover text-foreground";
            if (isAnswered) {
              if (isCorrect) {
                optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold";
              } else if (isSelected) {
                optionStyle = "border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200";
              } else {
                optionStyle = "border-border/40 opacity-50 bg-card/40";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all duration-200 flex items-start justify-between gap-3 group relative",
                  optionStyle
                )}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase opacity-60">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="font-semibold text-base tracking-tight">{option.word}</span>
                    <span
                      onClick={(e) => speakWord(option.word, e)}
                      className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                      title="Прослушать слово"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-normal leading-snug">
                    {option.definition}
                  </p>
                </div>

                <div className="shrink-0 flex items-center">
                  {isAnswered && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone & Nuance Explanation Block (Visible after answering) */}
      {isAnswered && (
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-primary/10 pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Tone & Nuance Analysis</span>
            </div>
            <button
              onClick={() => speakWord(passage.options[passage.correct_index].word)}
              className="text-xs font-semibold text-primary/80 hover:text-primary flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {passage.tone_nuance}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          onClick={handleAddAndNext}
          disabled={isSaving}
          variant="outline"
          className="flex-1 border-primary/40 hover:bg-primary/10 text-primary font-medium h-11 rounded-xl flex items-center justify-center gap-2"
        >
          <BookmarkPlus className="w-4 h-4" />
          <span>Добавить в Мои слова</span>
        </Button>

        <Button
          onClick={handleNext}
          variant="default"
          className="flex-1 h-11 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <span>Пропустить</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* TAB 2: Мои слова (Flip Cards with status filtering)                  */
/* ==================================================================== */

interface MyWordsProps {
  savedWords: { wordKey: string; status: "saved" | "mastered" }[];
  onToggleStatus: (wordKey: string, status: "saved" | "mastered") => Promise<void>;
  onSwitchToTrainer: () => void;
}

function MyWordsTab({ savedWords, onToggleStatus, onSwitchToTrainer }: MyWordsProps) {
  const [filter, setFilter] = useState<FilterType>("review"); // default to "review" (На повторение)

  // Map database entries to vocabulary objects
  const filteredWords = useMemo(() => {
    return savedWords
      .map((item) => {
        const wordInfo = getVocabWord(item.wordKey);
        return wordInfo ? { ...wordInfo, savedStatus: item.status } : null;
      })
      .filter((w): w is (VocabWord & { savedStatus: "saved" | "mastered" }) => {
        if (!w) return false;
        if (filter === "all") return true;
        if (filter === "review") return w.savedStatus === "saved";
        if (filter === "mastered") return w.savedStatus === "mastered";
        return false;
      });
  }, [savedWords, filter]);

  if (savedWords.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-2xl p-12 text-center space-y-4 bg-card/30">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold">У вас пока нет сохраненных слов</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Используйте «Контекстный тренажер» и сохраняйте слова в личный словарь.
          </p>
        </div>
        <Button onClick={onSwitchToTrainer} className="mt-2 rounded-xl">
          Перейти в тренажер
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 🏷️ Filter Chips */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 border border-border p-1 bg-card/50 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              filter === "all"
                ? "bg-background text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Все ({savedWords.length})
          </button>
          <button
            onClick={() => setFilter("review")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              filter === "review"
                ? "bg-background text-amber-500 shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            На повторение ({savedWords.filter((w) => w.status === "saved").length})
          </button>
          <button
            onClick={() => setFilter("mastered")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              filter === "mastered"
                ? "bg-background text-emerald-500 shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Выучено ({savedWords.filter((w) => w.status === "mastered").length})
          </button>
        </div>

        <span className="text-[10px] font-mono-tech uppercase text-muted-foreground">
          Нажмите на карточку, чтобы перевернуть
        </span>
      </div>

      {filteredWords.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground bg-card/10">
          В этой категории пока ничего нет.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredWords.map((word) => (
            <FlipCard key={word.id} vocabWord={word} onToggleStatus={onToggleStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FlipCardProps {
  vocabWord: VocabWord & { savedStatus: "saved" | "mastered" };
  onToggleStatus: (wordKey: string, status: "saved" | "mastered") => Promise<void>;
}

function FlipCard({ vocabWord, onToggleStatus }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isMastered = vocabWord.savedStatus === "mastered";

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    const nextStatus = isMastered ? ("saved" as const) : ("mastered" as const);
    await onToggleStatus(vocabWord.id, nextStatus);
    setIsProcessing(false);
  };

  return (
    <div
      className={cn(
        "h-64 [perspective:1000px] cursor-pointer group select-none transition-all duration-300",
        isProcessing && "opacity-60 scale-98"
      )}
      onClick={() => setIsFlipped((f) => !f)}
    >
      <div
        className={cn(
          "relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform rounded-2xl",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* FRONT */}
        <div className="absolute inset-0 [backface-visibility:hidden] border border-border bg-card rounded-2xl p-6 flex flex-col justify-between shadow-xs group-hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-tech uppercase text-muted-foreground tracking-wider">
              {vocabWord.category}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => speakWord(vocabWord.word, e)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Прослушать"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground italic">
                {vocabWord.part_of_speech}
              </span>
            </div>
          </div>

          <div className="text-center my-auto space-y-1">
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
              {vocabWord.word}
            </h3>
            <p className="text-xs text-muted-foreground font-mono-tech">
              (нажмите для перевода)
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> Flip card
            </span>
            
            <button
              onClick={handleToggleStatus}
              className={cn(
                "text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded transition-colors",
                isMastered
                  ? "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                  : "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
              )}
            >
              {isMastered ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Повторить</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Выучено</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] border border-primary/30 bg-card rounded-2xl p-5 flex flex-col justify-between shadow-xs overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-lg text-primary">{vocabWord.word}</h4>
                <button
                  onClick={(e) => speakWord(vocabWord.word, e)}
                  className="p-1 rounded hover:bg-muted text-primary/80 hover:text-primary"
                  title="Прослушать"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground italic">{vocabWord.part_of_speech}</span>
            </div>

            <div>
              <p className="text-xs font-mono-tech uppercase text-muted-foreground">Definition</p>
              <p className="text-sm font-medium leading-snug mt-0.5">{vocabWord.definition}</p>
            </div>

            <div>
              <p className="text-xs font-mono-tech uppercase text-muted-foreground">Example</p>
              <p className="text-xs italic text-muted-foreground leading-snug mt-0.5">
                "{vocabWord.example_sentence}"
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> Flip back
            </span>

            <button
              onClick={handleToggleStatus}
              className={cn(
                "text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded transition-colors",
                isMastered
                  ? "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                  : "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
              )}
            >
              {isMastered ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Повторить</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Выучено</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
