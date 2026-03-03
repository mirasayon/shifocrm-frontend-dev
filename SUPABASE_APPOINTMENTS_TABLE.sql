-- Appointments (Qabullar) jadvali
-- Bemor uchun rejalashtirilgan qabullar va avtomatik eslatmalar

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'canceled', 'no_show'
  notes TEXT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_reminders ON appointments(reminder_24h_sent, reminder_1h_sent, scheduled_at) 
  WHERE status = 'scheduled' OR status = 'confirmed';

-- Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Super admin hamma narsani ko'radi
CREATE POLICY "Super admins can view all appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert all appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all appointments"
  ON appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete all appointments"
  ON appointments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Clinic admin o'z klinikasini ko'radi
CREATE POLICY "Clinic admins can view their clinic appointments"
  ON appointments FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic admins can insert their clinic appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM clinic_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic admins can update their clinic appointments"
  ON appointments FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic admins can delete their clinic appointments"
  ON appointments FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_admins
      WHERE user_id = auth.uid()
    )
  );

-- Doktor o'z qabullarini ko'radi
CREATE POLICY "Doctors can view their appointments"
  ON appointments FOR SELECT
  USING (
    doctor_id IN (
      SELECT id FROM doctors
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their appointments"
  ON appointments FOR UPDATE
  USING (
    doctor_id IN (
      SELECT id FROM doctors
      WHERE user_id = auth.uid()
    )
  );

-- Registrator o'z klinikasini ko'radi
CREATE POLICY "Registrators can view their clinic appointments"
  ON appointments FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles
      WHERE id = auth.uid() AND role = 'registrator'
    )
  );

CREATE POLICY "Registrators can insert their clinic appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles
      WHERE id = auth.uid() AND role = 'registrator'
    )
  );

CREATE POLICY "Registrators can update their clinic appointments"
  ON appointments FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles
      WHERE id = auth.uid() AND role = 'registrator'
    )
  );

CREATE POLICY "Registrators can delete their clinic appointments"
  ON appointments FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles
      WHERE id = auth.uid() AND role = 'registrator'
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at_trigger
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- Comments
COMMENT ON TABLE appointments IS 'Bemorlar uchun rejalashtirilgan qabullar';
COMMENT ON COLUMN appointments.scheduled_at IS 'Qabul sanasi va vaqti';
COMMENT ON COLUMN appointments.duration_minutes IS 'Qabul davomiyligi (daqiqalarda)';
COMMENT ON COLUMN appointments.status IS 'scheduled, confirmed, completed, canceled, no_show';
COMMENT ON COLUMN appointments.reminder_24h_sent IS '24 soatlik eslatma yuborilganmi?';
COMMENT ON COLUMN appointments.reminder_1h_sent IS '1 soatlik eslatma yuborilganmi?';
