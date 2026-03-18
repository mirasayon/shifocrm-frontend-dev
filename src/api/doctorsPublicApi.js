/**
 * Public Doctor Profile API - No authentication required for read-only public data
 * Fetch doctor info and services for public lead capture pages
 */

import { supabaseGet } from './supabaseConfig'
import { findAvailableSlots } from '@/lib/smartCalendar/schedulingEngine'

const ACTIVE_VISIT_STATUSES = ['pending', 'arrived', 'in_progress', 'scheduled', 'confirmed']

const DAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const normalizeSchedule = (schedule) => {
  if (!schedule || typeof schedule !== 'object') return null
  const days = schedule.days && typeof schedule.days === 'object' ? schedule.days : null
  if (!days) return null
  return {
    timezone: schedule.timezone || 'Asia/Tashkent',
    days
  }
}

const buildDateRange = (daysAhead = 14) => {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + Math.max(1, Number(daysAhead) || 14))
  const startDate = start.toISOString().slice(0, 10)
  const endDate = end.toISOString().slice(0, 10)
  return { startDate, endDate }
}

const mapVisitsByDate = (rows = []) => {
  const map = new Map()
  rows.forEach((visit) => {
    const date = String(visit.date || '').slice(0, 10)
    if (!date) return
    if (!map.has(date)) map.set(date, [])
    map.get(date).push(visit)
  })
  return map
}

const buildWorkingIntervalsForDay = (daySchedule) => {
  if (!daySchedule?.enabled) return []
  if (!daySchedule.start || !daySchedule.end) return []
  return [{ start: daySchedule.start, end: daySchedule.end }]
}

const buildBreakIntervalsForDay = (daySchedule) => {
  if (!daySchedule?.enabled) return []
  if (!daySchedule.break_start || !daySchedule.break_end) return []
  return [{ start: daySchedule.break_start, end: daySchedule.break_end }]
}

const toVisitInterval = (visit) => {
  if (!visit?.start_time) return null
  const start = String(visit.start_time)
  const end = visit.end_time
    ? String(visit.end_time)
    : null

  if (end) return { start, end }

  const duration = Number(visit.duration_minutes)
  if (!Number.isFinite(duration) || duration <= 0) return null

  const [h, m] = start.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const total = (h * 60) + m + duration
  const endH = Math.floor(total / 60)
  const endM = total % 60
  const endText = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  return { start, end: endText }
}

const isActiveVisit = (visit) => ACTIVE_VISIT_STATUSES.includes(String(visit?.status || '').toLowerCase())

const formatDateLabel = (dateText) => {
  const date = new Date(`${dateText}T00:00:00`)
  return date.toLocaleDateString('uz-UZ', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
}

/**
 * Get doctor by public slug (public, no auth required)
 * @param {string} slug - doctor public_slug
 * @returns {object|null} Doctor object with public fields or null
 */
export const getDoctorByPublicSlug = async (slug) => {
  try {
    const cleanSlug = String(slug || '').trim().toLowerCase()
    if (!cleanSlug) throw new Error('Slug required')

    const rows = await supabaseGet(
      'doctors',
      `public_slug=eq.${encodeURIComponent(cleanSlug)}&is_public=eq.true&select=id,full_name,public_bio,public_avatar_url,specialization,clinic_id,public_phone,public_telegram,public_whatsapp,work_schedule`
    )
    return rows && rows[0] ? rows[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch doctor profile:', error)
    throw error
  }
}

/**
 * Get services offered by a clinic doctor
 * @param {number} clinicId
 * @returns {array} List of services {id, name, price}
 */
export const getDoctorServices = async (clinicId) => {
  try {
    const numId = Number(clinicId)
    if (!Number.isFinite(numId)) throw new Error('Invalid clinic_id')

    const rows = await supabaseGet(
      'services',
      `clinic_id=eq.${numId}&order=name&select=id,name,base_price`
    )
    return (rows || []).map((item) => ({
      ...item,
      price: Number(item.base_price) || 0
    }))
  } catch (error) {
    console.error('❌ Failed to fetch services:', error)
    return []
  }
}

/**
 * Get clinic info (name, logo)
 * @param {number} clinicId
 * @returns {object|null} Clinic object or null
 */
export const getDoctorClinicInfo = async (clinicId) => {
  try {
    const numId = Number(clinicId)
    if (!Number.isFinite(numId)) throw new Error('Invalid clinic_id')

    const rows = await supabaseGet(
      'clinics',
      `id=eq.${numId}&select=id,name,logo_url`
    )
    return rows && rows[0] ? rows[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch clinic info:', error)
    throw error
  }
}

/**
 * Build dynamic free slots from doctor work schedule and existing visits.
 * @param {{doctorId: number|string, workSchedule?: any, daysAhead?: number, slotMinutes?: number}} options
 * @returns {Promise<Array<{date: string, label: string, slots: Array<{start: string, end: string}>}>>}
 */
export const getDoctorAvailableSlots = async ({
  doctorId,
  workSchedule = null,
  daysAhead = 14,
  slotMinutes = 30
}) => {
  try {
    const numDoctorId = Number(doctorId)
    if (!Number.isFinite(numDoctorId)) throw new Error('Invalid doctor_id')

    const schedule = normalizeSchedule(workSchedule)
    if (!schedule?.days) return []

    const { startDate, endDate } = buildDateRange(daysAhead)
    const rows = await supabaseGet(
      'visits',
      `doctor_id=eq.${numDoctorId}&date=gte.${startDate}&date=lte.${endDate}&select=id,date,start_time,end_time,duration_minutes,status&order=date.asc,start_time.asc`
    )

    const visitsByDate = mapVisitsByDate(rows || [])
    const result = []
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const dateText = cursor.toISOString().slice(0, 10)
      const dayKey = DAY_KEY_BY_INDEX[cursor.getDay()]
      const daySchedule = schedule.days?.[dayKey]
      if (!daySchedule?.enabled) continue

      const workingIntervals = buildWorkingIntervalsForDay(daySchedule)
      if (!workingIntervals.length) continue

      const breakIntervals = buildBreakIntervalsForDay(daySchedule)
      const existing = (visitsByDate.get(dateText) || [])
        .filter(isActiveVisit)
        .map(toVisitInterval)
        .filter(Boolean)

      const slots = findAvailableSlots({
        workingIntervals,
        breakIntervals,
        existingAppointments: existing,
        blockedIntervals: [],
        durationMinutes: Math.max(10, Number(slotMinutes) || 30),
        stepMinutes: Math.max(5, Number(slotMinutes) || 30)
      }).map((slot) => ({ start: slot.start, end: slot.end }))

      if (slots.length) {
        result.push({
          date: dateText,
          label: formatDateLabel(dateText),
          slots
        })
      }
    }

    return result
  } catch (error) {
    console.error('❌ Failed to build available slots:', error)
    return []
  }
}
