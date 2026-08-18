import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Play, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface WatchVideoHeartProps {
  hearts: number;
  maxHearts: number;
}

const WatchVideoHeart = ({ hearts, maxHearts }: WatchVideoHeartProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!watching) return;
    if (countdown <= 0) {
      completeWatch();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [watching, countdown]);

  const completeWatch = async () => {
    if (!user) return;
    setWatching(false);
    setCountdown(30);

    await (supabase as any).rpc("up_restore_heart");
    queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    toast.success("Heart restored! 💖");
  };

  if (hearts >= maxHearts) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs font-bold"
      onClick={() => { setWatching(true); setCountdown(30); }}
      disabled={watching}
    >
      {watching ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {countdown}s
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5" />
          Watch +1
          <Heart className="w-3.5 h-3.5 text-destructive fill-current" />
        </>
      )}
    </Button>
  );
};

export default WatchVideoHeart;
