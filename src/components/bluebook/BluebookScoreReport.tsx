import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Share2,
  Printer,
  BookmarkCheck,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { recordMistake } from "@/services/mistakeVaultService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { playSuccessSound } from "@/utils/audio";

interface QuestionData {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  section: "reading_writing" | "math";
  domain?: string;
  isSPR?: boolean;
}

interface ExamModuleData {
  id?: string;
  title: string;
  section: "reading_writing" | "math";
  questions: any[];
}

interface BluebookScoreReportProps {
  testTitle: string;
  totalScore: number;
  rwScore: number;
  mathScore: number;
  totalCorrect: number;
  totalQuestions: number;
  correctRW: number;
  totalRW: number;
  correctMath: number;
  totalMath: number;
  modules: ExamModuleData[];
  answers: Record<string, number | string>;
  questionTimes: Record<string, number>;
  onRetake: () => void;
  onExit: () => void;
}

export const BluebookScoreReport: React.FC<BluebookScoreReportProps> = ({
  testTitle,
  totalScore,
  rwScore,
  mathScore,
  totalCorrect,
  totalQuestions,
  correctRW,
  totalRW,
  correctMath,
  totalMath,
  modules,
  answers,
  questionTimes,
  onRetake,
  onExit,
}) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "pacing" | "certificate">("overview");
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number>(0);
  const [isSynced, setIsSynced] = useState(false);

  // Calculate approximate Digital SAT percentile
  const getPercentile = (score: number) => {
    if (score >= 1550) return "99th+";
    if (score >= 1500) return "98th";
    if (score >= 1450) return "96th";
    if (score >= 1400) return "93rd";
    if (score >= 1350) return "89th";
    if (score >= 1300) return "84th";
    if (score >= 1200) return "73rd";
    if (score >= 1100) return "59th";
    return "45th";
  };

  // Compile all question results
  const allQuestionsWithStatus = modules.flatMap((mod, modIdx) =>
    mod.questions.map((q, qIdx) => {
      const userAns = answers[q.id];
      const isAnswered = userAns !== undefined && userAns !== "";
      const isCorrect = isAnswered && Number(userAns) === q.correct_answer;
      const secondsSpent = questionTimes[q.id] || 0;
      const isTimeSink = secondsSpent > 120; // > 2 minutes is considered a time sink on SAT

      return {
        ...q,
        moduleIndex: modIdx,
        moduleTitle: mod.title,
        questionNumber: qIdx + 1,
        isAnswered,
        isCorrect,
        userAns,
        secondsSpent,
        isTimeSink,
      };
    })
  );

  const wrongQuestions = allQuestionsWithStatus.filter((q) => !q.isCorrect);
  const timeSinkQuestions = allQuestionsWithStatus.filter((q) => q.isTimeSink);

  // Sync wrong questions to Mistake Vault
  const handleSyncToMistakeVault = async () => {
    if (wrongQuestions.length === 0) {
      toast.info("У вас нет ошибок в этом тесте! Идеальный результат.");
      return;
    }

    try {
      for (const q of wrongQuestions) {
        await recordMistake(user?.id, q.id, {
          question_text: q.question_text,
          topic: q.domain || (q.section === "math" ? "Math Problem" : "Reading & Writing"),
          category: q.section,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          source: "mock",
        });
      }
      setIsSynced(true);
      playSuccessSound();
      toast.success(
        `Синхронизировано ${wrongQuestions.length} ошибок в Карцер ошибок (Mistake Vault)!`
      );
    } catch {
      toast.error("Не удалось синхронизировать ошибки. Попробуйте еще раз.");
    }
  };

  // Share to Telegram
  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `🎯 Я только что сдал полноформатный Digital SAT тест "${testTitle}" на платформе SATANGO!\n\n` +
        `🏆 Мой результат: ${totalScore} из 1600 (${getPercentile(totalScore)} Percentile)\n` +
        `📚 Reading & Writing: ${rwScore} / 800\n` +
        `🧮 Math: ${mathScore} / 800\n\n` +
        `Готовься к Digital SAT 2026 на satango.app 🚀`
    );
    window.open(`https://t.me/share/url?url=https://satango.app&text=${text}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const currentModule = modules[selectedModuleIndex] || modules[0];
  const currentModuleQuestions = allQuestionsWithStatus.filter(
    (q) => q.moduleIndex === selectedModuleIndex
  );

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-md flex flex-col font-sans overflow-y-auto print:bg-white print:text-black">
      <div className="min-h-screen bg-background text-foreground flex flex-col max-w-5xl w-full mx-auto shadow-2xl border-x border-border/80 my-0 sm:my-4 sm:rounded-2xl overflow-hidden print:border-none print:shadow-none print:m-0 print:max-w-none">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border/70 bg-card/90 px-6 flex items-center justify-between shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-xs tracking-wide text-foreground">
              Official Diagnostic Report 2.0 · Digital SAT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border/70 bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / PDF</span>
            </button>
            <button
              type="button"
              onClick={onExit}
              className="h-8 px-3.5 rounded-md bg-foreground text-background hover:opacity-90 text-xs font-semibold transition-opacity"
            >
              Вернуться в хаб
            </button>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="border-b border-border/60 bg-muted/30 px-6 pt-3 flex gap-4 print:hidden">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Общий результат и аналитика
          </button>
          <button
            onClick={() => setActiveTab("pacing")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "pacing"
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Карта темпа (Pacing Heatmap)</span>
            {timeSinkQuestions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                {timeSinkQuestions.length} ловушек
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("certificate")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "certificate"
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Сертификат балла</span>
          </button>
        </div>

        {/* Main Body */}
        <main className="flex-1 p-6 sm:p-8 space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Экзамен завершен</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {testTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Результаты вычислены по конкордантной адаптивной шкале College Board Digital SAT (400–1600).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleShareTelegram}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Поделиться в Telegram</span>
                  </button>
                </div>
              </div>

              {/* Score Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total */}
                <div className="p-6 rounded-2xl bg-card border border-border/80 text-center space-y-1 relative overflow-hidden shadow-xs">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    TOTAL ESTIMATED SCORE
                  </span>
                  <div className="text-5xl font-extrabold text-foreground tracking-tight tabular-nums">
                    {totalScore}
                  </div>
                  <div className="text-xs font-medium text-amber-700 dark:text-amber-400 pt-1">
                    {getPercentile(totalScore)} Перцентиль в мире
                  </div>
                </div>

                {/* RW */}
                <div className="p-6 rounded-2xl bg-card border border-border/80 text-center space-y-1 relative overflow-hidden shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reading & Writing
                  </span>
                  <div className="text-4xl font-bold text-foreground tracking-tight tabular-nums">
                    {rwScore}
                    <span className="text-xs text-muted-foreground font-normal ml-1">/ 800</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {correctRW} из {totalRW} верных ответов ({totalRW > 0 ? Math.round((correctRW / totalRW) * 100) : 0}%)
                  </div>
                </div>

                {/* Math */}
                <div className="p-6 rounded-2xl bg-card border border-border/80 text-center space-y-1 relative overflow-hidden shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mathematics
                  </span>
                  <div className="text-4xl font-bold text-foreground tracking-tight tabular-nums">
                    {mathScore}
                    <span className="text-xs text-muted-foreground font-normal ml-1">/ 800</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {correctMath} из {totalMath} верных ответов ({totalMath > 0 ? Math.round((correctMath / totalMath) * 100) : 0}%)
                  </div>
                </div>
              </div>

              {/* One-Click Sync to Mistake Vault Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-sm text-foreground">
                      Отработка ошибок в Mistake Vault
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    В этом экзамене вы допустили{" "}
                    <strong className="text-foreground">{wrongQuestions.length} ошибок</strong>.
                    Отправьте их в персональный карцер ошибок, чтобы Сократический ИИ-наставник разобрал каждый неверный ответ.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={isSynced || wrongQuestions.length === 0}
                    onClick={handleSyncToMistakeVault}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    {isSynced ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ошибки сохранены</span>
                      </>
                    ) : (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        <span>Добавить в карцер ({wrongQuestions.length})</span>
                      </>
                    )}
                  </button>
                  {isSynced && (
                    <button
                      onClick={() => navigate("/errors")}
                      className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
                    >
                      Открыть Карцер
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={onRetake}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Пройти этот тест заново</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/analytics")}
                  className="inline-flex items-center gap-1.5 h-10 px-6 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-semibold transition-opacity"
                >
                  <span>Полный радар аналитики</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PACING HEATMAP */}
          {activeTab === "pacing" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Карта темпа прохождения (Pacing Heatmap)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Анализ времени по каждому вопросу. Официальный лимит Digital SAT: ~71 секунда на вопрос.
                  </p>
                </div>

                {/* Module switcher buttons */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                  {modules.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModuleIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedModuleIndex === idx
                          ? "bg-card text-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m.section === "reading_writing" ? "RW" : "Math"} М{idx % 2 === 0 ? 1 : 2}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Sink Alert Banner */}
              {timeSinkQuestions.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-foreground block">
                      Обнаружены {timeSinkQuestions.length} вопросов-ловушек времени (&gt; 2 минут)
                    </span>
                    <p className="text-muted-foreground">
                      На реальном экзамене длительное зависание над сложным вопросом отнимает время у простых задач в конце модуля. Рекомендуется ставить флаг (Mark for Review) и возвращаться к ним позже.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid of questions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
                {currentModuleQuestions.map((q) => {
                  const isSink = q.isTimeSink;
                  const mins = Math.floor(q.secondsSpent / 60);
                  const secs = q.secondsSpent % 60;
                  const timeFormatted = mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;

                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        q.isCorrect
                          ? "bg-emerald-500/5 border-emerald-500/25"
                          : "bg-rose-500/5 border-rose-500/25"
                      } ${isSink ? "ring-2 ring-amber-500/60" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">
                          Q{q.questionNumber}
                        </span>
                        {q.isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                      </div>

                      <div className="mt-2 space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="tabular-nums font-medium">{timeFormatted}</span>
                        </div>
                        {isSink && (
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 block">
                            ⚠️ Ловушка
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: VERIFIED CERTIFICATE */}
          {activeTab === "certificate" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border border-border/80 rounded-3xl p-8 sm:p-12 bg-card text-foreground relative overflow-hidden shadow-xl print:border-neutral-300 print:shadow-none">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-6 text-center max-w-xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>SATANGO OFFICIAL TEST REPORT</span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      Certificate of Achievement
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Выдан кандидату: <strong className="text-foreground">{(profile as any)?.display_name || user?.email || "Digital SAT Student"}</strong>
                    </p>
                  </div>

                  <div className="py-4 border-y border-border/60 flex items-center justify-around gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground block">TOTAL SCORE</span>
                      <span className="text-4xl sm:text-5xl font-black text-amber-500 tabular-nums">
                        {totalScore}
                      </span>
                      <span className="text-xs text-muted-foreground block">/ 1600</span>
                    </div>
                    <div className="h-10 w-px bg-border/60" />
                    <div>
                      <span className="text-xs text-muted-foreground block">READING & WRITING</span>
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums">
                        {rwScore}
                      </span>
                      <span className="text-xs text-muted-foreground block">/ 800</span>
                    </div>
                    <div className="h-10 w-px bg-border/60" />
                    <div>
                      <span className="text-xs text-muted-foreground block">MATH</span>
                      <span className="text-2xl sm:text-3xl font-bold tabular-nums">
                        {mathScore}
                      </span>
                      <span className="text-xs text-muted-foreground block">/ 800</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground pt-2">
                    <span>Тест: {testTitle}</span>
                    <span>Дата: {new Date().toLocaleDateString("ru-RU")}</span>
                    <span>Перцентиль: {getPercentile(totalScore)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2 print:hidden">
                <button
                  onClick={handleShareTelegram}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Отправить сертификат в Telegram</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Сохранить в PDF</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
