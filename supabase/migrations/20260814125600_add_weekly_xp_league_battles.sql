-- Add weekly_xp and league columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS league text NOT NULL DEFAULT 'Bronze';

-- Create battles table
CREATE TABLE IF NOT EXISTS public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  questions_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Battles are viewable by everyone" ON public.battles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create battles" ON public.battles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update battles in their room" ON public.battles
  FOR UPDATE TO authenticated USING (
    auth.uid() = created_by OR auth.uid() = opponent_id
  );

-- Trigger for updating updated_at
CREATE TRIGGER update_battles_updated_at 
  BEFORE UPDATE ON public.battles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
