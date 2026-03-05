/**
 * Timezone utilities using Luxon
 * Handles UTC ↔ Asia/Tashkent conversion
 * All times stored as UTC in backend, displayed as Tashkent locally
 */

import { DateTime } from 'luxon'

const TASHKENT_TZ = 'Asia/Tashkent'

/**
 * Convert UTC ISO string to Tashkent DateTime
 * @param {string} utcIsoString - "2026-03-05T13:00:00Z" (must have Z suffix)
 * @returns {DateTime} DateTime in Tashkent timezone
 */
export const utcToTashkent = (utcIsoString) => {
  if (!utcIsoString) return DateTime.now().setZone(TASHKENT_TZ)

  try {
    // Parse as UTC (Z suffix required)
    const dt = DateTime.fromISO(utcIsoString, { zone: 'utc' })
    if (!dt.isValid) {
      console.error('Invalid ISO string:', utcIsoString)
      return DateTime.now().setZone(TASHKENT_TZ)
    }
    // Convert to Tashkent
    return dt.setZone(TASHKENT_TZ)
  } catch (error) {
    console.error('Error converting UTC to Tashkent:', error)
    return DateTime.now().setZone(TASHKENT_TZ)
  }
}

/**
 * Convert Tashkent DateTime to UTC ISO string
 * @param {DateTime} tashkentDateTime - DateTime in Tashkent
 * @returns {string} ISO string in UTC with Z suffix
 */
export const tashkentToUtc = (tashkentDateTime) => {
  try {
    // Ensure it's in Tashkent timezone
    const dt = tashkentDateTime.setZone(TASHKENT_TZ)
    // Convert to UTC and return ISO string with Z
    return dt.toUTC().toISO() || ''
  } catch (error) {
    console.error('Error converting Tashkent to UTC:', error)
    return DateTime.now().toUTC().toISO() || ''
  }
}

/**
 * Create DateTime in Tashkent timezone
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 * @param {number} second
 * @returns {DateTime} DateTime in Tashkent
 */
export const createTashkentDateTime = (
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0
) => {
  return DateTime.fromObject(
    { year, month, day, hour, minute, second },
    { zone: TASHKENT_TZ }
  )
}

/**
 * Get current time in Tashkent
 * @returns {DateTime}
 */
export const nowTashkent = () => {
  return DateTime.now().setZone(TASHKENT_TZ)
}

/**
 * Format DateTime for display
 * @param {DateTime} dt
 * @param {string} format
 * @returns {string}
 */
export const formatTime = (dt, format = 'HH:mm') => {
  return dt.toFormat(format)
}

/**
 * Format full appointment time range
 * @param {string} startUtc
 * @param {string} endUtc
 * @returns {string}
 */
export const formatTimeRange = (startUtc, endUtc) => {
  const start = utcToTashkent(startUtc)
  const end = utcToTashkent(endUtc)
  return `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`
}

/**
 * Get duration between two UTC times in minutes
 * @param {string} startUtc
 * @param {string} endUtc
 * @returns {number}
 */
export const getDurationMinutes = (startUtc, endUtc) => {
  const start = utcToTashkent(startUtc)
  const end = utcToTashkent(endUtc)
  const duration = end.diff(start, 'minutes')
  return Math.round(duration.minutes)
}

/**
 * Add minutes to UTC datetime and return new UTC ISO
 * @param {string} utcIsoString
 * @param {number} minutes
 * @returns {string}
 */
export const addMinutesToUtc = (utcIsoString, minutes) => {
  try {
    const dt = DateTime.fromISO(utcIsoString, { zone: 'utc' })
    const newDt = dt.plus({ minutes })
    return newDt.toISO() || ''
  } catch (error) {
    console.error('Error adding minutes to UTC:', error)
    return utcIsoString
  }
}

/**
 * Create appointment time in Tashkent, return as UTC ISO
 * @param {string} dateStr - "2026-03-05"
 * @param {string} timeStr - "13:00"
 * @returns {string} UTC ISO string
 */
export const createAppointmentTime = (dateStr, timeStr) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hour, minute] = timeStr.split(':').map(Number)

    const dt = DateTime.fromObject(
      { year, month, day, hour, minute },
      { zone: TASHKENT_TZ }
    )

    return dt.toUTC().toISO() || ''
  } catch (error) {
    console.error('Error creating appointment time:', error)
    return DateTime.now().toUTC().toISO() || ''
  }
}

/**
 * Check if appointment is within working hours
 * @param {string} startUtc
 * @param {string} endUtc
 * @param {number} workStartHour
 * @param {number} workEndHour
 * @returns {boolean}
 */
export const isWithinWorkingHours = (
  startUtc,
  endUtc,
  workStartHour = 8,
  workEndHour = 20
) => {
  try {
    const start = utcToTashkent(startUtc)
    const end = utcToTashkent(endUtc)

    return (
      start.hour >= workStartHour &&
      end.hour <= workEndHour
    )
  } catch (error) {
    console.error('Error checking working hours:', error)
    return false
  }
}

/**
 * Check if time is in past
 * @param {string} utcIsoString
 * @returns {boolean}
 */
export const isInPast = (utcIsoString) => {
  try {
    const dt = DateTime.fromISO(utcIsoString, { zone: 'utc' })
    return dt < DateTime.now().toUTC()
  } catch {
    return false
  }
}

/**
 * Get date range for calendar query (start of day to end of day in Tashkent)
 * @param {string} dateStr
 * @returns {{ start: string, end: string }}
 */
export const getDateRange = (dateStr) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)

    const startTz = DateTime.fromObject(
      { year, month, day, hour: 0, minute: 0 },
      { zone: TASHKENT_TZ }
    )
    const endTz = DateTime.fromObject(
      { year, month, day, hour: 23, minute: 59 },
      { zone: TASHKENT_TZ }
    )

    return {
      start: startTz.toUTC().toISO() || '',
      end: endTz.toUTC().toISO() || ''
    }
  } catch (error) {
    console.error('Error getting date range:', error)
    return { start: '', end: '' }
  }
}

/**
 * Get week range in UTC (for API queries)
 * @param {string} dateStr
 * @returns {{ start: string, end: string }}
 */
export const getWeekRange = (dateStr) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)

    const date = DateTime.fromObject(
      { year, month, day },
      { zone: TASHKENT_TZ }
    )

    // Monday to Sunday in Tashkent
    const weekStart = date.startOf('week')
    const weekEnd = date.endOf('week')

    return {
      start: weekStart.toUTC().toISO() || '',
      end: weekEnd.toUTC().toISO() || ''
    }
  } catch (error) {
    console.error('Error getting week range:', error)
    return { start: '', end: '' }
  }
}

/**
 * Get month range in UTC (for API queries)
 * @param {string} dateStr
 * @returns {{ start: string, end: string }}
 */
export const getMonthRange = (dateStr) => {
  try {
    const [year, month] = dateStr.split('-').map(Number)

    const date = DateTime.fromObject(
      { year, month, day: 1 },
      { zone: TASHKENT_TZ }
    )

    const monthStart = date.startOf('month')
    const monthEnd = date.endOf('month')

    return {
      start: monthStart.toUTC().toISO() || '',
      end: monthEnd.toUTC().toISO() || ''
    }
  } catch (error) {
    console.error('Error getting month range:', error)
    return { start: '', end: '' }
  }
}
