import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SAT_MODULES, TIER_LABELS, Module } from "@/lib/modules";
import { getUnitLevels } from "@/lib/unitLevels";
import { Lock, CheckCircle2, Play, Zap, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Gem } from "lucide-react";
import { toast } from "sonner";
import CourseCompletedModal from "@/components/CourseCompletedModal";

const JUMP_TEST_GEM_COST = 300;
const JUMP_TEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const ModuleRoadmap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jumpTarget, setJumpTarget] = useState<Module | null>(null);
  const [showTrophy, setShowTrophy] = useState<number | null>(null);
  const [showCourseCompleted, setShowCourseCompleted] = useState(false);

  const { data: moduleProgress } = useQuery({
    queryKey: ["module-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: levelProgress } = useQuery({
    queryKey: ["all-level-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("level_progress")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: userProgress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_progress")
        .select("gems")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Check for course completion (all 9 modules)
  useEffect(() => {
    if (!moduleProgress) return;
    const allCompleted = SAT_MODULES.every((mod) =>
      moduleProgress.find((mp: any) => mp.module === mod.id && mp.is_completed)
    );
    if (allCompleted && moduleProgress.length >= 9) {
      const hasShown = localStorage.getItem("course_completed_shown");
      if (!hasShown) {
        setShowCourseCompleted(true);
        localStorage.setItem("course_completed_shown", "true");
      }
    }
  }, [moduleProgress]);

  const getModuleProgress = (mod: Module): number => {
    const unitLevels = getUnitLevels(mod.id);
    if (unitLevels.length === 0) return 0;
    const completed = levelProgress?.filter(
      (lp: any) => lp.unit_id === mod.id && lp.is_completed
    ).length || 0;
    return Math.round((completed / unitLevels.length) * 100);
  };

  const getModuleStatus = (mod: Module): "completed" | "available" | "locked" => {
    const progress = moduleProgress?.find((mp: any) => mp.module === mod.id);
    if (progress?.is_completed) return "completed";
    if (mod.id === 1) return "available";
    if (progress?.is_unlocked) return "available";
    const prevProgress = moduleProgress?.find((mp: any) => mp.module === mod.id - 1);
    if (prevProgress?.is_completed) return "available";
    return "locked";
  };

  const getJumpTestCooldown = (mod: Module): number | null => {
    const progress = moduleProgress?.find((mp: any) => mp.module === mod.id);
    if (!progress?.jump_test_failed_at) return null;
    const failedAt = new Date(progress.jump_test_failed_at).getTime();
    const remaining = failedAt + JUMP_TEST_COOLDOWN_MS - Date.now();
    return remaining > 0 ? remaining : null;
  };

  const handleModuleClick = (mod: Module) => {
    const status = getModuleStatus(mod);
    if (status === "locked") return;
    navigate(`/unit/${mod.id}`);
  };

  const handleJumpTest = (mod: Module) => {
    const cooldown = getJumpTestCooldown(mod);
    if (cooldown && cooldown > 0) {
      const hours = Math.ceil(cooldown / (1000 * 60 * 60));
      if ((userProgress?.gems || 0) >= JUMP_TEST_GEM_COST) {
        setJumpTarget(mod);
      } else {
        toast.error(`Jump Test on cooldown. Try again in ${hours}h or get ${JUMP_TEST_GEM_COST} gems.`);
      }
      return;
    }
    navigate(`/jump-test/${mod.id}`);
  };

  const handleGemBypass = async () => {
    if (!user || !jumpTarget) return;
    const { data, error } = await (supabase as any).rpc("mp_clear_jump_cooldown", {
      _module: jumpTarget.id,
    });
    if (error || !(data as any)?.ok) {
      toast.error(`Need ${JUMP_TEST_GEM_COST} gems.`);
      return;
    }
    setJumpTarget(null);
    navigate(`/jump-test/${jumpTarget.id}`);
  };

  const isSATMaster = moduleProgress && SAT_MODULES.every((mod) =>
    moduleProgress.find((mp: any) => mp.module === mod.id && mp.is_completed)
  );

  const tiers: Module["tier"][] = ["foundation", "intermediate", "advanced"];

  return (
    <div className="space-y-8">
      {/* SAT Master badge */}
      {isSATMaster && (
        <div className="text-center bg-gradient-to-r from-[hsl(45,90%,55%,0.1)] to-[hsl(35,85%,45%,0.1)] border border-[hsl(45,90%,55%,0.3)] rounded-2xl p-4 animate-fade-in">
          <span className="text-3xl">👑</span>
          <p className="font-black text-sm bg-gradient-to-r from-[hsl(45,90%,55%)] to-[hsl(35,85%,45%)] bg-clip-text text-transparent">
            SAT Master · 50% Off Mock Tests
          </p>
        </div>
      )}

      {tiers.map((tier) => {
        const modules = SAT_MODULES.filter((m) => m.tier === tier);
        return (
          <div key={tier} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="font-mono-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {String(tiers.indexOf(tier) + 1).padStart(2, "0")} · {TIER_LABELS[tier]}
              </div>
              <div className="flex-1 hairline-b" />
            </div>

            <div className="flex flex-col gap-2">
              {modules.map((mod, idx) => {
                const status = getModuleStatus(mod);
                const cooldown = getJumpTestCooldown(mod);
                const cooldownHours = cooldown ? Math.ceil(cooldown / (1000 * 60 * 60)) : null;
                const progressPct = getModuleProgress(mod);
                const moduleCode = `M${String(mod.id).padStart(2, "0")}`;

                return (
                  <div
                    key={mod.id}
                    className="relative animate-fade-in"
                    style={{ animationDelay: `${(mod.id - 1) * 40}ms` }}
                  >
                    {showTrophy === mod.id && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-md hairline animate-scale-in">
                        <div className="text-center">
                          <Trophy className="w-10 h-10 text-foreground mx-auto mb-1" />
                          <p className="font-bold text-sm font-mono-tech uppercase tracking-[0.12em]">Unit Mastered</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleModuleClick(mod)}
                      disabled={status === "locked"}
                      className={cn(
                        "w-full p-3.5 text-left transition-colors duration-150 border rounded-md",
                        "flex items-center gap-3",
                        status === "completed" && "bg-card border-foreground/40",
                        status === "available" && "bg-card border-divider hover:bg-[hsl(var(--surface-hover))] hover:border-foreground/40 cursor-pointer",
                        status === "locked" && "bg-muted/40 border-divider opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="w-11 h-11 rounded-md border border-divider bg-background flex flex-col items-center justify-center shrink-0">
                        {status === "locked" ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <>
                            <span className="font-mono-tech text-[9px] font-semibold text-muted-foreground tracking-wider leading-none">
                              {moduleCode}
                            </span>
                            <span className="text-base leading-none mt-0.5">{mod.icon}</span>
                          </>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="font-bold text-[14px] truncate">{mod.name}</p>
                          <span className="font-mono-tech text-[10px] text-muted-foreground tracking-wider">
                            D{mod.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {mod.subtitle}
                        </p>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 h-[3px] bg-muted rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-foreground transition-all duration-300"
                              style={{ width: `${status === "completed" ? 100 : progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono-tech text-[10px] font-semibold tabular-nums text-foreground min-w-[34px] text-right">
                            {status === "completed" ? "100%" : `${progressPct.toString().padStart(2, "0")}%`}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {status === "completed" && (
                          <CheckCircle2 className="w-4 h-4 text-foreground" strokeWidth={2.25} />
                        )}
                        {status === "available" && (
                          <Play className="w-4 h-4 text-foreground" strokeWidth={2.25} />
                        )}
                        <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                          {status === "locked" ? "LOCKED" : status === "completed" ? "DONE" : "READY"}
                        </span>
                      </div>
                    </button>

                    {status === "locked" && (
                      <button
                        onClick={() => handleJumpTest(mod)}
                        className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-card border border-divider text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors duration-150 font-mono-tech uppercase tracking-[0.1em]"
                      >
                        <Zap className="w-3 h-3" strokeWidth={2.25} />
                        {cooldownHours
                          ? `Jump Test · ${cooldownHours}h cooldown`
                          : `Jump → ${mod.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Gem bypass dialog */}
      <AlertDialog open={!!jumpTarget} onOpenChange={() => setJumpTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jump Test on Cooldown</AlertDialogTitle>
            <AlertDialogDescription>
              You failed this Jump Test recently. Wait 24 hours, or pay{" "}
              <span className="font-bold text-foreground">{JUMP_TEST_GEM_COST}</span> gems to retry now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Wait</AlertDialogCancel>
            <AlertDialogAction onClick={handleGemBypass} className="gap-1.5">
              <Gem className="w-4 h-4" />
              Pay {JUMP_TEST_GEM_COST} Gems
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course completed modal */}
      <CourseCompletedModal
        open={showCourseCompleted}
        onClose={() => setShowCourseCompleted(false)}
      />
    </div>
  );
};

export default ModuleRoadmap;
