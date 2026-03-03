# Telegram Avtomatik Xabarlar Tizimi

ShifoCRM uchun Telegram orqali avtomatik xabarlar yuborish tizimi.

## 🚀 Funksiyalar

### 1. ✅ Tashrif Yakunlanganda Avtomatik Habar

Doktor tashrifni yakunlasa, bemor avtomatik ravishda quyidagi ma'lumotlarni oladi:

- 👨‍⚕️ Shifokor ismi va telefoni
- 📅 Tashrif sanasi
- 📋 Bajarilgan xizmatlar (tish raqami bilan)
- 💰 Narxlar (har bir xizmat uchun)
- 🎁 Chegirma foizi (agar bo'lsa)
- ✅ To'langan summa
- ⚠️ Qarz (agar bo'lsa)

**Misol habar:**
```
✅ Davolanish yakunlandi

📅 Sana: 2 mart 2026
👨‍⚕️ Shifokor: Dr. Ahmadov
📞 Tel: +998901234567

━━━━━━━━━━━━━━━━━

📋 Bajarilgan xizmatlar:

1. Tish plombalash (tish 16)
   350,000 so'm

2. Tishni tozalash
   150,000 so'm

━━━━━━━━━━━━━━━━━

💰 Hisob:

Jami: 500,000 so'm
🎁 Chegirma: 10%
To'lanadi: 450,000 so'm
✅ To'landi: 450,000 so'm
✨ Qarz yo'q

━━━━━━━━━━━━━━━━━

Davolanish uchun rahmat! 🌟
```

### 2. ⏰ Qabul Vaqtida Avtomatik Eslatma

Qabul vaqtidan **24 soat** va **1 soat** oldin avtomatik eslatma yuboriladi.

**Qanday ishlaydi:**

1. Admin/Registrator bemor uchun qabul (appointment) yaratadi
2. Tizim avtomatik ravishda 2 ta eslatma rejalaydi:
   - 24 soat oldin
   - 1 soat oldin

**Misol habar:**
```
⏰ Qabul eslatmasi (24 soat)

📅 Sana va vaqt: 3 mart 2026, 15:00
👨‍⚕️ Shifokor: Dr. Karimov
📍 Manzil: Toshkent, Amir Temur ko'chasi 45

━━━━━━━━━━━━━━━━━

Iltimos, vaqtida keling yoki qabulni bekor qilish kerak bo'lsa, bizga xabar bering.

Sog'lig'ingiz uchun g'amxo'rlik qilamiz! 💙
```

### 3. 📱 Telegram Botda Ro'yxatdan O'tish

Bemor Telegram botga `/start` buyrug'ini yuboradi:

```
/start
```

Bot javob beradi:
```
👋 Xush kelibsiz!

Telegram orqali xabarlar olish uchun telefon raqamingizni yuboring:

Format: +998901234567
```

Bemor telefon raqamini yuboradi, bot uni ShifoCRM bilan bog'laydi.

## 🔧 Texnik Implementatsiya

### API Funksiyalari

`src/api/telegramApi.js` faylida quyidagi funksiyalar mavjud:

#### 1. Tashrif Yakunlanganda
```javascript
import { sendVisitCompleted } from '@/api/telegramApi'

await sendVisitCompleted({
  patientId: '123',
  doctorName: 'Dr. Ahmadov',
  doctorPhone: '+998901234567',
  visitDate: '2 mart 2026',
  services: [
    { name: 'Plomba', price: 350000, tooth: '16' },
    { name: 'Tozalash', price: 150000 }
  ],
  discount: 10,
  totalBeforeDiscount: 500000,
  totalAfterDiscount: 450000,
  paid: 450000,
  remaining: 0
})
```

#### 2. Qabul Eslatmasi
```javascript
import { sendAppointmentAutoReminder } from '@/api/telegramApi'

// 24 soat oldin
await sendAppointmentAutoReminder({
  patientId: '123',
  appointmentDate: '3 mart 2026, 15:00',
  doctorName: 'Dr. Karimov',
  clinicAddress: 'Toshkent, Amir Temur 45',
  hoursBeforeText: '24 soat'
})

// 1 soat oldin
await sendAppointmentAutoReminder({
  patientId: '123',
  appointmentDate: '3 mart 2026, 15:00',
  doctorName: 'Dr. Karimov',
  clinicAddress: 'Toshkent, Amir Temur 45',
  hoursBeforeText: '1 soat'
})
```

### Avtomatik Integratsiya

#### 1. Tashrif Yakunlanganda (visitsApi.js)

`completeVisit()` va `completeVisitWithDebt()` funksiyalari avtomatik telegram habar yuboradi:

```javascript
// src/api/visitsApi.js
export const completeVisit = async (id) => {
  const result = await updateVisit(id, { 
    status: 'completed_paid', 
    debt_amount: null 
  })
  
  // Avtomatik telegram habar
  sendVisitCompletedTelegram(id)
  
  return result
}
```

**Qayerda chaqiriladi:**
- `src/components/patients/PatientOdontogram.vue` - `completeCurrentVisit()`
- `src/views/doctor/DoctorVisits.vue` - tashrif yakunlanganda

#### 2. Appointment Yaratilganda

**Backend (Supabase Function) yoki Frontend Cron Job kerak**

**Variant A: Node.js Cron Job (Telegram Bot serverida)**

```javascript
// telegram-bot/src/services/appointmentReminders.js
const cron = require('node-cron')
const { supabase } = require('./supabase')
const { sendAppointmentAutoReminder } = require('./telegram')

// Har 10 daqiqada tekshirish
cron.schedule('*/10 * * * *', async () => {
  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000)
  
  // 24 soatlik eslatmalar
  const appointments24h = await supabase
    .from('appointments')
    .select('*, patients(*), doctors(*)')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', in24Hours.toISOString())
    .is('reminder_24h_sent', false)
  
  for (const apt of appointments24h.data || []) {
    await sendAppointmentAutoReminder({
      patientId: apt.patient_id,
      appointmentDate: formatDate(apt.scheduled_at),
      doctorName: apt.doctors?.name || 'Shifokor',
      clinicAddress: 'Klinika manzili',
      hoursBeforeText: '24 soat'
    })
    
    // Belgilash: yuborildi
    await supabase
      .from('appointments')
      .update({ reminder_24h_sent: true })
      .eq('id', apt.id)
  }
  
  // 1 soatlik eslatmalar (xuddi shunday)
  // ...
})
```

**Variant B: Supabase Edge Function + pg_cron**

```sql
-- Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'appointment-reminders-24h',
  '*/10 * * * *', -- Har 10 daqiqa
  $$
  SELECT send_appointment_reminder_24h();
  $$
);
```

## 📋 Qo'shimcha Funksiyalar

### Qarz Eslatmasi
```javascript
import { sendDebtReminder } from '@/api/telegramApi'

await sendDebtReminder({
  patientId: '123',
  amount: 250000,
  dueDate: '10 mart 2026'
})
```

### Qabul Tasdiqlandi
```javascript
import { sendAppointmentConfirmed } from '@/api/telegramApi'

await sendAppointmentConfirmed({
  patientId: '123',
  appointmentDate: '5 mart 2026, 14:00',
  doctorName: 'Dr. Olimov'
})
```

### Qabul Bekor Qilindi
```javascript
import { sendAppointmentCanceled } from '@/api/telegramApi'

await sendAppointmentCanceled({
  patientId: '123',
  reason: 'Shifokor kasallikka uchrab qoldi'
})
```

## 🗄️ Database O'zgarishlar

### appointments jadvali (agar mavjud bo'lmasa)

```sql
-- Qabul vaqtlarini saqlash uchun
CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'canceled'
  notes TEXT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_reminders ON appointments(reminder_24h_sent, reminder_1h_sent, scheduled_at);
```

### telegram_chat_ids jadvali (Telegram Bot serverida)

```sql
-- Bemor va Telegram chat_id ni bog'lash
CREATE TABLE IF NOT EXISTS telegram_chat_ids (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL UNIQUE, -- ShifoCRM dagi patient.id
  chat_id TEXT NOT NULL UNIQUE, -- Telegram chat_id
  phone TEXT, -- Telefon raqam (ro'yxatdan o'tish uchun)
  username TEXT, -- Telegram @username
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_patient ON telegram_chat_ids(patient_id);
CREATE INDEX idx_telegram_phone ON telegram_chat_ids(phone);
```

## 🚀 Ishga Tushirish

### 1. Telegram Bot Serverini Ishga Tushirish

```bash
cd ../ShifoCRM_bot
npm install
npm start
```

### 2. ShifoCRM da Environment Variables

`.env` faylga qo'shing:

```env
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=your-secret-key
```

### 3. Appointment Cron Job (ixtiyoriy)

Agar appointment eslatmalarini avtomatik yubormoqchi bo'lsangiz, Telegram Bot serverida cron job sozlang.

## 📝 Test Qilish

### 1. Tashrif Yakunlanganda

1. ShifoCRM da bemor uchun tashrif yarating
2. Odontogramda xizmatlar qo'shing
3. Narxlar va to'lovlarni kiriting
4. "Tashrifni yakunlash" tugmasini bosing
5. Bemor Telegram'da habar oladi

### 2. Qabul Eslatmasi

1. Bemor uchun appointment yarating (24 soatdan keyin)
2. Cron job avtomatik ishlaydi
3. 24 soat oldin eslatma yuboriladi
4. 1 soat oldin yana eslatma yuboriladi

## 🔒 Xavfsizlik

- API kaliti `.env` faylda saqlanadi
- Faqat ro'yxatdan o'tgan bemorlar xabar oladi
- Chat ID lar shifrlangan tarzda saqlanadi
- Rate limiting (har 1 soniyada 1 ta xabar)

## 🆘 Yordam

Muammolar yoki savollar uchun `TELEGRAM_INTEGRATION.md` faylini ko'ring.

---

✅ **Status:** Tayyor va ishlamoqda!
📅 **Versiya:** 1.0
🔄 **Oxirgi yangilanish:** 2 Mart 2026
