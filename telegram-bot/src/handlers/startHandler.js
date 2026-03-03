/**
 * Telegram Bot - Start Command Handler
 *
 * Bu fayl Telegram Bot serverida ishlatiladi (../ShifoCRM_bot/)
 * Bemorlarni telefon raqami orqali ro'yxatdan o'tkazadi
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Foydalanuvchi holatini saqlash (telefon raqam kutilmoqda)
const userStates = new Map()

/**
 * /start buyrug'i
 */
async function handleStart(bot, msg) {
  const chatId = msg.chat.id
  const firstName = msg.from.first_name || ''
  const lastName = msg.from.last_name || ''
  const username = msg.from.username || ''

  const welcomeMessage =
    `👋 Assalomu alaykum${firstName ? ', ' + firstName : ''}!\n\n` +
    `ShifoCRM Telegram botiga xush kelibsiz!\n\n` +
    `Telegram orqali qabul eslatmalari va davolanish natijalarini olish uchun ro'yxatdan o'ting.\n\n` +
    `📱 Iltimos, telefon raqamingizni quyidagi formatda yuboring:\n\n` +
    `Format: +998901234567`

  await bot.sendMessage(chatId, welcomeMessage)

  // Holatni saqlash: telefon raqam kutilmoqda
  userStates.set(chatId, {
    step: 'waiting_phone',
    firstName,
    lastName,
    username
  })
}

/**
 * Telefon raqamni tekshirish va formatlash
 */
function normalizePhone(phone) {
  // Faqat raqamlarni qoldirish
  const digits = phone.replace(/\D/g, '')

  // Uzbekiston formatini tekshirish
  if (digits.length === 12 && digits.startsWith('998')) {
    return '+' + digits
  }
  if (digits.length === 9) {
    return '+998' + digits
  }

  return null
}

/**
 * Telefon raqam yuborilganda
 */
async function handlePhoneNumber(bot, msg) {
  const chatId = msg.chat.id
  const text = msg.text || ''

  const state = userStates.get(chatId)
  if (!state || state.step !== 'waiting_phone') {
    return false
  }

  // Telefon raqamni formatlash
  const phone = normalizePhone(text)

  if (!phone) {
    await bot.sendMessage(
      chatId,
      '❌ Noto\'g\'ri format!\n\n' +
      'Iltimos, telefon raqamni to\'g\'ri formatda yuboring:\n' +
      '+998901234567 yoki 901234567'
    )
    return true
  }

  try {
    // Supabase da telefon raqam bilan patient topish
    const { data: patients, error: searchError } = await supabase
      .from('patients')
      .select('id, name, phone')
      .eq('phone', phone)
      .limit(1)

    if (searchError) {
      console.error('Error searching patient:', searchError)
      await bot.sendMessage(
        chatId,
        '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.'
      )
      userStates.delete(chatId)
      return true
    }

    if (!patients || patients.length === 0) {
      await bot.sendMessage(
        chatId,
        `❌ ${phone} raqami tizimda topilmadi.\n\n` +
        'Iltimos, avval klinikada ro\'yxatdan o\'ting.\n\n' +
        'Qayta urinish uchun /start buyrug\'ini yuboring.'
      )
      userStates.delete(chatId)
      return true
    }

    const patient = patients[0]

    // telegram_chat_ids jadvaliga saqlash
    const { error: saveError } = await supabase
      .from('telegram_chat_ids')
      .upsert({
        patient_id: patient.id,
        chat_id: String(chatId),
        phone: phone,
        username: state.username,
        first_name: state.firstName,
        last_name: state.lastName,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'patient_id'
      })

    if (saveError) {
      console.error('Error saving chat_id:', saveError)
      await bot.sendMessage(
        chatId,
        '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.'
      )
      userStates.delete(chatId)
      return true
    }

    // Muvaffaqiyatli ro'yxatdan o'tdi
    await bot.sendMessage(
      chatId,
      `✅ Ro'yxatdan o'tdingiz!\n\n` +
      `👤 Ism: ${patient.name || 'Bemor'}\n` +
      `📱 Telefon: ${phone}\n\n` +
      `━━━━━━━━━━━━━━━━━\n\n` +
      `Endi siz Telegram orqali quyidagilarni olasiz:\n\n` +
      `⏰ Qabul eslatmalari\n` +
      `✅ Davolanish natijalari\n` +
      `💰 To'lov ma'lumotlari\n` +
      `📋 Boshqa xabarlar\n\n` +
      `Sog'lig'ingiz uchun g'amxo'rlik qilamiz! 💙`
    )

    userStates.delete(chatId)
    return true
  } catch (error) {
    console.error('Error in handlePhoneNumber:', error)
    await bot.sendMessage(
      chatId,
      '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.'
    )
    userStates.delete(chatId)
    return true
  }
}

/**
 * /help buyrug'i
 */
async function handleHelp(bot, msg) {
  const chatId = msg.chat.id

  const helpMessage =
    `📖 Yordam\n\n` +
    `Bu bot orqali siz quyidagilarni olasiz:\n\n` +
    `⏰ Qabul eslatmalari (24 soat va 1 soat oldin)\n` +
    `✅ Davolanish natijalari (xizmatlar, narxlar, chegirmalar)\n` +
    `💰 To'lov va qarz ma'lumotlari\n\n` +
    `━━━━━━━━━━━━━━━━━\n\n` +
    `Buyruqlar:\n` +
    `/start - Ro'yxatdan o'tish\n` +
    `/help - Yordam\n` +
    `/info - Mening ma'lumotlarim`

  await bot.sendMessage(chatId, helpMessage)
}

/**
 * /info buyrug'i - foydalanuvchi ma'lumotlarini ko'rsatish
 */
async function handleInfo(bot, msg) {
  const chatId = msg.chat.id

  try {
    const { data: chatData, error } = await supabase
      .from('telegram_chat_ids')
      .select(`
        patient_id,
        phone,
        patients:patient_id (id, name, phone, created_at)
      `)
      .eq('chat_id', String(chatId))
      .single()

    if (error || !chatData) {
      await bot.sendMessage(
        chatId,
        `❌ Siz hali ro'yxatdan o'tmadingiz.\n\n` +
        `Ro'yxatdan o'tish uchun /start buyrug'ini yuboring.`
      )
      return
    }

    const patient = chatData.patients
    const registeredDate = patient.created_at
      ? new Date(patient.created_at).toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '-'

    const infoMessage =
      `ℹ️ Mening ma'lumotlarim\n\n` +
      `👤 Ism: ${patient?.name || '-'}\n` +
      `📱 Telefon: ${chatData.phone || '-'}\n` +
      `📅 Ro'yxatdan o'tgan: ${registeredDate}\n\n` +
      `━━━━━━━━━━━━━━━━━\n\n` +
      `✅ Telegram orqali xabarlar olish faol`

    await bot.sendMessage(chatId, infoMessage)
  } catch (error) {
    console.error('Error in handleInfo:', error)
    await bot.sendMessage(
      chatId,
      '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.'
    )
  }
}

/**
 * Oddiy xabar yuborilganda
 */
async function handleMessage(bot, msg) {
  // Telefon raqam kutilayotgan holatda bo'lsa
  if (await handlePhoneNumber(bot, msg)) {
    return
  }

  // Boshqa hollarda yordam ko'rsatish
  const chatId = msg.chat.id
  await bot.sendMessage(
    chatId,
    `Buyruqlar:\n\n` +
    `/start - Ro'yxatdan o'tish\n` +
    `/help - Yordam\n` +
    `/info - Mening ma'lumotlarim`
  )
}

module.exports = {
  handleStart,
  handleHelp,
  handleInfo,
  handleMessage
}
