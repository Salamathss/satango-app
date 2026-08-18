import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Sparkles, Target, BarChart3, Clock } from "lucide-react";

const STEPS = 5;

const goalOptions = [
  { value: "1000-1200", label: "1000–1200", subtitle: "Base", emoji: "🎯" },
  { value: "1200-1400", label: "1200–1400", subtitle: "Advanced", emoji: "🚀" },
  { value: "1400-1600", label: "1400–1600", subtitle: "Top Tier", emoji: "👑" },
];

const levelOptions = [
  { value: "beginner", label: "Новичок", subtitle: "Beginner", emoji: "🌱", anchor: 1 },
  { value: "intermediate", label: "Средний", subtitle: "Intermediate", emoji: "📚", anchor: 1 },
  { value: "advanced", label: "Профи", subtitle: "Advanced", emoji: "⚡", anchor: 2 },
];

const intensityOptions = [
  { value: "casual", label: "5–10 мин", subtitle: "Casual", emoji: "☕", xp: 50 },
  { value: "serious", label: "20–30 мин", subtitle: "Serious", emoji: "💪", xp: 200 },
  { value: "insane", label: "1 час+", subtitle: "Insane", emoji: "🔥", xp: 500 },
];

const referralOptions = [
  { value: "instagram", label: "Instagram", subtitle: "Инстаграм", emoji: "📸" },
  { value: "tiktok", label: "TikTok", subtitle: "Тикток", emoji: "🎵" },
  { value: "telegram", label: "Telegram", subtitle: "Телеграм", emoji: "✈️" },
  { value: "friends", label: "Друзья / Знакомые", subtitle: "Friends / Acquaintances", emoji: "👥" },
  { value: "search", label: "Поиск (Google/Яндекс)", subtitle: "Google / Yandex Search", emoji: "🔍" },
  { value: "other", label: "Другое", subtitle: "Other", emoji: "❓" },
];

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [intensity, setIntensity] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [saving, setSaving] = useState(false);

  const progress = ((step + 1) / STEPS) * 100;

  const canProceed = () => {
    if (step === 0) return nickname.trim().length >= 2;
    if (step === 1) return !!goal;
    if (step === 2) return !!level;
    if (step === 3) return !!intensity;
    if (step === 4) return !!referralSource;
    return false;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    const selectedLevel = levelOptions.find((l) => l.value === level);
    const selectedIntensity = intensityOptions.find((i) => i.value === intensity);

    await supabase
      .from("profiles")
      .update({
        nickname: nickname.trim(),
        display_name: nickname.trim(),
        sat_goal: goal,
        current_level: level,
        intensity: intensity,
        daily_xp_target: selectedIntensity?.xp ?? 100,
        referral_source: referralSource,
        onboarding_completed: true,
      })
      .eq("user_id", user.id);

    // Set difficulty anchor based on level
    await (supabase as any).rpc("up_set_difficulty", {
      _anchor: selectedLevel?.anchor ?? 1,
      _correct_streak: null,
    });

    setSaving(false);
    onComplete();
  };

  const next = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else handleFinish();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground tracking-wide">
            Шаг {step + 1} из {STEPS}
          </span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <Progress value={progress} className="h-2 bg-muted" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          {step === 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-3">
                <span className="text-5xl block">👋</span>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Добро пожаловать!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Как я могу к вам обращаться?
                </p>
              </div>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ваше имя..."
                className="h-14 text-lg text-center rounded-2xl border-2 border-border bg-background font-semibold focus-visible:ring-primary"
                maxLength={30}
                autoFocus
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-3">
                <Target className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Какова ваша цель?
                </h1>
                <p className="text-muted-foreground text-lg">
                  Какой балл SAT вы хотите получить?
                </p>
              </div>
              <div className="space-y-3">
                {goalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 border-2 ${
                      goal === opt.value
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div>
                      <p className="font-bold text-lg text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-3">
                <BarChart3 className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Ваш уровень
                </h1>
                <p className="text-muted-foreground text-lg">
                  Как вы оцениваете свой текущий уровень?
                </p>
              </div>
              <div className="space-y-3">
                {levelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLevel(opt.value)}
                    className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 border-2 ${
                      level === opt.value
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div>
                      <p className="font-bold text-lg text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-3">
                <Clock className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Интенсивность
                </h1>
                <p className="text-muted-foreground text-lg">
                  Сколько времени в день вы готовы уделять?
                </p>
              </div>
              <div className="space-y-3">
                {intensityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setIntensity(opt.value)}
                    className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 border-2 ${
                      intensity === opt.value
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div>
                      <p className="font-bold text-lg text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-3">
                <span className="text-5xl block">📢</span>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Откуда узнали о нас?
                </h1>
                <p className="text-muted-foreground text-lg">
                  Пожалуйста, выберите один из вариантов:
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {referralOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setReferralSource(opt.value)}
                    className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 border-2 ${
                      referralSource === opt.value
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div>
                      <p className="font-bold text-lg text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-8 max-w-lg mx-auto w-full">
        <Button
          onClick={next}
          disabled={!canProceed() || saving}
          className="w-full h-14 text-lg font-bold rounded-2xl gap-2"
          size="lg"
        >
          {saving
            ? "Сохраняем..."
            : step === STEPS - 1
            ? "Начать подготовку 🚀"
            : "Продолжить"}
          {!saving && step < STEPS - 1 && <ArrowRight className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
