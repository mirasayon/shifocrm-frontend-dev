/**
 * Timezone Utilities - UTC <-> Local Time Conversion
 * Database: UTC'da saqlanadi
 * Frontend: Local time (Asia/Tashkent UTC+5) ko'rsatadi
 */

// Asia/Tashkent timezone offset (UTC+5)
const TASHKENT_OFFSET = 5 * 60 // 300 minutes

/**
 * Extract local time from any timestamp format
 * Supports:
 * - ISO string without offset: "2026-03-05T13:00:00" (treated as local)
 * - ISO string with Z: "2026-03-05T08:00:00Z" (UTC, convert to local)
 * - ISO string with offset: "2026-03-05T13:00:00+05:00" (already local)
 * - Time string: "13:00" (return as-is)
 *
 * @param {string|Date} value - Input timestamp or time string
 * @returns {string} Time in HH:MM format (local)
 */
export const extractLocalTime = (value) => {
  if (!value) return '09:00'

  // If it's already HH:MM format
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) {
    return value.substring(0, 5)
  }

  try {
    let date

    if (typeof value === 'string') {
      // ISO string
      if (value.includes('Z')) {
        // UTC format: "2026-03-05T08:00:00Z"
        // Convert UTC to local (Tashkent)
        date = new Date(value)
        date = new Date(date.getTime() + TASHKENT_OFFSET * 60 * 1000)
      } else if (value.includes('+') || value.includes('-')) {
        // Has offset: "2026-03-05T13:00:00+05:00"
        // Parse directly - offset already included
        date = new Date(value)
      } else {
        // No offset: "2026-03-05T13:00:00"
        // Treat as local time already
        date = new Date(value)
      }
    } else if (value instanceof Date) {
      date = value
    } else {
      return '09:00'
    }

    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  } catch (error) {
    console.error('Error extracting local time:', error, value)
    return '09:00'
  }
}

/**
 * Convert local time string to minutes from midnight
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number} Minutes from midnight
 */
export const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convert minutes from midnight to time string
 * @param {number} minutes - Minutes from midnight
 * @returns {string} Time in HH:MM format
 */
export const minutesToTimeString = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Get duration in minutes between two times
 * @param {string} startTime - Start time in HH:MM
 * @param {string} endTime - End time in HH:MM
 * @returns {number} Duration in minutes
 */
export const getTimeDuration = (startTime, endTime) => {
  const startMin = timeStringToMinutes(startTime)
  const endMin = timeStringToMinutes(endTime)
  const duration = endMin - startMin
  return duration > 0 ? duration : 30
}

/**
 * Add minutes to a time string
 * @param {string} timeStr - Time in HH:MM
 * @param {number} minutes - Minutes to add
 * @returns {string} Resulting time in HH:MM
 */
export const addMinutesToTime = (timeStr, minutes) => {
  const totalMin = timeStringToMinutes(timeStr) + minutes
  return minutesToTimeString(totalMin)
}

/**
 * Get current local time string
 * @returns {string} Current time in HH:MM format
 */
export const getCurrentLocalTime = () => {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Check if a time is within working hours (09:00 - 18:00)
 * @param {string} timeStr - Time in HH:MM
 * @param {number} startHour - Working hours start (default 9)
 * @param {number} endHour - Working hours end (default 18)
 * @returns {boolean}
 */
export const isWithinWorkingHours = (timeStr, startHour = 9, endHour = 18) => {
  const minutes = timeStringToMinutes(timeStr)
  const startMin = startHour * 60
  const endMin = endHour * 60
  return minutes >= startMin && minutes < endMin
}
