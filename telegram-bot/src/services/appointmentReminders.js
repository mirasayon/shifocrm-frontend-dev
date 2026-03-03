/**
 * Appointment Reminders - Avtomatik eslatmalar
 *
 * Bu fayl Telegram Bot serverida ishlatiladi (../ShifoCRM_bot/)
 * Har 10 daqiqada appointments jadvalini tekshiradi va eslatma yuboradi
 */

const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Telegram bot instance (bot.js dan import qiling)
 */
let bot = null

function setBotInstance(botInstance) {
  bot = botInstance
}

/**
 * Chat ID ni olish
 */
async function getChatId(patientId) {
  const { data } = await supabase
    .from('telegram_chat_ids')
    .select('chat_id')
    .eq('patient_id', patientId)
    .single()

  return data?.chat_id
}

/**
 * Sanani formatlash
 */
function formatDateTime(dateString) {
  const date = new Date(dateString)
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return date.toLocaleDateString('uz-UZ', options)
}

/**
 * 24 soatlik eslatma
 */
async function send24HourReminders() {
  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000)

  try {
    // 23-24 soat orasidagi qabullarni topish
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        scheduled_at,
        patients:patient_id (id, name, phone),
        doctors:doctor_id (id, name, phone)
      `)
      .gte('scheduled_at', in23Hours.toISOString())
      .lte('scheduled_at', in24Hours.toISOString())
      .eq('reminder_24h_sent', false)
      .in('status', ['scheduled', 'confirmed'])

    if (error) {
      console.error('Error fetching 24h appointments:', error)
      return
    }

    console.log(`Found ${appointments?.length || 0} appointments for 24h reminder`)

    for (const apt of appointments || []) {
      const chatId = await getChatId(apt.patient_id)
      if (!chatId) {
        console.warn(`No chat_id for patient ${apt.patient_id}`)
        continue
      }

      const message =
        `⏰ Qabul eslatmasi (24 soat)\n\n` +
        `📅 Sana va vaqt: ${formatDateTime(apt.scheduled_at)}\n` +
        `👨‍⚕️ Shifokor: ${apt.doctors?.name || 'Shifokor'}\n\n` +
        `━━━━━━━━━━━━━━━━━\n\n` +
        `Iltimos, vaqtida keling yoki qabulni bekor qilish kerak bo'lsa, bizga xabar bering.\n\n` +
        `Sog'lig'ingiz uchun g'amxo'rlik qilamiz! 💙`

      try {
        await bot.sendMessage(chatId, message)
        console.log(`✅ 24h reminder sent to patient ${apt.patient_id}`)

        // Belgilash: yuborildi
        await supabase
          .from('appointments')
          .update({ reminder_24h_sent: true })
          .eq('id', apt.id)
      } catch (sendError) {
        console.error(`Failed to send 24h reminder to ${apt.patient_id}:`, sendError)
      }
    }
  } catch (error) {
    console.error('Error in send24HourReminders:', error)
  }
}

/**
 * 1 soatlik eslatma
 */
async function send1HourReminders() {
  const now = new Date()
  const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000)
  const in50Minutes = new Date(now.getTime() + 50 * 60 * 1000)

  try {
    // 50-60 daqiqa orasidagi qabullarni topish
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        scheduled_at,
        patients:patient_id (id, name, phone),
        doctors:doctor_id (id, name, phone)
      `)
      .gte('scheduled_at', in50Minutes.toISOString())
      .lte('scheduled_at', in1Hour.toISOString())
      .eq('reminder_1h_sent', false)
      .in('status', ['scheduled', 'confirmed'])

    if (error) {
      console.error('Error fetching 1h appointments:', error)
      return
    }

    console.log(`Found ${appointments?.length || 0} appointments for 1h reminder`)

    for (const apt of appointments || []) {
      const chatId = await getChatId(apt.patient_id)
      if (!chatId) {
        console.warn(`No chat_id for patient ${apt.patient_id}`)
        continue
      }

      const message =
        `⏰ Qabul eslatmasi (1 soat)\n\n` +
        `📅 Sana va vaqt: ${formatDateTime(apt.scheduled_at)}\n` +
        `👨‍⚕️ Shifokor: ${apt.doctors?.name || 'Shifokor'}\n\n` +
        `━━━━━━━━━━━━━━━━━\n\n` +
        `Iltimos, vaqtida keling!\n\n` +
        `Sog'lig'ingiz uchun g'amxo'rlik qilamiz! 💙`

      try {
        await bot.sendMessage(chatId, message)
        console.log(`✅ 1h reminder sent to patient ${apt.patient_id}`)

        // Belgilash: yuborildi
        await supabase
          .from('appointments')
          .update({ reminder_1h_sent: true })
          .eq('id', apt.id)
      } catch (sendError) {
        console.error(`Failed to send 1h reminder to ${apt.patient_id}:`, sendError)
      }
    }
  } catch (error) {
    console.error('Error in send1HourReminders:', error)
  }
}

/**
 * Cron job - har 10 daqiqada ishga tushadi
 */
function startReminderCron() {
  if (!bot) {
    throw new Error('Bot instance not set! Call setBotInstance(bot) first.')
  }

  console.log('🔔 Starting appointment reminder cron job...')

  // Har 10 daqiqada
  cron.schedule('*/10 * * * *', async () => {
    console.log('⏰ Running appointment reminders check...')
    await send24HourReminders()
    await send1HourReminders()
  })

  console.log('✅ Appointment reminder cron job started!')
}

module.exports = {
  setBotInstance,
  startReminderCron,
  send24HourReminders,
  send1HourReminders
}
