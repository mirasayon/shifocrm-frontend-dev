-- Doctor Public Profile MVP - Example Seed Data
-- Use this to populate test data for the doctor profile feature
-- IMPORTANT: Only run this in development/test databases!

-- ============================================================================
-- 1. UPDATE EXISTING DOCTORS FOR PUBLIC PROFILES (EXAMPLE)
-- ============================================================================

-- Make doctor with ID 1 public (if exists)
UPDATE doctors 
SET 
  is_public = true,
  public_slug = 'dr-john-smith-' || substr(md5(random()::text), 1, 8),
  public_bio = 'Dr. John Smith is an experienced dental surgeon with over 10 years of practice in cosmetic and restorative dentistry. Specializing in dental implants and smile makeovers.',
  public_avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  public_phone = '+998901234567',
  public_telegram = '@dr_john_smith',
  public_whatsapp = '+998901234567'
WHERE id = 1;

-- Make doctor with ID 2 public
UPDATE doctors 
SET 
  is_public = true,
  public_slug = 'dr-fatima-khan-' || substr(md5(random()::text), 1, 8),
  public_bio = 'Dr. Fatima Khan specializes in orthodontics and pediatric dentistry. She is passionate about creating beautiful, healthy smiles for patients of all ages.',
  public_avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
  public_phone = '+998902345678',
  public_telegram = '@dr_fatima_khan',
  public_whatsapp = '+998902345678'
WHERE id = 2;

-- Make doctor with ID 3 public
UPDATE doctors 
SET 
  is_public = true,
  public_slug = 'dr-ali-raza-' || substr(md5(random()::text), 1, 8),
  public_bio = 'Dr. Ali Raza is a general dentist focused on preventive care and patient education. He believes in making dental care accessible and comfortable for everyone.',
  public_avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali',
  public_phone = '+998903456789',
  public_telegram = '@dr_ali_raza',
  public_whatsapp = '+998903456789'
WHERE id = 3;

-- ============================================================================
-- 2. INSERT EXAMPLE LEADS (For testing lead retrieval)
-- ============================================================================

-- Example leads for testing
INSERT INTO leads (
  clinic_id,
  doctor_id,
  patient_name,
  phone,
  selected_service,
  note,
  source,
  status,
  created_at,
  updated_at
) VALUES 
(
  1, 1, 
  'Ahmad Karim', 
  '+998911111111',
  'Root Canal Treatment',
  'Severe tooth pain in upper left molar',
  'doctor_public_page',
  'new',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  1, 1,
  'Zarina Abdullaeva',
  '+998912222222',
  'Teeth Whitening',
  'Interested in cosmetic whitening',
  'doctor_public_page',
  'contacted',
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  1, 2,
  'Hassan Qureshi',
  '+998913333333',
  'Braces & Orthodontics',
  'Child needs braces consultation',
  'doctor_public_page',
  'new',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
),
(
  1, 2,
  'Svetlana Petrov',
  '+998914444444',
  'Cleaning & Checkup',
  'Regular dental checkup',
  'doctor_public_page',
  'converted',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day'
),
(
  1, 3,
  'Mohammed Ibrahim',
  '+998915555555',
  'Dental Implant',
  'Lost tooth, need implant solution',
  'doctor_public_page',
  'new',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
),
(
  1, 3,
  'Nadia Sharipova',
  '+998916666666',
  'Cavity Filling',
  NULL,
  'doctor_public_page',
  'new',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
);

-- ============================================================================
-- 3. VERIFY SEED DATA (Run these to confirm)
-- ============================================================================

-- Count public doctors
SELECT COUNT(*) as public_doctors_count FROM doctors WHERE is_public = true;

-- View public doctors
SELECT id, full_name, public_slug, public_bio, public_phone FROM doctors WHERE is_public = true ORDER BY created_at DESC;

-- Count leads
SELECT COUNT(*) as total_leads FROM leads;

-- View leads grouped by status
SELECT status, COUNT(*) as count FROM leads GROUP BY status;

-- View leads for doctor 1
SELECT patient_name, phone, selected_service, status, created_at FROM leads WHERE doctor_id = 1 ORDER BY created_at DESC;

-- View leads for doctor 2
SELECT patient_name, phone, selected_service, status, created_at FROM leads WHERE doctor_id = 2 ORDER BY created_at DESC;

-- ============================================================================
-- 4. TESTING QUERIES
-- ============================================================================

-- Test: Find doctor by public slug (as frontend does)
SELECT 
  id, full_name, public_bio, public_avatar_url, 
  specialization, clinic_id, public_phone, public_telegram, public_whatsapp
FROM doctors 
WHERE public_slug = 'dr-john-smith-abc12345' AND is_public = true;

-- Test: Get services for clinic (as frontend does)
SELECT id, name, price 
FROM services 
WHERE clinic_id = 1 
ORDER BY name;

-- Test: Get clinic info (as frontend does)
SELECT id, name, logo_url 
FROM clinics 
WHERE id = 1;

-- Test: Count new leads (daily report)
SELECT DATE(created_at) as date, COUNT(*) as new_leads
FROM leads
WHERE status = 'new'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Test: Lead conversion rate
SELECT 
  ROUND(100.0 * COUNT(CASE WHEN status = 'converted' THEN 1 END) / COUNT(*), 2) as conversion_rate_percent,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'new' THEN 1 END) as new,
  COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted,
  COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM leads;

-- Test: Leads by doctor
SELECT 
  d.full_name,
  COUNT(l.id) as lead_count,
  COUNT(CASE WHEN l.status = 'new' THEN 1 END) as new_leads,
  COUNT(CASE WHEN l.status = 'contacted' THEN 1 END) as contacted,
  COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as converted
FROM doctors d
LEFT JOIN leads l ON d.id = l.doctor_id
WHERE d.is_public = true
GROUP BY d.id, d.full_name
ORDER BY lead_count DESC;

-- ============================================================================
-- 5. CLEAN UP SEED DATA (Run to remove test data)
-- ============================================================================

-- Delete test leads
DELETE FROM leads 
WHERE created_at > NOW() - INTERVAL '7 days' 
  AND source = 'doctor_public_page';

-- Disable public profiles for seed doctors
UPDATE doctors
SET is_public = false
WHERE id IN (1, 2, 3);

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
