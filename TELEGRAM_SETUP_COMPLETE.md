# 📱 Telegram Bot - TO'LIQ SETUP GUIDE

ShifoCRM uchun Telegram avtomatik xabarlar tizimini to'liq o'rnatish.

## 📋 Qo'llanma

### **1. Bosqich: Telegram Bot Yaratish (@BotFather)**

1. Telegram da **[@BotFather](https://t.me/BotFather)** ga `@BotFather` nom sifatida o'ting yoki search qilib toping
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: `My ShifoCRM Bot`)
4. Bot usernamni kiriting (masalan: `my_shifocrm_bot` - unikal bo'lishi kerak)
5. BotFather token beradi (quyidagicha ko'rinadi):
```
Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyzABCdefGHIjk
```

**Bu tokenni `.env` faylga saqlang**

### **2. Bosqich: Telegram Bot Serverini O'rnatish**

#### A) Papkani yaratish va setup

```bash
cd telegram-bot
npm install
```

#### B) `.env` faylni tayyorlash

```bash
# .env.example asosida
cp .env.example .env
```

`.env` faylni edit qiling:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyzABCdefGHIjk
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_KEY=my-secret-key-12345
PORT=3001
```

#### C) Supabase Migrations

Supabase SQL Editor da quyidagi SQL larni ishga tushiring:

**1. telegram_chat_ids jadvali:**

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

**2. appointments jadvali:**

Fail: `SUPABASE_APPOINTMENTS_TABLE.sql` ni Supabase SQL Editor da ishga tushiring.

```sql
-- Ichidagi barcha SQL ni copy-paste qiling
-- Bu appointments, triggers, RLS policies yaratadi
```

#### D) Bot Serverini Ishga Tushirish

```bash
# Development
npm run dev

# Production
npm start
```

**Natija:**
```
✅ Telegram bot started...
🚀 API server listening on port 3001
📡 Health check: http://localhost:3001/health
📬 Send endpoint: http://localhost:3001/api/send
```

### **3. Bosqich: ShifoCRM da Telegram Integratsiyasi**

#### A) Environment Variables

`.env` faylga qo'shing:

```env
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=my-secret-key-12345
```

**Production uchun:**
```env
VITE_TELEGRAM_API_URL=https://your-bot-domain.com
VITE_TELEGRAM_API_KEY=your-production-api-key
```

#### B) Avtomatik Xabarlar Allaqachon Integratsiya Qilindi

Quyidagi fayllar avtomatik ishlatiladi:
- `src/api/telegramApi.js` - Telegram API client
- `src/api/visitsApi.js` - Tashrif yakunlanganda avtomatik xabar

**Boshqa narsa qilish shart emas!** ✅

## ✅ Test Qilish

### Test 1: Bot Ro'yxatdan O'tish

1. Telegramda botni topish:
   - Search: `@my_shifocrm_bot` (o'z username ning)
   - Yoki BotFather dan `@` bilan boshlangan linkni bosing

2. Botga `/start` yuboring

3. Bot javob beradi:
```
👋 Assalomu alaykum!

ShifoCRM Telegram botiga xush kelibsiz!

📱 Iltimos, telefon raqamingizni quyidagi formatda yuboring:

Format: +998901234567
```

4. Telefon raqamni yuboring (masalan: `+998901234567`)

5. Agar ShifoCRM dagi patient bu raqamda mavjud bo'lsa:
```
✅ Ro'yxatdan o'tdingiz!

👤 Ism: Sardor Karim
📱 Telefon: +998901234567

...

Sog'lig'ingiz uchun g'amxo'rlik qilamiz! 💙
```

### Test 2: Tashrif Yakunlanganda Avtomatik Xabar

1. ShifoCRM da:
   - Bemor tanlang
   - Yangi tashrif yaratіng (odontogram bo'sh bo'lsa yok OK)
   - Xizmatlar qo'shing (farz qilib 2-3 ta)
   - To'liq narx kiriting
   - "Tashrifni yakunlash" tugmasini bosing

2. Bemor Telegram'da avtomatik xabar oladi:
```
✅ Davolanish yakunlandi

📅 Sana: 2 mart 2026
👨‍⚕️ Shifokor: Dr. Ahmadov
📞 Tel: +998901234567

━━━━━━━━━━━━━━━━━

📋 Bajarilgan xizmatlar:

1. Tosh plombalash (tish 16)
   350,000 so'm

2. Tishni tozalash
   150,000 so'm

━━━━━━━━━━━━━━━━━

💰 Hisob:

Jami: 500,000 so'm
✅ To'landi: 500,000 so'm
✨ Qarz yo'q

━━━━━━━━━━━━━━━━━

Davolanish uchun rahmat! 🌟
```

### Test 3: Appointment Eslatmalari

1. Supabase da appointment yaratish (SQL orqali):

```sql
INSERT INTO appointments (clinic_id, patient_id, doctor_id, scheduled_at, status)
VALUES (
  1,  -- clinic_id
  1,  -- patient_id (ShifoCRM dagi patient ID)
  1,  -- doctor_id
  NOW() + INTERVAL '24 hours',  -- 24 soat keyin
  'scheduled'
);
```

2. Cron job avtomatik ishga tushadi (har 10 daqiqada)

3. 24 soat oldin bemor eslatma oladi:
```
⏰ Qabul eslatmasi (24 soat)

📅 Sana va vaqt: 3 mart 2026, 15:00
👨‍⚕️ Shifokor: Dr. Karimov

...
```

4. 1 soat oldin yana eslatma oladi

## 🔧 API Endpoints

### POST /api/send

Xabar yuborish (ShifoCRM dan avtomatik chaqiriladi):

```bash
curl -X POST http://localhost:3001/api/send \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: my-secret-key-12345" \
  -d '{
    "patient_id": "1",
    "message": "Test xabari"
  }'
```

**Response:**
```json
{
  "ok": true,
  "message": "Message sent successfully"
}
```

### GET /health

Server status:

```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-02T12:34:56.789Z"
}
```

## 📊 Database Jadvallari

### telegram_chat_ids

| Ustun | Tur | Tavsif |
|-------|-----|--------|
| id | BIGSERIAL | Asosiy kalit |
| patient_id | BIGINT | ShifoCRM patient ID |
| chat_id | TEXT | Telegram chat ID |
| phone | TEXT | Telefon raqam |
| username | TEXT | Telegram @username |
| first_name | TEXT | Telegram ismi |
| last_name | TEXT | Telegram familiyasi |
| created_at | TIMESTAMPTZ | Yaratilgan vaqt |
| updated_at | TIMESTAMPTZ | Yangilangan vaqt |

### appointments

| Ustun | Tur | Tavsif |
|-------|-----|--------|
| id | BIGSERIAL | Asosiy kalit |
| clinic_id | BIGINT | Klinika ID |
| patient_id | BIGINT | Bemor ID |
| doctor_id | BIGINT | Shifokor ID |
| scheduled_at | TIMESTAMPTZ | Qabul vaqti |
| duration_minutes | INT | Davomiyligi |
| status | TEXT | scheduled, confirmed, completed, canceled, no_show |
| reminder_24h_sent | BOOLEAN | 24 soatlik eslatma yuborilganmi? |
| reminder_1h_sent | BOOLEAN | 1 soatlik eslatma yuborilganmi? |
| created_at | TIMESTAMPTZ | Yaratilgan vaqt |
| updated_at | TIMESTAMPTZ | Yangilangan vaqt |

## 🐛 Muammolar va Yechimlar

### Problem: Bot javob bermayapti

**Sabab:**
- TELEGRAM_BOT_TOKEN noto'g'ri
- Bot server ishlamayapti
- Network masalasi

**Yechim:**
```bash
# 1. Token tekshirish
echo $TELEGRAM_BOT_TOKEN

# 2. Bot server status
curl http://localhost:3001/health

# 3. Logs ko'rish
npm run dev
```

### Problem: Xabar yuborilmayapti

**Sabab:**
- Patient Telegram botda ro'yxatdan o'tmagan
- Chat ID topilmadi
- API Key noto'g'ri

**Yechim:**
```bash
# 1. telegram_chat_ids jadvalda patient borligini tekshirish
SELECT * FROM telegram_chat_ids WHERE patient_id = 1;

# 2. API Key tekshirish
# .env faylda VITE_TELEGRAM_API_KEY = telegram-bot .env da API_KEY bilan bir xil bo'lishi kerak

# 3. Logs ko'rish
npm run dev
```

### Problem: Eslatmalar ishlamayapti

**Sabab:**
- Cron job ishlamayapti
- Supabase connection problem
- appointments jadvali yo'q

**Yechim:**
```bash
# 1. Logs ko'rish
npm run dev
# Qidiring: "Starting appointment reminder cron job"

# 2. Supabase appointments jadvali tekshirish
SELECT * FROM appointments LIMIT 1;

# 3. Reminder flags tekshirish
SELECT id, reminder_24h_sent, reminder_1h_sent, scheduled_at 
FROM appointments 
ORDER BY scheduled_at DESC;
```

## 🚀 Production Deployment

### Option 1: VPS/Server

```bash
# 1. Node.js o'rnatish
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Bot fayllarini deploy qilish
git clone <repo> shifocrm-bot
cd shifocrm-bot
npm install
npm start

# 3. PM2 orqali daemon qilish
sudo npm install -g pm2
pm2 start src/index.js --name "shifocrm-bot"
pm2 startup
pm2 save
```

### Option 2: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

```bash
docker build -t shifocrm-bot .
docker run -d --env-file .env -p 3001:3001 shifocrm-bot
```

### Option 3: Railway/Render

1. GitHub ga push qiling
2. Railway.app yoki Render.com da repo connect qiling
3. Environment variables qo'shing
4. Avtomatik deploy

## 📝 Checklist

- [ ] Telegram Bot @BotFather dan yaratildi
- [ ] Bot token `.env` ga qo'shildi
- [ ] Supabase SQL migrations ishga tushirildi
- [ ] Telegram Bot server o'rnatildi
- [ ] ShifoCRM `.env` da VITE_TELEGRAM_API_URL qo'shildi
- [ ] Bot ro'yxatdan o'tish testi o'tdi
- [ ] Tashrif yakunlanganda xabar testi o'tdi
- [ ] Appointment eslatmalari testi o'tdi
- [ ] Production deployment sozlandi

## 📚 Qo'shimcha Resurslar

- [Telegram Bot API docs](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [Supabase docs](https://supabase.com/docs)
- `TELEGRAM_AUTO_NOTIFICATIONS.md` - Asosiy dokumentatsiya

## 📞 Yordam

Savollar yoki muammolar uchun:
- Issues: GitHub Issues
- Docs: `TELEGRAM_INTEGRATION.md`

---

✅ **Setup Tayyor!**

O'zi:
- ✅ Avtomatik tashrif xabar
- ✅ Avtomatik appointment eslatmalari
- ✅ Bemor ro'yxatdan o'tish
- ✅ To'liq ma'lumotlar bilan habarlar

**Bu asosan!** 🎉
