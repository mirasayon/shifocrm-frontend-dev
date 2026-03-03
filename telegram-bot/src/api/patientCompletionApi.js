const express = require('express')
const {
  recordPatientCompletion,
  getPatientLastCompletion
} = require('../repository/patientCompletionRepo')
const { scheduleFollowUpMessages } = require('../repository/scheduledMessagesRepo')
const { getTelegramChatId } = require('../repository/telegramChatRepo')

const router = express.Router()

function buildDefaultFollowUps({ patientName }) {
  const now = new Date()

  const plusDays = (days, hour = 10, minute = 0) => {
    const date = new Date(now)
    date.setDate(date.getDate() + days)
    date.setHours(hour, minute, 0, 0)
    return date.toISOString()
  }

  return [
    {
      message: `Assalomu alaykum${patientName ? `, ${patientName}` : ''}! 🌿\n\nDavolanishdan keyingi holatingiz qanday? Agar og'riq yoki noqulaylik bo'lsa, bizga yozing.`,
      scheduledTime: plusDays(1, 10, 0)
    },
    {
      message: `Salom${patientName ? `, ${patientName}` : ''}! 😊\n\nDavolanish natijasi bo'yicha qisqa fikringizni yubora olasizmi? Sizning fikringiz biz uchun muhim.`,
      scheduledTime: plusDays(3, 12, 0)
    },
    {
      message: `Eslatma${patientName ? `, ${patientName}` : ''}: profilaktik ko'rikni unutmaylik. 🦷\n\nKerak bo'lsa, sizga qulay vaqtga qabul rejalashtirib beramiz.`,
      scheduledTime: plusDays(7, 10, 30)
    }
  ]
}

router.post('/complete', async (req, res) => {
  try {
    const { patientId, patientName = null, phone = null, notes = null, followUps = null } = req.body || {}

    if (!patientId) {
      return res.status(400).json({ error: 'PATIENT_ID_REQUIRED' })
    }

    const chatId = await getTelegramChatId(patientId)

    const completion = await recordPatientCompletion({
      patientId,
      chatId,
      patientName,
      phone,
      notes,
      completionDate: new Date().toISOString()
    })

    const followUpPayload = Array.isArray(followUps) && followUps.length > 0
      ? followUps
      : buildDefaultFollowUps({ patientName })

    const scheduled = await scheduleFollowUpMessages({
      patientId,
      messages: followUpPayload
    })

    return res.json({
      ok: true,
      completion,
      scheduledCount: scheduled.length,
      chatLinked: Boolean(chatId)
    })
  } catch (error) {
    console.error('❌ POST /api/patients/complete error:', error.message)
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message })
  }
})

router.get('/:patientId/last-completion', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const completion = await getPatientLastCompletion(patientId)

    if (!completion) {
      return res.status(404).json({ error: 'NOT_FOUND' })
    }

    return res.json({ ok: true, data: completion })
  } catch (error) {
    console.error('❌ GET /api/patients/:patientId/last-completion error:', error.message)
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message })
  }
})

module.exports = router
