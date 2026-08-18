import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SAT_MODULES, Module } from "@/lib/modules";
import { getUnitLevels } from "@/lib/unitLevels";
import { Lock, CheckCircle2, Play, Star, Zap, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CourseCompletedModal from "@/components/CourseCompletedModal";

const JUMP_TEST_GEM_COST = 300;
const JUMP_TEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type Status = "completed" | "available" | "locked";

const MobileRoadmap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMod, setSelectedMod] = useState<Module | null>(null);
  const [showCourseCompleted, setShowCourseCompleted] = useState(false);

  const { data: moduleProgress } = useQuery({
    queryKey: ["module-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("module_progress").select("*").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: levelProgress } = useQuery({
    queryKey: ["all-level-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("level_progress").select("*").eq("user_id", user.id);
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
    const completed =
      levelProgress?.filter((lp: any) => lp.unit_id === mod.id && lp.is_completed).length || 0;
    return Math.round((completed / unitLevels.length) * 100);
  };

  const getModuleStatus = (mod: Module): Status => {
    const progress = moduleProgress?.find((mp: any) => mp.module === mod.id);
    if (progress?.is_completed) return "completed";
    if (mod.id === 1) return "available";
    if (progress?.is_unlocked) return "available";
    const prevProgress = moduleProgress?.find((mp: any) => mp.module === mod.id - 1);
    if (prevProgress?.is_completed) return "available";
    return "locked";
  };

  const getJumpCooldownHours = (mod: Module): number | null => {
    const progress = moduleProgress?.find((mp: any) => mp.module === mod.id);
    if (!progress?.jump_test_failed_at) return null;
    const failedAt = new Date(progress.jump_test_failed_at).getTime();
    const remaining = failedAt + JUMP_TEST_COOLDOWN_MS - Date.now();
    return remaining > 0 ? Math.ceil(remaining / (1000 * 60 * 60)) : null;
  };

  const handleJumpTest = async (mod: Module) => {
    const cooldown = getJumpCooldownHours(mod);
    if (cooldown) {
      if (!user) return;
      const { data, error } = await (supabase as any).rpc("mp_clear_jump_cooldown", {
        _module: mod.id,
      });
      if (error || !(data as any)?.ok) {
        toast.error(`Jump Test on cooldown (${cooldown}h). Need ${JUMP_TEST_GEM_COST} gems to bypass.`);
        return;
      }
    }
    setSelectedMod(null);
    navigate(`/jump-test/${mod.id}`);
  };

  // Snake path positions (offsets in pixels) — winding pattern
  const offsets = [0, 70, 100, 70, 0, -70, -100, -70, 0];

  return (
    <div className="relative pb-12">
      {/* SVG winding connector path */}
      <svg
        className="absolute inset-x-0 top-0 w-full pointer-events-none"
        style={{ height: SAT_MODULES.length * 140 }}
        viewBox={`0 0 280 ${SAT_MODULES.length * 140}`}
        preserveAspectRatio="none"
      >
        <path
          d={SAT_MODULES.map((_, i) => {
            const cx = 140 + offsets[i % offsets.length];
            const cy = 60 + i * 140;
            return i === 0 ? `M ${cx} ${cy}` : `T ${cx} ${cy}`;
          }).join(" ")}
          stroke="hsl(var(--border))"
          strokeWidth="3"
          strokeDasharray="6 8"
          fill="none"
        />
      </svg>

      <div className="relative space-y-6">
        {SAT_MODULES.map((mod, idx) => {
          const status = getModuleStatus(mod);
          const progressPct = getModuleProgress(mod);
          const offset = offsets[idx % offsets.length];
          const accent = mod.colorAccent;

          return (
            <div
              key={mod.id}
              className="relative flex flex-col items-center"
              style={{ transform: `translateX(${offset}px)`, transition: "transform 0.3s" }}
            >
              <button
                onClick={() => setSelectedMod(mod)}
                className={cn(
                  "relative tap-feedback transition-all",
                  status === "locked" && "opacity-70"
                )}
              >
                {/* Progress ring */}
                {status === "available" && progressPct > 0 && (
                  <svg className="absolute -inset-2 w-[88px] h-[88px] -rotate-90" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="40" stroke="hsl(var(--border))" strokeWidth="4" fill="none" />
                    <circle
                      cx="44"
                      cy="44"
                      r="40"
                      stroke={`hsl(${accent})`}
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${(progressPct / 100) * 251} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                <div
                  className={cn(
                    "w-[72px] h-[72px] rounded-full flex items-center justify-center text-3xl shadow-lg active:scale-95 transition-transform",
                    "border-[3px]"
                  )}
                  style={{
                    background:
                      status === "completed"
                        ? `hsl(${accent})`
                        : status === "available"
                        ? `hsl(${accent} / 0.15)`
                        : "hsl(var(--muted))",
                    borderColor: status === "locked" ? "hsl(var(--border))" : `hsl(${accent})`,
                    boxShadow:
                      status === "available"
                        ? `0 8px 24px -6px hsl(${accent} / 0.4)`
                        : undefined,
                  }}
                >
                  {status === "locked" ? (
                    <Lock className="w-7 h-7 text-muted-foreground" />
                  ) : status === "completed" ? (
                    <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                  ) : (
                    <span>{mod.icon}</span>
                  )}
                </div>

                {/* Star badge for completed */}
                {status === "completed" && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-md">
                    <Star className="w-4 h-4 text-accent-foreground fill-current" />
                  </div>
                )}
              </button>

              <div className="mt-2 text-center">
                <p className="font-extrabold text-sm tracking-tight">{mod.name}</p>
                <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 max-w-[160px]">
                  {mod.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom sheet with unit details */}
      <Drawer open={!!selectedMod} onOpenChange={(o) => !o && setSelectedMod(null)}>
        <DrawerContent className="rounded-t-[28px] border-0">
          {selectedMod && getModuleStatus(selectedMod) !== "locked" && (
            <>
              <DrawerHeader className="pb-2">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-2"
                  style={{ background: `hsl(${selectedMod.colorAccent} / 0.15)` }}
                >
                  {selectedMod.icon}
                </div>
                <DrawerTitle className="text-2xl font-extrabold text-center tracking-tight">
                  {selectedMod.name}
                </DrawerTitle>
                <DrawerDescription className="text-center text-sm">
                  {selectedMod.subtitle}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-6 pb-2 space-y-3">
                <div className="flex items-center justify-around text-center">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Difficulty</p>
                    <p className="text-lg font-black" style={{ color: `hsl(${selectedMod.colorAccent})` }}>
                      Level {selectedMod.difficulty}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Levels</p>
                    <p className="text-lg font-black">{getUnitLevels(selectedMod.id).length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Progress</p>
                    <p className="text-lg font-black" style={{ color: `hsl(${selectedMod.colorAccent})` }}>
                      {getModuleProgress(selectedMod)}%
                    </p>
                  </div>
                </div>

                {getModuleStatus(selectedMod) === "completed" && (
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-primary bg-primary/10 rounded-2xl py-2">
                    <Trophy className="w-4 h-4" /> Mastered
                  </div>
                )}
              </div>

              <DrawerFooter className="pt-2 pb-8">
                <Button
                  onClick={() => {
                    navigate(`/unit/${selectedMod.id}`);
                    setSelectedMod(null);
                  }}
                  className="h-14 rounded-2xl text-base font-extrabold gap-2"
                  style={{
                    background: `hsl(${selectedMod.colorAccent})`,
                    color: "white",
                  }}
                >
                  <Play className="w-5 h-5 fill-current" />
                  {getModuleProgress(selectedMod) > 0 ? "Continue" : "Start Unit"}
                </Button>
              </DrawerFooter>
            </>
          )}

          {selectedMod && getModuleStatus(selectedMod) === "locked" && (
            <>
              <DrawerHeader>
                <DrawerTitle className="text-xl font-extrabold text-center">Locked</DrawerTitle>
                <DrawerDescription className="text-center">
                  Complete previous units, or take a Jump Test to unlock {selectedMod.name}.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter className="pb-8">
                <Button
                  onClick={() => handleJumpTest(selectedMod)}
                  className="h-14 rounded-2xl text-base font-extrabold gap-2"
                >
                  <Zap className="w-5 h-5" /> Take Jump Test
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>


      <CourseCompletedModal open={showCourseCompleted} onClose={() => setShowCourseCompleted(false)} />
    </div>
  );
};

export default MobileRoadmap;
