/**
 * Visits API - Supabase REST API orqali.
 * Tenant isolation; clinic_id yo'q bo'lsa filtersiz fallback.
 */

import { supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'
import { sendVisitCompleted, schedulePatientFollowUps } from './telegramApi'

const TABLE = 'visits'

export const listVisits = async (query = 'order=created_at.desc') => {
  try {
    const cid = await getCurrentClinicId()
    return await supabaseGetWithClinicFallback(TABLE, query, cid)
  } catch (error) {
    console.error('❌ Failed to fetch visits:', error)
    throw error
  }
}

export const getVisitsByDoctorId = async (doctorId) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `doctor_id=eq.${Number(doctorId)}&order=created_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch visits by doctor:', error)
    throw error
  }
}

export const getVisitsByDate = async (date) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `date=eq.${date}&order=created_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch visits by date:', error)
    throw error
  }
}

export const getVisitsByDoctorAndDate = async (doctorId, date) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `doctor_id=eq.${Number(doctorId)}&date=eq.${date}&order=created_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch visits by doctor and date:', error)
    throw error
  }
}

export const getVisitsByDateRange = async (startDate, endDate) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `date=gte.${startDate}&date=lte.${endDate}&order=date.asc,created_at.asc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch visits by date range:', error)
    throw error
  }
}

export const getVisitsByDoctorAndDateRange = async (doctorId, startDate, endDate) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `doctor_id=eq.${Number(doctorId)}&date=gte.${startDate}&date=lte.${endDate}&order=date.asc,created_at.asc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch visits by doctor and date range:', error)
    throw error
  }
}

const generateId = async () => {
  try {
    const cid = await getCurrentClinicId()
    const q = 'select=id&order=id.desc&limit=1000'
    const visits = await supabaseGetWithClinicFallback(TABLE, q, cid)
    const existingIds = (visits || []).map(v => Number(v.id))
    let newId
    let attempts = 0
    do {
      newId = Math.floor(10000 + Math.random() * 90000)
      attempts++
      if (attempts > 100) newId = Math.floor(10000 + Date.now() % 90000)
    } while (existingIds.includes(newId))
    return newId
  } catch {
    return Math.floor(10000 + Date.now() % 90000)
  }
}

export const getVisitsByPatientId = async (patientId) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `patient_id=eq.${Number(patientId)}&order=created_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch visits:', error)
    throw error
  }
}

export const getVisitById = async (id) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) return null
    const cid = await getCurrentClinicId()
    const rows = await supabaseGetWithClinicFallback(TABLE, `id=eq.${numId}`, cid)
    return rows && rows[0] ? rows[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch visit:', error)
    throw error
  }
}

export const getActiveVisit = async (patientId) => {
  try {
    const allVisits = await getVisitsByPatientId(patientId)
    const activeStatuses = ['pending', 'arrived', 'in_progress']
    return allVisits.find(v => activeStatuses.includes(v.status)) || null
  } catch {
    return null
  }
}

/**
 * Status bo'yicha tashriflarni filtrlash
 * @param {Array} visits - Tashriflar ro'yxati
 * @param {string|Array} statusFilter - Status yoki statuslar ro'yxati
 * @returns {Array} - Filtrlangan tashriflar
 */
export const filterVisitsByStatus = (visits, statusFilter) => {
  if (!statusFilter || statusFilter === 'all') return visits
  if (Array.isArray(statusFilter)) {
    return visits.filter(v => statusFilter.includes(v.status))
  }
  return visits.filter(v => v.status === statusFilter)
}

export const getDebtVisits = async (patientId = null) => {
  try {
    const allVisits = patientId
      ? await getVisitsByPatientId(patientId)
      : await listVisits('order=created_at.desc')
    return allVisits
      .filter(v => {
        const hasDebt = v.debt_amount != null && Number(v.debt_amount) > 0
        const isDebtStatus = v.status === 'completed_debt'
        return hasDebt || isDebtStatus
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch {
    return []
  }
}

/**
 * Bemorning umumiy qarzdorligini hisoblash
 * @param {number|string} patientId - Bemor ID
 * @returns {Promise<number>} - Umumiy qarzdorlik summasi
 */
export const getPatientTotalDebt = async (patientId) => {
  try {
    const debtVisits = await getDebtVisits(patientId)
    return debtVisits.reduce((total, visit) => {
      const debt = visit.debt_amount || 0
      return total + Number(debt)
    }, 0)
  } catch (error) {
    console.error('❌ Failed to calculate total debt:', error)
    return 0
  }
}

/**
 * Qarz summasi hisoblash: debt_amount = price - paid_amount
 * @param {number|null} price - Xizmat narxi
 * @param {number|null} paidAmount - To'langan summa
 * @returns {number|null} - Qarzdorlik summasi
 */
const calculateDebt = (price, paidAmount) => {
  if (!price || price === 0) return null
  const paid = paidAmount || 0
  const debt = price - paid
  return debt > 0 ? debt : null
}

/**
 * Yangi tashrif yaratish
 * @param {Object} data - { patient_id, doctor_id, doctor_name, notes, status, price, paid_amount, service_name }
 * @returns {Promise<Object>}
 */
export const createVisit = async ({
  patient_id,
  doctor_id,
  doctor_name = '',
  notes = '',
  status = 'pending',
  price = null,
  paid_amount = null,
  debt_amount = null,
  service_name = null,
  date = null,
  start_time = null,
  end_time = null,
  duration_minutes = null,
  room = null,
  channel = null,
  updated_by = null
}) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

    const now = new Date().toISOString()
    const id = await generateId()
    let finalDebtAmount = debt_amount
    if (debt_amount === null && price !== null) finalDebtAmount = calculateDebt(price, paid_amount)

    const newVisit = {
      id,
      patient_id: Number(patient_id),
      doctor_id: doctor_id ? Number(doctor_id) : null,
      doctor_name: doctor_name || null,
      date: date || now.split('T')[0],
      status,
      notes: notes || null,
      price: price != null ? Number(price) : null,
      paid_amount: paid_amount != null ? Number(paid_amount) : null,
      debt_amount: finalDebtAmount != null ? Number(finalDebtAmount) : null,
      service_name: service_name || null,
      start_time: start_time || null,
      end_time: end_time || null,
      duration_minutes: duration_minutes != null ? Number(duration_minutes) : null,
      room: room || null,
      channel: channel || null,
      updated_by: updated_by || null,
      clinic_id: cid
    }

    const result = await supabasePost(TABLE, newVisit)
    const created = result && result[0]
    if (!created) throw new Error('Tashrif yaratishda javob olinmadi.')
    return created
  } catch (error) {
    console.error('❌ Failed to create visit:', error)
    throw error
  }
}

/**
 * Tashrifni yangilash
 * @param {number|string} id
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const updateVisit = async (id, payload) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) {
      throw new Error('Invalid visit ID')
    }
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

    // Avval mavjud visitni olish
    const currentVisit = await getVisitById(id)
    if (!currentVisit) {
      throw new Error('Visit not found')
    }

    const updateData = { ...payload }

    // Agar price yoki paid_amount o'zgarsa, debt_amount ni avtomatik hisoblash
    if (updateData.price !== undefined || updateData.paid_amount !== undefined) {
      const price = updateData.price !== undefined ? updateData.price : currentVisit.price
      const paidAmount = updateData.paid_amount !== undefined ? updateData.paid_amount : currentVisit.paid_amount

      // Faqat debt_amount alohida berilmagan bo'lsa, avtomatik hisobla
      if (updateData.debt_amount === undefined) {
        updateData.debt_amount = calculateDebt(price, paidAmount)
      }
    }

    // Null qiymatlarni to'g'ri yuborish
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, updateData)
    console.log('✅ Visit updated:', result[0])
    return result && result[0] ? result[0] : null
  } catch (error) {
    console.error('❌ Failed to update visit:', error)
    throw error
  }
}

/**
 * Tashrifni yakunlash (completed_paid)
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const completeVisit = async (id) => {
  const result = await updateVisit(id, { status: 'completed_paid', debt_amount: null })
  // Telegram habar yuborish (async, xatolarni ushlamaydi)
  sendVisitCompletedTelegram(id).catch(err => console.warn('Telegram habar yuborilmadi:', err))
  return result
}

/**
 * Tashrifni qarzdor sifatida yakunlash
 * @param {number|string} id
 * @param {number} debtAmount - Qarzdorlik summasi (ixtiyoriy, agar price/paid_amount bo'lsa avtomatik hisoblanadi)
 * @returns {Promise<Object>}
 */
export const completeVisitWithDebt = async (id, debtAmount = null) => {
  const visit = await getVisitById(id)
  if (!visit) throw new Error('Visit not found')

  // Agar debtAmount berilmagan bo'lsa va price/paid_amount mavjud bo'lsa, avtomatik hisobla
  let finalDebtAmount = debtAmount
  if (debtAmount === null && visit.price !== null) {
    finalDebtAmount = calculateDebt(visit.price, visit.paid_amount)
  }

  const result = await updateVisit(id, {
    status: 'completed_debt',
    debt_amount: finalDebtAmount !== null ? Number(finalDebtAmount) : null
  })

  // Telegram habar yuborish (async, xatolarni ushlamaydi)
  sendVisitCompletedTelegram(id).catch(err => console.warn('Telegram habar yuborilmadi:', err))

  return result
}

/**
 * Qarzdorlikni to'lash
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const payDebt = async (id) => {
  return updateVisit(id, { status: 'completed_paid', debt_amount: null })
}

/**
 * Tashrifni o'chirish
 * @param {number|string} id
 * @returns {Promise<boolean>}
 */
export const deleteVisit = async (id) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) {
      throw new Error('Invalid visit ID')
    }
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    await supabaseDeleteWhere(TABLE, q)
    console.log('✅ Visit deleted:', numId)
    return true
  } catch (error) {
    console.error('❌ Failed to delete visit:', error)
    throw error
  }
}

/**
 * Tashrif yakunlanganda bemor telegram'ga avtomatik habar yuborish
 * @param {number|string} visitId
 */
async function sendVisitCompletedTelegram(visitId) {
  try {
    // Visit, patient, doctor, va visit_services ma'lumotlarini olish
    const visit = await getVisitById(visitId)
    if (!visit) return

    // Patient ma'lumotini olish
    const { supabaseGet } = await import('./supabaseConfig')
    const patients = await supabaseGet('patients', `id=eq.${visit.patient_id}`)
    const patient = patients?.[0]
    if (!patient) return

    // Doctor ma'lumotini olish
    let doctorName = 'Shifokor'
    let doctorPhone = null
    if (visit.doctor_id) {
      const doctors = await supabaseGet('doctors', `id=eq.${visit.doctor_id}`)
      const doctor = doctors?.[0]
      if (doctor) {
        doctorName = doctor.name || 'Shifokor'
        doctorPhone = doctor.phone || null
      }
    }

    // Visit services ma'lumotlarini olish
    const { getVisitServicesByVisitId } = await import('./visitServicesApi')
    const visitServices = await getVisitServicesByVisitId(visitId)

    // Xizmatlar ro'yxatini tayyorlash
    const services = visitServices.map(vs => ({
      name: vs.service_name || 'Xizmat',
      price: Number(vs.price) || 0,
      tooth: vs.tooth_id || null
    }))

    // Narxlarni hisoblash
    const totalPrice = Number(visit.price) || 0
    const paidAmount = Number(visit.paid_amount) || 0
    const discountPercent = Number(visit.discount_percent) || 0
    const debtAmount = Number(visit.debt_amount) || 0

    // Chegirmadan oldingi narx
    const totalBeforeDiscount = discountPercent > 0
      ? Math.round(totalPrice / (1 - discountPercent / 100))
      : totalPrice

    // Visit sanasini formatlash
    const visitDate = visit.date
      ? new Date(visit.date).toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : new Date().toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

    // Telegram habar yuborish
    await sendVisitCompleted({
      patientId: String(patient.id),
      doctorName,
      doctorPhone,
      visitDate,
      services,
      discount: discountPercent,
      totalBeforeDiscount,
      totalAfterDiscount: totalPrice,
      paid: paidAmount,
      remaining: debtAmount
    })

    const followUpResult = await schedulePatientFollowUps({
      patientId: String(patient.id),
      patientName: patient.full_name || patient.name || null,
      phone: patient.phone || null,
      notes: 'Visit completed from visitsApi'
    })

    if (!followUpResult.ok) {
      console.warn('⚠️ Follow-up scheduling failed:', followUpResult.error)
    }

    console.log('✅ Visit completed telegram sent:', visitId)
  } catch (error) {
    // Xato bo'lsa, asosiy jarayonni to'xtatmaymiz
    console.warn('⚠️ Failed to send visit completed telegram:', error)
  }
}

