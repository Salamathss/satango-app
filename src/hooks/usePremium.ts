import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export const usePremium = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const isPremium = !!(profile as any)?.is_premium;

  // Premium activation MUST happen server-side (payment webhook → service role
  // update). The client cannot flip `is_premium` — a database trigger blocks it.
  const upgrade = useCallback(async () => {
    // Intentionally a no-op on the client. Real checkout will mark the user
    // premium via a secured edge function / webhook.
    queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    return false;
  }, [user, queryClient]);

  return { isPremium, isLoading, upgrade };
};
