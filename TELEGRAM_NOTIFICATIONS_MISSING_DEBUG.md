# Telegram Habarlar Kemayabdi - Debug Guide

**Muammo**: Loyihani yakunlaganda Telegram habarlar kelma yotibdi

## Asosiy Sabablar

### 1️⃣ **Telegram Bot Server ishlamayabdi**
Bot serveri PORT 3001 da ishlamasa, hech qanday habar yuborilmaydi.

**Tekshirish**:
```powershell
# Terminal 1: Telegram bot server'i boshlash
cd c:\Users\Администратор\Desktop\shifocrm\telegram-bot
npm install
npm start

# Keyin birinchi terminalni ochiq saqlang va yangi terminal ochib:
# Terminal 2: ShifoCRM boshlash
cd c:\Users\Администратор\Desktop\shifocrm
npm run dev
```

**O'zbekcha xabar**:
```
🤖 Telegram bot started...
🚀 API server listening on port 3001
✅ All systems ready!
```

### 2️⃣ **Bemor Telegram botda ro'yxatdan o'tmagan**
Agar bemor `/start` buyrugini kiritish yoki telefon raqamini kiritmasa, `telegram_chat_ids` jadvalda yozuvi bo'lmaydi.

**Tekshirish va tuzatish**:
```
Telegram botda: /start
Keyin: Telefon raqamini kiriting
Keyin: OK ni bosing
```

**Natija**: 
```
✅ Ro'yxatdan o'tganingiz uchun rahmat! 
Endi tashrif natijalari va qabul eslatmalari avtomatik yuboriladi.
Patient ID: 72346
```

### 3️⃣ **.env faylida VITE_TELEGRAM_API_KEY sozlanmagan**
ShifoCRM da API key bot serverining API keyiga mos bo'lishi kerak.

**Tekshirish**:
```powershell
# .env faylini ochib, quyidagini tekshiring:
Get-Content c:\Users\Администратор\Desktop\shifocrm\.env | Select-String "TELEGRAM"
```

**Kerakli qiymatlar**:
```
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=my-secret-key-12345
```

**Telegram-bot/.env**:
```
API_KEY=my-secret-key-12345
TELEGRAM_BOT_TOKEN=5123456789:ABCDefGHiJKlmnoPqrstUvWxyz...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

## Debug Loglarini Tekshirish

### ShifoCRM konsolida:
```
📤 Telegram habar yuborilmoqda: patient_id=72346
✅ Telegram habar yuborildi: { ok: true, message: 'Message sent successfully' }
```

**Agar bu mavjud bo'lmasa:**
- `.env` sozlamalari to'g'ri emas
- Bot server ishlamayabdi
- Bemor chatId `telegram_chat_ids` da mavjud emas

### Telegram Bot serveri konsolida:
```
🔍 Telegram chat_id qidirilmoqda: patient_id=72346
📤 Telegram xabari yuborilmoqda: chat_id=1234567890
✅ Telegram xabari muvaffaqiyatli yuborildi: chat_id=1234567890
```

**Agar bu mavjud bo'lmasa:**
- `SUPABASE_URL` yoki `SUPABASE_SERVICE_KEY` noto'g'ri
- `telegram_chat_ids` jadvalida yozuv yo'q
- Bot tokeni noto'g'ri

## Step-by-Step Debugging

### 1. Bot Serverini Boshlang
```powershell
cd c:\Users\Администратор\Desktop\shifocrm\telegram-bot

# .env faylni tekshiring
Get-Content .env

# Boshlang
npm start
```

**Kutayotgan o'zbekcha xabar**:
```
🤖 Telegram bot started...
✅ All systems ready!
```

### 2. ShifoCRM .env Tekshiring
```powershell
cd c:\Users\Администратор\Desktop\shifocrm
Get-Content .env | Select-String "TELEGRAM"
```

**Kerakli yozuvlar**:
```
VITE_TELEGRAM_API_URL=http://localhost:3001
VITE_TELEGRAM_API_KEY=my-secret-key-12345
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 3. Bemor Telegram Ro'yxatdan O'tishini Tekshiring
```
Telegram'da: @your_bot_name
/start
Telefon raqamini kiriting: +998901234567
OK
```

**Kutayotgan xabar**:
```
✅ Ro'yxatdan o'tganingiz uchun rahmat! 
Patient ID: 72346
```

### 4. Supabase'da Yozuvni Tekshiring
```sql
SELECT * FROM telegram_chat_ids WHERE patient_id = '72346';
```

**O'zbekcha natija**:
| patient_id | chat_id | phone | username | first_name |
|-----------|---------|-------|----------|-----------|
| 72346 | 1234567890 | +998901234567 | username | First Name |

Agar bo'sh bo'lsa, bemor `/start` kiritmagan.

### 5. Tashrif Yakunlang va Loglarni Tekshiring

**ShifoCRM konsolida (Developer Tools - F12)**:
```javascript
// Konsolni ochib quyidagini izlang:
// ✅ Telegram habar yuborildi: { ok: true }
// YOKI
// ⚠️ TELEGRAM: Bemor telegram botda ro'yxatdan o'tmagan
```

**Telegram Bot konsolida**:
```
✅ Telegram xabari muvaffaqiyatli yuborildi: chat_id=1234567890
```

## Xatolik Xabarlarini Dekodi Qilish

| Xatolik | Sababı | Tuzatish |
|---------|--------|----------|
| `NOT_CONFIGURED` | `VITE_TELEGRAM_API_URL` mavjud emas | .env da VITE_TELEGRAM_API_URL qo'shing |
| `UNAUTHORIZED` | API key noto'g'ri | .env API key'ni tekshiring |
| `CHAT_ID_NOT_FOUND` | Bemor ro'yxatdan o'tmagan | Telegram'da /start kiriting |
| `NETWORK_ERROR` | Bot serveri ishlamayabdi | Bot serverni boshlang |
| `SERVER_ERROR` | Bot serveri hatalik | Bot serverni qayta boshlang |

## Network Tekshirish

### Bot Server Tekshiring (Health Check)
```powershell
Invoke-WebRequest http://localhost:3001/health -Method GET
```

**Kutayotgan natija**:
```json
{
  "status": "ok",
  "timestamp": "2024-03-02T10:30:45.123Z"
}
```

**Agar xato bo'lsa**:
- Bot server ishlamayabdi → `npm start` kiriting
- Port 3001 boshqa jarayon tomonidan ishlatilmoqda → portni o'zgartiring

## Komplet Test

```powershell
# 1. Bot serverni boshlang (TERMINAL 1)
cd c:\Users\Администратор\Desktop\shifocrm\telegram-bot
npm start

# 2. ShifoCRM'ni boshlang (TERMINAL 2)
cd c:\Users\Администратор\Desktop\shifocrm
npm run dev

# 3. Browser'da lokalni oching
# http://localhost:5173

# 4. Bemor bilan login qilib, tashrif yakunlang

# 5. TERMINAL 1 (Bot serveri) loglarini tekshiring
# ✅ Telegram xabari muvaffaqiyatli yuborildi: chat_id=...

# 6. TERMINAL 2 (ShifoCRM) konsolini tekshiring (F12)
# ✅ Telegram habar yuborildi: { ok: true }

# 7. Telegram'da habar tekshiring
```

## Production Deployment

Agar PRODUCTION'da ishlatmoqchi bo'lsangiz:

1. **Bot serverni cloud'ga deploy qiling** (Render, Heroku, AWS)
   ```
   VITE_TELEGRAM_API_URL=https://your-bot-domain.com
   VITE_TELEGRAM_API_KEY=production-api-key
   ```

2. **Polling o'rniga Webhook ishlating**
   ```javascript
   // index.js'da:
   const bot = new TelegramBot(BOT_TOKEN, { 
     webHook: { 
       port: PORT,
       host: '0.0.0.0'
     }
   })
   ```

## Dopolnitel'no

- **Bot logging**: `console.log()` vs `console.error()` - xatolik severitasi
- **Rate limiting**: Telegram 30 msg/sec gacha cheklaydi
- **Timezone**: "uz-UZ" locale ishlayotganini tekshiring

Savollar? Telegram botda `/info` kiriting yoki doctor'ning raqamini chiqaring!
