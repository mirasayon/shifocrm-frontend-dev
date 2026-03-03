const {
  getPendingMessages,
  updateMessageStatus
} = require('../repository/scheduledMessagesRepo')
const { getTelegramChatId } = require('../repository/telegramChatRepo')

let schedulerInterval = null
let schedulerRunning = false
let botInstance = null
let intervalMs = 30000
let lastRunAt = null
let lastError = null

async function processPendingMessages() {
  if (!botInstance) {
    throw new Error('Bot instance mavjud emas')
  }

  const nowIso = new Date().toISOString()
  const pendingMessages = await getPendingMessages({ nowIso, limit: 100 })

  if (pendingMessages.length === 0) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const messageRow of pendingMessages) {
    try {
      const chatId = await getTelegramChatId(messageRow.patient_id)

      if (!chatId) {
        await updateMessageStatus({
          id: messageRow.id,
          status: 'failed',
          failureReason: 'CHAT_ID_NOT_FOUND'
        })
        failed += 1
        continue
      }

      await botInstance.sendMessage(chatId, messageRow.message)

      await updateMessageStatus({
        id: messageRow.id,
        status: 'sent',
        sentAt: new Date().toISOString(),
        failureReason: null
      })

      sent += 1
      console.log(`✅ Scheduled xabar yuborildi: id=${messageRow.id}, patient_id=${messageRow.patient_id}`)
    } catch (error) {
      const reason = error?.message ? String(error.message).slice(0, 300) : 'SEND_FAILED'
      await updateMessageStatus({
        id: messageRow.id,
        status: 'failed',
        failureReason: reason
      })
      failed += 1
      console.error(`❌ Scheduled xabar yuborilmadi: id=${messageRow.id}`, reason)
    }
  }

  return {
    processed: pendingMessages.length,
    sent,
    failed
  }
}

function startMessageScheduler(bot, options = {}) {
  if (schedulerRunning) {
    return
  }

  botInstance = bot
  intervalMs = Number(options.intervalMs) || 30000

  schedulerInterval = setInterval(async () => {
    try {
      const result = await processPendingMessages()
      lastRunAt = new Date().toISOString()
      lastError = null

      if (result.processed > 0) {
        console.log(`📬 Scheduler: processed=${result.processed}, sent=${result.sent}, failed=${result.failed}`)
      }
    } catch (error) {
      lastError = error.message || 'UNKNOWN_ERROR'
      lastRunAt = new Date().toISOString()
      console.error('❌ Message scheduler error:', error.message)
    }
  }, intervalMs)

  schedulerRunning = true
  console.log(`⏱️ Message scheduler ishga tushdi (interval: ${intervalMs}ms)`)
}

function stopMessageScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }

  schedulerRunning = false
  console.log('🛑 Message scheduler to‘xtatildi')
}

function getSchedulerStatus() {
  return {
    running: schedulerRunning,
    intervalMs,
    lastRunAt,
    lastError
  }
}

module.exports = {
  startMessageScheduler,
  stopMessageScheduler,
  getSchedulerStatus,
  processPendingMessages
}
