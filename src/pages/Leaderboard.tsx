import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Zap, Flame, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  weekly_xp: number;
  league: string;
  streak_days: number;
  current_level: string | null;
}

const LEAGUES = [
  { id: "Bronze", name: "Bronze League", icon: "🥉", color: "text-[#CD7F32] bg-[#CD7F32]/10 border-[#CD7F32]/20" },
  { id: "Silver", name: "Silver League", icon: "🥈", color: "text-[#C0C0C0] bg-[#C0C0C0]/10 border-[#C0C0C0]/20" },
  { id: "Gold", name: "Gold League", icon: "🥇", color: "text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20" },
  { id: "Diamond", name: "Diamond League", icon: "💎", color: "text-[#00FFFF] bg-[#00FFFF]/10 border-[#00FFFF]/20" }
];

const Leaderboard = () => {
  const { user } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState<"Bronze" | "Silver" | "Gold" | "Diamond">("Bronze");

  // Load current user's profile to default to their league
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-league", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("league")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (userProfile?.league) {
      setSelectedLeague(userProfile.league as any);
    }
  }, [userProfile]);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["leaderboard", selectedLeague],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, weekly_xp, league, streak_days, current_level")
        .eq("league", selectedLeague)
        .order("weekly_xp", { ascending: false })
        .limit(50);
      
      if (error) throw error;

      return (data ?? []).map((e) => ({
        ...e,
        display_name: e.display_name || "Anonymous",
        weekly_xp: e.weekly_xp || 0,
        streak_days: e.streak_days || 0,
        current_level: e.current_level || "1"
      })) as LeaderboardEntry[];
    },
  });

  const podium = entries ? entries.slice(0, 3) : [];
  const listEntries = entries ? entries.slice(3) : [];

  // Order podium as [Second, First, Third] for rendering
  const orderedPodium = [];
  if (podium[1]) orderedPodium.push({ ...podium[1], rank: 2 });
  if (podium[0]) orderedPodium.push({ ...podium[0], rank: 1 });
  if (podium[2]) orderedPodium.push({ ...podium[2], rank: 3 });

  return (
    <AppShell title="Leagues">
      <main className="space-y-6 max-w-xl mx-auto px-4 pb-20">
        {/* League Selector Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-1 bg-card border border-border/50 p-1.5 rounded-2xl">
            {LEAGUES.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLeague(l.id as any)}
                className={cn(
                  "flex-1 flex flex-col items-center py-2 px-1 rounded-xl text-xs font-black transition-all active:scale-95",
                  selectedLeague === l.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <span className="text-lg mb-0.5">{l.icon}</span>
                <span>{l.id}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">
              <span>{LEAGUES.find((l) => l.id === selectedLeague)?.icon}</span>
              <span>{LEAGUES.find((l) => l.id === selectedLeague)?.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground font-semibold">
              Top learners reset weekly. Keep practicing to promote!
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-44 bg-card border border-border/50 rounded-3xl animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-card border border-border/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium */}
            {podium.length > 0 && (
              <div className="bg-card border border-border/50 rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex items-end justify-center gap-3 pt-6 pb-2">
                  {/* Render podium members */}
                  {orderedPodium.map((p) => {
                    const isCurrentUser = p.user_id === user?.id;
                    const initial = p.display_name.charAt(0).toUpperCase();

                    return (
                      <div
                        key={p.user_id}
                        className={cn(
                          "flex flex-col items-center flex-1 transition-all",
                          p.rank === 1 ? "order-2 -mt-4 scale-105" : p.rank === 2 ? "order-1" : "order-3"
                        )}
                      >
                        <div className="relative mb-2">
                          <div
                            className={cn(
                              "w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-lg shadow-md",
                              p.rank === 1 ? "border-[#FFD700] bg-gradient-to-br from-[#FFE066] to-[#F5C200] text-black" :
                              p.rank === 2 ? "border-[#C0C0C0] bg-gradient-to-br from-[#E0E0E0] to-[#A0A0A0] text-black" :
                              "border-[#CD7F32] bg-gradient-to-br from-[#E5A870] to-[#B36820] text-white"
                            )}
                          >
                            {initial}
                          </div>
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">
                            {p.rank === 1 ? "👑" : p.rank === 2 ? "🥈" : "🥉"}
                          </span>
                        </div>

                        <div className="text-center max-w-[90px] min-w-0">
                          <p className={cn("font-extrabold text-xs truncate", isCurrentUser && "text-primary")}>
                            {p.display_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold flex items-center justify-center gap-0.5 mt-0.5">
                            <Zap className="w-3 h-3 text-xp shrink-0" />
                            <span>{p.weekly_xp}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List for ranks 4-50 */}
            <div className="bg-card border border-border/50 rounded-3xl divide-y divide-border/50 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              {listEntries.map((entry, index) => {
                const rank = index + 4;
                const isCurrentUser = entry.user_id === user?.id;
                const initial = entry.display_name.charAt(0).toUpperCase();

                return (
                  <div
                    key={entry.user_id}
                    className={cn(
                      "flex items-center gap-3 p-3.5 transition-all",
                      isCurrentUser ? "bg-primary/10 border-y-2 border-primary/20" : "hover:bg-muted/20"
                    )}
                  >
                    <div className="w-7 text-center font-black text-sm text-muted-foreground shrink-0">
                      {rank}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0 border border-border/20">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-extrabold text-sm truncate", isCurrentUser && "text-primary")}>
                        {entry.display_name}
                        {isCurrentUser && <span className="text-[10px] font-black uppercase tracking-wider ml-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">You</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold">Lvl {entry.current_level}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                      {entry.streak_days > 0 && (
                        <div className="flex items-center gap-0.5 text-streak">
                          <Flame className="w-3.5 h-3.5 fill-streak/20" />
                          <span>{entry.streak_days}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-0.5 text-xp bg-xp/5 px-2 py-1 rounded-xl border border-xp/10">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{entry.weekly_xp}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!entries || entries.length === 0) && (
                <div className="text-center py-16 text-muted-foreground space-y-2">
                  <Trophy className="w-10 h-10 mx-auto text-muted-foreground/30" />
                  <p className="font-extrabold text-sm">League is empty</p>
                  <p className="text-xs">Be the first to earn XP in this league!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
};

export default Leaderboard;
