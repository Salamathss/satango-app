import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";

const Index = () => {
  const { user, loading } = useAuth();
  const [justFinished, setJustFinished] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-onboarding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <span className="text-4xl block mb-2">🎓</span>
          <p className="font-semibold text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Landing />;

  if (!justFinished && profile && !profile.onboarding_completed) {
    return <Onboarding onComplete={() => setJustFinished(true)} />;
  }

  return <Dashboard />;
};

export default Index;
