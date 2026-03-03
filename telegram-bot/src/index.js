/**
 * ShifoCRM Telegram Bot
 *
 * Bemorlar uchun avtomatik xabarlar:
 * - Qabul eslatmalari (24 soat va 1 soat oldin)
 * - Davolanish natijalari (xizmatlar, narxlar, chegirmalar)
 * - To'lov va qarz ma'lumotlari
 */

require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const express = require('express')
const cors = require('cors')
const patientCompletionApi = require('./api/patientCompletionApi')
const { getTelegramChatId } = require('./repository/telegramChatRepo')

// Handlers
const {
  handleStart,
  handleHelp,
  handleInfo,
  handleMessage
} = require('./handlers/startHandler')

// Services
const {
  setBotInstance,
  startReminderCron
} = require('./services/appointmentReminders')
const {
  startMessageScheduler,
  stopMessageScheduler,
  getSchedulerStatus
} = require('./services/messageScheduler')

// Environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API_KEY = process.env.API_KEY || 'my-secret-key-12345'
const PORT = process.env.PORT || 3001

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env')
  process.exit(1)
}

// Telegram Bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true })

console.log('🤖 Telegram bot started...')

// Bot commands
bot.onText(/\/start/, (msg) => handleStart(bot, msg))
bot.onText(/\/help/, (msg) => handleHelp(bot, msg))
bot.onText(/\/info/, (msg) => handleInfo(bot, msg))

// Oddiy xabarlar
bot.on('message', (msg) => {
  // Agar buyruq bo'lsa, o'tkazib yuborish
  if (msg.text && msg.text.startsWith('/')) return
  handleMessage(bot, msg)
})

// Error handling
bot.on('polling_error', (error) => {
  console.error('Telegram polling error:', error)
})

// Express API Server
const app = express()

app.use(cors())
app.use(express.json())

// API Key middleware
function checkApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
  next()
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    scheduler: getSchedulerStatus()
  })
})

app.get('/health/scheduler', (req, res) => {
  res.json({ ok: true, scheduler: getSchedulerStatus() })
})

/**
 * POST /api/send
 * ShifoCRM dan xabar yuborish
 *
 * Body:
 * {
 *   "patient_id": "123",
 *   "message": "Qabulingiz tasdiqlandi"
 * }
 */
app.post('/api/send', checkApiKey, async (req, res) => {
  try {
    const { patient_id, message } = req.body

    if (!patient_id || !message) {
      console.error('❌ POST /api/send: patient_id yoki message mavjud emas');
      return res.status(400).json({
        error: 'PATIENT_ID_AND_MESSAGE_REQUIRED'
      })
    }

    console.log(`🔍 Telegram chat_id qidirilmoqda: patient_id=${patient_id}`);

    const chatId = await getTelegramChatId(patient_id)

    if (!chatId) {
      console.error(`⚠️ Chat ID topilmadi: patient_id=${patient_id}`);
      return res.status(404).json({
        error: 'CHAT_ID_NOT_FOUND',
        message: 'Patient Telegram botda ro\'yxatdan o\'tmagan'
      })
    }

    console.log(`📤 Telegram xabari yuborilmoqda: chat_id=${chatId}`);

    // Telegram ga yuborish
    await bot.sendMessage(chatId, message)

    console.log(`✅ Telegram xabari muvaffaqiyatli yuborildi: chat_id=${chatId}`);

    res.json({
      ok: true,
      message: 'Message sent successfully'
    })
  } catch (error) {
    console.error('❌ POST /api/send error:', error.message);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message
    })
  }
})

app.use('/api/patients', checkApiKey, patientCompletionApi)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server listening on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`📬 Send endpoint: http://localhost:${PORT}/api/send`)
})

// Start appointment reminder cron job
setBotInstance(bot)
startReminderCron()
startMessageScheduler(bot, { intervalMs: 30000 })

console.log('✅ All systems ready!')

function shutdown(signal) {
  console.log(`🛑 ${signal} qabul qilindi, server to'xtatilmoqda...`)
  stopMessageScheduler()
  bot.stopPolling()
    .then(() => {
      console.log('✅ Telegram polling to‘xtatildi')
      process.exit(0)
    })
    .catch(() => process.exit(1))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
