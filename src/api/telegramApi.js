/**
 * Telegram bot API client
 * ShifoCRM dan Telegram orqali xabar yuborish uchun
 */

const TELEGRAM_API_URL = import.meta.env.VITE_TELEGRAM_API_URL;
const TELEGRAM_API_KEY = import.meta.env.VITE_TELEGRAM_API_KEY;
const isDev = import.meta.env.DEV;

/** Development da CORS dan qochish uchun proxy orqali so'rov (localhost:5173 -> 3001) */
function getTelegramSendUrl() {
  const useProxy = isDev && (!TELEGRAM_API_URL || TELEGRAM_API_URL.includes('localhost:3001'));
  if (useProxy) return '/api/telegram/send';
  if (!TELEGRAM_API_URL) return null;
  return `${TELEGRAM_API_URL.replace(/\/$/, '')}/api/send`;
}

/**
 * Telegram orqali xabar yuborish
 * @param {Object} params
 * @param {string} params.patientId - Patient ID (ShifoCRM'dagi patient id)
 * @param {string} params.message - Xabar matni
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendTelegramNotification({ patientId, message }) {
  const sendUrl = getTelegramSendUrl();
  if (!sendUrl) {
    console.error('❌ TELEGRAM_API_URL sozlanmagan - .env VITE_TELEGRAM_API_URL kiriting');
    return { ok: false, error: 'NOT_CONFIGURED' };
  }
  if (!patientId || !message) {
    console.error('❌ TELEGRAM: Patient ID yoki message mavjud emas');
    return { ok: false, error: 'PATIENT_ID_AND_MESSAGE_REQUIRED' };
  }
  try {
    console.log(`📤 Telegram habar yuborilmoqda: patient_id=${patientId}`);

    const headers = {
      'Content-Type': 'application/json',
    };
    if (TELEGRAM_API_KEY) {
      headers['X-API-KEY'] = TELEGRAM_API_KEY;
    }

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        patient_id: String(patientId),
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'UNKNOWN_ERROR' }));
      const errorCode = errorData.error || 'HTTP_ERROR';

      // Xatolik kodlarini handle qilish
      if (response.status === 401) {
        console.error('❌ TELEGRAM: API key noto\'g\'ri. .env VITE_TELEGRAM_API_KEY soshing');
        return { ok: false, error: 'UNAUTHORIZED' };
      }
      if (response.status === 404 || errorCode === 'CHAT_ID_NOT_FOUND') {
        console.warn('⚠️ TELEGRAM: Bemor telegram botda ro\'yxatdan o\'tmagan. /start kiriting');
        return { ok: false, error: 'CHAT_ID_NOT_FOUND' };
      }
      if (response.status === 500) {
        console.error('❌ TELEGRAM SERVER ERROR:', errorData);
        return { ok: false, error: 'SERVER_ERROR' };
      }

      console.error('❌ Telegram API error:', errorData);
      return { ok: false, error: errorCode };
    }

    const result = await response.json().catch(() => ({ ok: true }));
    console.log('✅ Telegram habar yuborildi:', result);
    return result;
  } catch (error) {
    console.error('❌ TELEGRAM NETWORK ERROR:', error.message);
    return { ok: false, error: error.message || 'NETWORK_ERROR' };
  }
}

/**
 * Qabul eslatmasi yuborish
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.appointmentDate - Sana va vaqt (masalan: "2024-01-25 15:00")
 * @param {string} params.doctorName - Shifokor ismi
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendAppointmentReminder({ patientId, appointmentDate, doctorName }) {
  try {
    const message = `📅 Qabul eslatmasi:\n\n` +
      `Sana: ${appointmentDate}\n` +
      `Shifokor: ${doctorName}\n\n` +
      `Iltimos, vaqtida keling.`;
    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendAppointmentReminder):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Qarz eslatmasi yuborish
 * @param {Object} params
 * @param {string} params.patientId
 * @param {number} params.amount - Qarz miqdori
 * @param {string} params.dueDate - Muddat
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendDebtReminder({ patientId, amount, dueDate }) {
  try {
    const safeAmount = amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : 0
    const message = `💰 Qarz eslatmasi:\n\n` +
      `Miqdor: ${safeAmount.toLocaleString('uz-UZ')} so'm\n` +
      `Muddat: ${dueDate ?? '-'}\n\n` +
      `Iltimos, to'lovni amalga oshiring.`;
    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendDebtReminder):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Qabul tasdiqlandi xabari
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.appointmentDate
 * @param {string} params.doctorName
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendAppointmentConfirmed({ patientId, appointmentDate, doctorName }) {
  try {
    const message = `✅ Qabulingiz tasdiqlandi!\n\n` +
      `Sana: ${appointmentDate}\n` +
      `Shifokor: ${doctorName}\n\n` +
      `Kutib qolamiz!`;
    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendAppointmentConfirmed):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Qabul bekor qilindi xabari
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.reason - Sabab (ixtiyoriy)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendAppointmentCanceled({ patientId, reason }) {
  try {
    const message = `❌ Qabulingiz bekor qilindi.\n\n` +
      (reason ? `Sabab: ${reason}\n\n` : '') +
      `Qayta qabulga yozilish uchun biz bilan bog'laning.`;
    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendAppointmentCanceled):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Tashrif yakunlandi - Xizmatlar, narxlar, chegirmalar bilan to'liq hisobot
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.doctorName - Shifokor ismi
 * @param {string} params.doctorPhone - Shifokor telefoni (ixtiyoriy)
 * @param {string} params.visitDate - Tashrif sanasi
 * @param {Array<{name: string, price: number, tooth?: string}>} params.services - Xizmatlar ro'yxati
 * @param {number} params.discount - Chegirma foizi (0-100)
 * @param {number} params.totalBeforeDiscount - Chegirmagacha jami
 * @param {number} params.totalAfterDiscount - Chegirmadan keyin jami
 * @param {number} params.paid - To'langan summa
 * @param {number} params.remaining - Qolgan qarz
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendVisitCompleted({
  patientId,
  doctorName,
  doctorPhone,
  visitDate,
  services = [],
  discount = 0,
  totalBeforeDiscount = 0,
  totalAfterDiscount = 0,
  paid = 0,
  remaining = 0
}) {
  try {
    let message = `✅ Davolanish yakunlandi\n\n`;
    message += `📅 Sana: ${visitDate}\n`;
    message += `👨‍⚕️ Shifokor: ${doctorName}\n`;
    if (doctorPhone) {
      message += `📞 Tel: ${doctorPhone}\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━━\n\n`;

    if (services.length > 0) {
      message += `📋 Bajarilgan xizmatlar:\n\n`;
      services.forEach((service, index) => {
        const toothInfo = service.tooth ? ` (tish ${service.tooth})` : '';
        message += `${index + 1}. ${service.name}${toothInfo}\n`;
        message += `   ${service.price.toLocaleString('uz-UZ')} so'm\n\n`;
      });
      message += `━━━━━━━━━━━━━━━━━\n\n`;
    }

    message += `💰 Hisob:\n\n`;
    message += `Jami: ${totalBeforeDiscount.toLocaleString('uz-UZ')} so'm\n`;

    if (discount > 0) {
      message += `🎁 Chegirma: ${discount}%\n`;
      message += `To'lanadi: ${totalAfterDiscount.toLocaleString('uz-UZ')} so'm\n`;
    }

    message += `✅ To'landi: ${paid.toLocaleString('uz-UZ')} so'm\n`;

    if (remaining > 0) {
      message += `⚠️ Qarz: ${remaining.toLocaleString('uz-UZ')} so'm\n`;
    } else {
      message += `✨ Qarz yo'q\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━\n\n`;
    message += `Davolanish uchun rahmat! 🌟`;

    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendVisitCompleted):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Reja vaqtidan oldin eslatma (appointment avto eslatmasi)
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.appointmentDate - Sana va vaqt
 * @param {string} params.doctorName - Shifokor ismi
 * @param {string} params.clinicAddress - Klinika manzili (ixtiyoriy)
 * @param {string} params.hoursBeforeText - "1 soat" yoki "24 soat" kabi matn
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendAppointmentAutoReminder({
  patientId,
  appointmentDate,
  doctorName,
  clinicAddress,
  hoursBeforeText = '24 soat'
}) {
  try {
    let message = `⏰ Qabul eslatmasi (${hoursBeforeText})\n\n`;
    message += `📅 Sana va vaqt: ${appointmentDate}\n`;
    message += `👨‍⚕️ Shifokor: ${doctorName}\n`;
    if (clinicAddress) {
      message += `📍 Manzil: ${clinicAddress}\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━━\n\n`;
    message += `Iltimos, vaqtida keling yoki qabulni bekor qilish kerak bo'lsa, bizga xabar bering.\n\n`;
    message += `Sog'lig'ingiz uchun g'amxo'rlik qilamiz! 💙`;

    return await sendTelegramNotification({ patientId, message });
  } catch (error) {
    console.warn('Telegram xabar yuborilmadi (sendAppointmentAutoReminder):', error);
    return { ok: false, error: error.message || 'UNKNOWN_ERROR' };
  }
}

/**
 * Bemor yakunlanganda follow-up xabarlarni avtomatik rejalashtirish
 * @param {Object} params
 * @param {string|number} params.patientId
 * @param {string} [params.patientName]
 * @param {string} [params.phone]
 * @param {string} [params.notes]
 * @param {Array<{message: string, scheduledTime: string}>} [params.followUps]
 * @returns {Promise<{ok: boolean, scheduledCount?: number, error?: string}>}
 */
export async function schedulePatientFollowUps({
  patientId,
  patientName,
  phone,
  notes,
  followUps,
}) {
  const baseUrl = getTelegramSendUrl();
  const completionUrl = baseUrl?.replace(/\/api\/telegram\/send$/, '/api/telegram/patients/complete')
    ?.replace(/\/api\/send$/, '/api/patients/complete');

  if (!completionUrl) {
    console.warn('TELEGRAM_API_URL sozlanmagan (schedulePatientFollowUps)');
    return { ok: false, error: 'NOT_CONFIGURED' };
  }

  if (!patientId) {
    return { ok: false, error: 'PATIENT_ID_REQUIRED' };
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (TELEGRAM_API_KEY) {
      headers['X-API-KEY'] = TELEGRAM_API_KEY;
    }

    const response = await fetch(completionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        patientId: String(patientId),
        patientName: patientName || null,
        phone: phone || null,
        notes: notes || null,
        followUps: Array.isArray(followUps) ? followUps : undefined,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: payload?.error || 'HTTP_ERROR',
      };
    }

    return {
      ok: true,
      scheduledCount: payload?.scheduledCount || 0,
    };
  } catch (error) {
    return { ok: false, error: error.message || 'NETWORK_ERROR' };
  }
}

