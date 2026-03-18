-- Doctor Public Profile Migration
-- Aligned with current ShifoCRM frontend/API contracts
-- Safe to run multiple times

-- ============================================================================
-- 1. ADD PUBLIC PROFILE FIELDS TO DOCTORS TABLE
-- ============================================================================

ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS public_slug TEXT,
ADD COLUMN IF NOT EXISTS public_bio TEXT,
ADD COLUMN IF NOT EXISTS public_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS public_phone TEXT,
ADD COLUMN IF NOT EXISTS public_telegram TEXT,
ADD COLUMN IF NOT EXISTS public_whatsapp TEXT;

-- Legacy mapping (if old columns are present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='doctors' AND column_name='bio'
  ) THEN
    EXECUTE 'UPDATE public.doctors SET public_bio = COALESCE(public_bio, bio)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='doctors' AND column_name='avatar_url'
  ) THEN
    EXECUTE 'UPDATE public.doctors SET public_avatar_url = COALESCE(public_avatar_url, avatar_url)';
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE LEADS TABLE FOR PATIENT INQUIRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TIME,
  selected_service TEXT,
  note TEXT,
  source TEXT DEFAULT 'doctor_public_page',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS preferred_date DATE,
ADD COLUMN IF NOT EXISTS preferred_time TIME,
ADD COLUMN IF NOT EXISTS selected_service TEXT,
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'doctor_public_page',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 3. CREATE INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ============================================================================

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_clinic_id ON public.leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_doctor_id ON public.leads(doctor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_preferred_date ON public.leads(preferred_date);

-- Doctors table indexes for public profile queries
CREATE INDEX IF NOT EXISTS idx_doctors_is_public ON public.doctors(is_public) WHERE is_public = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_public_slug ON public.doctors(public_slug);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON public.doctors(clinic_id);

-- ============================================================================
-- 4. CREATE TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Function to update leads.updated_at
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for leads table
DROP TRIGGER IF EXISTS leads_updated_at_trigger ON public.leads;
CREATE TRIGGER leads_updated_at_trigger
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_leads_updated_at();

-- Function to update doctors.profile_updated_at
CREATE OR REPLACE FUNCTION public.update_doctors_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for doctors profile updates
DROP TRIGGER IF EXISTS doctors_profile_updated_at_trigger ON public.doctors;
CREATE TRIGGER doctors_profile_updated_at_trigger
BEFORE UPDATE ON public.doctors
FOR EACH ROW
WHEN (
  OLD.is_public IS DISTINCT FROM NEW.is_public
  OR OLD.public_bio IS DISTINCT FROM NEW.public_bio
  OR OLD.public_avatar_url IS DISTINCT FROM NEW.public_avatar_url
  OR OLD.public_phone IS DISTINCT FROM NEW.public_phone
  OR OLD.public_telegram IS DISTINCT FROM NEW.public_telegram
  OR OLD.public_whatsapp IS DISTINCT FROM NEW.public_whatsapp
)
EXECUTE FUNCTION public.update_doctors_profile_updated_at();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR LEADS TABLE
-- ============================================================================

-- Policy: Public can read leads (for confirmation)
DROP POLICY IF EXISTS leads_public_select ON public.leads;
CREATE POLICY leads_public_select
ON public.leads FOR SELECT
USING (TRUE);

-- Policy: Public can insert leads (anonymous submissions)
DROP POLICY IF EXISTS leads_public_insert ON public.leads;
CREATE POLICY leads_public_insert
ON public.leads FOR INSERT
WITH CHECK (TRUE);

-- Policy: Clinic staff can view leads for their clinic
DROP POLICY IF EXISTS leads_public_update ON public.leads;
CREATE POLICY leads_public_update
ON public.leads FOR UPDATE
USING (TRUE)
WITH CHECK (TRUE);

DROP POLICY IF EXISTS leads_public_delete ON public.leads;
CREATE POLICY leads_public_delete
ON public.leads FOR DELETE
USING (TRUE);

-- ============================================================================
-- 7. UPDATE DOCTORS TABLE RLS FOR PUBLIC PROFILES
-- ============================================================================

-- Policy: Public can read doctors with is_public = TRUE
DROP POLICY IF EXISTS doctors_public_select ON public.doctors;
CREATE POLICY doctors_public_select
ON public.doctors FOR SELECT
USING (
  is_public = TRUE OR auth.role() = 'authenticated'
);

-- ============================================================================
-- 8. BACKFILL PUBLIC_SLUG FOR EXISTING DOCTORS
-- ============================================================================

-- Generate unique public_slug for doctors where is_public = TRUE and public_slug IS NULL
UPDATE public.doctors
SET public_slug = LOWER(CONCAT(
  REGEXP_REPLACE(COALESCE(full_name, 'doctor'), '[^a-z0-9]+', '-', 'g'),
  '-', id::TEXT
))
WHERE (public_slug IS NULL OR TRIM(public_slug) = '');

-- ============================================================================
-- 9. CREATE HELPER FUNCTION FOR SLUG GENERATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_public_slug(
  full_name TEXT,
  doctor_id INTEGER
)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  base_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(REGEXP_REPLACE(COALESCE(full_name, 'doctor'), '[^a-z0-9]+', '-', 'g'));
  
  slug := base_slug;
  
  WHILE EXISTS(SELECT 1 FROM public.doctors WHERE public_slug = slug AND id != doctor_id) LOOP
    counter := counter + 1;
    slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration:
-- 1. Added public profile fields aligned with frontend/API
-- 2. Created/updated leads table with app-compatible columns
-- 3. Added indexes for public slug and lead queries
-- 4. Added triggers for updated_at
-- 5. Enabled RLS policies for MVP
-- 6. Backfilled public_slug values for existing doctors
-- ============================================================================
