-- Visits Table - Start Time va End Time Field'larini Qo'shish
-- Add start_time and end_time columns to store appointment timing

-- Visits table'ga start_time va end_time ni qo'shish
ALTER TABLE IF EXISTS public.visits
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Indexed these columns for faster queries
CREATE INDEX IF NOT EXISTS idx_visits_start_time ON public.visits(start_time);
CREATE INDEX IF NOT EXISTS idx_visits_date_start_time ON public.visits(date, start_time);

-- Optional: Add constraint to ensure end_time > start_time
ALTER TABLE public.visits
ADD CONSTRAINT check_visit_times 
CHECK (end_time > start_time);

-- Migrate existing data: har bir visitor uchun default vaqtlar bilan to'ldirish
-- Quyidagi qismni uncomment qiling agar siz hozir data bilan ishlyapgan bo'lsangiz:
-- UPDATE public.visits
-- SET start_time = '09:00'::TIME, end_time = '10:00'::TIME
-- WHERE start_time IS NULL OR start_time = '00:00'::TIME;

-- Supabase trigger - updated_at'ni yangilash
CREATE OR REPLACE FUNCTION update_visit_times_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Yangilash uchun RLS policies
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Policies to allow operations (keeping existing ones)
DROP POLICY IF EXISTS "Public can view all visits" ON public.visits;
DROP POLICY IF EXISTS "Public can insert visits" ON public.visits;
DROP POLICY IF EXISTS "Public can update visits" ON public.visits;
DROP POLICY IF EXISTS "Public can delete visits" ON public.visits;

CREATE POLICY "Public can view all visits"
  ON public.visits FOR SELECT
  USING (true);

CREATE POLICY "Public can insert visits"
  ON public.visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update visits"
  ON public.visits FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete visits"
  ON public.visits FOR DELETE
  USING (true);

-- Summary:
-- ✓ start_time TIME - Uchrashuv boshlash vaqti (09:00)
-- ✓ end_time TIME - Uchrashuv tugash vaqti (10:00)
-- ✓ duration_minutes INTEGER - Uchrashuv davomiyligi (minutlar)
-- ✓ Constraint qo'shildi: end_time > start_time
-- ✓ Index'lar yaratildi tez qidiruv uchun
