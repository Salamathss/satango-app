ALTER TABLE public.user_progress 
  ADD COLUMN IF NOT EXISTS full_exam_tickets integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS section_exam_tickets integer NOT NULL DEFAULT 0;