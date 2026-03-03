# ShifoCRM Telegram Bot

Bemorlar uchun avtomatik xabarlar va eslatmalar tizimi.

## 🚀 Funksiyalar

### 1. Ro'yxatdan O'tish
- Bemor botga `/start` buyrug'ini yuboradi
- Telefon raqamini kiritadi
- Bot avtomatik ravishda ShifoCRM bilan bog'laydi

### 2. Avtomatik Xabarlar
- ✅ **Tashrif yakunlandi** - xizmatlar, narxlar, chegirmalar
- ⏰ **Qabul eslatmalari** - 24 soat va 1 soat oldin
- 💰 **Qarz eslatmalari**
- 📅 **Qabul tasdiqlandi/bekor qilindi**

### 3. Cron Job
- Har 10 daqiqada appointment eslatmalarini tekshiradi
- Avtomatik ravishda eslatma yuboradi

## 📦 O'rnatish

### 1. Dependencies

```bash
npm install
```

### 2. Environment Variables

`.env` faylini yarating (`.env.example` asosida):

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_KEY=my-secret-key-12345
PORT=3001
```

### 3. Supabase Migration

Supabase SQL Editor da quyidagi SQL ni ishga tushiring:

**telegram_chat_ids jadvali:**
```sql
CREATE TABLE IF NOT EXISTS telegram_chat_ids (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_patient ON telegram_chat_ids(patient_id);
CREATE INDEX idx_telegram_phone ON telegram_chat_ids(phone);
```

**appointments jadvali:**
```sql
-- ShifoCRM ning SUPABASE_APPOINTMENTS_TABLE.sql faylini ishga tushiring
```

### 4. Telegram Bot Yaratish

1. Telegram da [@BotFather](https://t.me/BotFather) ga o'ting
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: `ShifoCRM Bot`)
4. Bot username kiriting (masalan: `shifocrm_bot`)
5. BotFather sizga token beradi - `.env` ga qo'shing

### 5. Botni Ishga Tushirish

```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 API Endpoints

### POST /api/send

ShifoCRM dan xabar yuborish:

```bash
curl -X POST http://localhost:3001/api/send \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: my-secret-key-12345" \
  -d '{
    "patient_id": "123",
    "message": "Qabulingiz tasdiqlandi ✅"
  }'
```

### GET /health

Bot serverini tekshirish:

```bash
curl http://localhost:3001/health
```

## 📱 Bot Buyruqlari

- `/start` - Ro'yxatdan o'tish
- `/help` - Yordam
- `/info` - Mening ma'lumotlarim

## 🗂️ Fayl Strukturasi

```
telegram-bot/
├── src/
│   ├── index.js                         # Asosiy bot serveri
│   ├── handlers/
│   │   └── startHandler.js              # /start va xabar handlerlari
│   └── services/
│       └── appointmentReminders.js       # Cron job eslatmalar
├── package.json
├── .env.example
└── README.md
```

## 🔐 Xavfsizlik

- API Key orqali autentifikatsiya
- Supabase Service Key faqat serverda
- CORS sozlamalari
- Rate limiting (1 xabar/soniya)

## 🧪 Test Qilish

### 1. Ro'yxatdan O'tish

1. Telegram botga `/start` yuboring
2. Telefon raqamingizni kiriting: `+998901234567`
3. Bot tasdiqlash xabarini yuboradi

### 2. Xabar Yuborish (API orqali)

```bash
curl -X POST http://localhost:3001/api/send \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: my-secret-key-12345" \
  -d '{
    "patient_id": "1",
    "message": "Test xabari"
  }'
```

### 3. Appointment Eslatmalari

1. Supabase da appointment yarating (24 soatdan keyin)
2. Cron job avtomatik ishga tushadi
3. 10 daqiqa ichida bot eslatma yuboradi

## 📚 ShifoCRM Integratsiya

ShifoCRM loyihasida quyidagi fayllar avtomatik ishlatiladi:

- `src/api/telegramApi.js` - API client
- `src/api/visitsApi.js` - Tashrif yakunlanganda avtomatik xabar

Batafsil: `../shifocrm/TELEGRAM_AUTO_NOTIFICATIONS.md`

## 🐛 Muammolarni Hal Qilish

### Bot javob bermayapti
- `TELEGRAM_BOT_TOKEN` to'g'ri ekanligini tekshiring
- Bot serverini qayta ishga tushiring

### Xabar yuborilmayapti
- Patient Telegram botda ro'yxatdan o'tganligini tekshiring
- `telegram_chat_ids` jadvalida chat_id borligini tekshiring

### Eslatmalar ishlamayapti
- Cron job ishga tushganligini tekshiring (console logs)
- Supabase da `appointments` jadvali borligini tekshiring
- `reminder_24h_sent` va `reminder_1h_sent` ustunlari mavjudligini tekshiring

## 📞 Yordam

Savollar yoki muammolar uchun:
- GitHub Issues
- Email: support@shifocrm.uz

---

✅ **Status:** Tayyor va ishlamoqda!
📅 **Versiya:** 1.0
🔄 **Oxirgi yangilanish:** 2 Mart 2026
