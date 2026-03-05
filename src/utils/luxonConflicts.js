/**
 * Conflict detection utilities for appointments
 * - Overlap detection
 * - Working hours validation
 * - Time slot validation
 */

import { DateTime } from 'luxon'
import { utcToTashkent, isWithinWorkingHours } from './luxonTimezone.js'

/**
 * Check if two appointments overlap
 * @param {Object} appt1 - { doctor_id, start_time, end_time }
 * @param {Object} appt2
 * @returns {boolean}
 */
export const hasOverlap = (appt1, appt2) => {
  const start1 = DateTime.fromISO(appt1.start_time, { zone: 'utc' })
  const end1 = DateTime.fromISO(appt1.end_time, { zone: 'utc' })
  const start2 = DateTime.fromISO(appt2.start_time, { zone: 'utc' })
  const end2 = DateTime.fromISO(appt2.end_time, { zone: 'utc' })

  // No overlap if: end1 <= start2 OR end2 <= start1
  return !(end1 <= start2 || end2 <= start1)
}

/**
 * Check if new appointment conflicts with existing ones (same doctor)
 * @param {Object} newAppointment
 * @param {Array} existingAppointments
 * @returns {Object|null} Conflicting appointment or null
 */
export const checkConflicts = (newAppointment, existingAppointments) => {
  const sameDoctor = existingAppointments.filter(
    a => a.doctor_id === newAppointment.doctor_id
  )

  for (const existing of sameDoctor) {
    if (hasOverlap(newAppointment, existing)) {
      return existing
    }
  }

  return null
}

/**
 * Get all conflicts for appointment with detailed info
 * @param {Object} newAppointment
 * @param {Array} existingAppointments
 * @returns {{ hasConflict: boolean, conflicting: Array }}
 */
export const getConflictDetails = (newAppointment, existingAppointments) => {
  const conflicting = existingAppointments.filter(
    a =>
      a.doctor_id === newAppointment.doctor_id &&
      hasOverlap(newAppointment, a)
  )

  return {
    hasConflict: conflicting.length > 0,
    conflicting
  }
}

/**
 * Validate appointment time within working hours (8:00 - 20:00 Tashkent)
 * @param {string} startUtc
 * @param {string} endUtc
 * @param {number} startHour
 * @param {number} endHour
 * @returns {{ valid: boolean, message?: string }}
 */
export const validateWorkingHours = (
  startUtc,
  endUtc,
  startHour = 8,
  endHour = 20
) => {
  try {
    const start = utcToTashkent(startUtc)
    const end = utcToTashkent(endUtc)

    // Check start time
    if (start.hour < startHour) {
      return {
        valid: false,
        message: `Appointment starts before ${startHour}:00`
      }
    }

    // Check end time
    if (end.hour > endHour) {
      return {
        valid: false,
        message: `Appointment ends after ${endHour}:00`
      }
    }

    // Check end >= start
    if (end <= start) {
      return {
        valid: false,
        message: 'End time must be after start time'
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      message: 'Invalid time format'
    }
  }
}

/**
 * Get available time slots for a doctor on a given day
 * @param {string} date - "2026-03-05"
 * @param {string} doctor_id
 * @param {Array} existingAppointments
 * @param {number} slotDuration - minutes (15, 30, 60)
 * @param {number} startHour - 8
 * @param {number} endHour - 20
 * @returns {Array<string>} Array of time strings like "09:00"
 */
export const getAvailableSlots = (
  date,
  doctor_id,
  existingAppointments,
  slotDuration = 30,
  startHour = 8,
  endHour = 20
) => {
  const slots = []

  try {
    const [year, month, day] = date.split('-').map(Number)

    // Generate all possible slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = DateTime.fromObject(
          { year, month, day, hour, minute },
          { zone: 'Asia/Tashkent' }
        ).toUTC().toISO() || ''

        const slotEnd = DateTime.fromObject(
          { year, month, day, hour, minute: minute + slotDuration },
          { zone: 'Asia/Tashkent' }
        ).toUTC().toISO() || ''

        // Check if slot is available (not conflicting)
        const proposed = {
          doctor_id,
          start_time: slotStart,
          end_time: slotEnd
        }

        const doctorAppointments = existingAppointments.filter(
          a => a.doctor_id === doctor_id
        )

        const hasConflict = doctorAppointments.some(a => hasOverlap(proposed, a))

        if (!hasConflict) {
          slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
        }
      }
    }

    return slots
  } catch (error) {
    console.error('Error getting available slots:', error)
    return []
  }
}

/**
 * Find first available slot
 * @param {string} date
 * @param {string} doctor_id
 * @param {Array} existingAppointments
 * @param {number} slotDuration
 * @param {number} startHour
 * @param {number} endHour
 * @returns {string|null}
 */
export const findFirstAvailableSlot = (
  date,
  doctor_id,
  existingAppointments,
  slotDuration = 30,
  startHour = 8,
  endHour = 20
) => {
  const slots = getAvailableSlots(
    date,
    doctor_id,
    existingAppointments,
    slotDuration,
    startHour,
    endHour
  )
  return slots.length > 0 ? slots[0] : null
}

/**
 * Snap time to nearest slot (15-minute intervals)
 * @param {number} hour
 * @param {number} minute
 * @param {number} slotSize
 * @returns {string}
 */
export const snapToSlot = (hour, minute, slotSize = 15) => {
  const rounded = Math.round(minute / slotSize) * slotSize
  const newMinute = rounded >= 60 ? 0 : rounded
  const newHour = rounded >= 60 ? hour + 1 : hour

  return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`
}

/**
 * Calculate appointment duration in minutes
 * @param {string} startUtc
 * @param {string} endUtc
 * @returns {number}
 */
export const calculateDuration = (startUtc, endUtc) => {
  try {
    const start = DateTime.fromISO(startUtc, { zone: 'utc' })
    const end = DateTime.fromISO(endUtc, { zone: 'utc' })
    const duration = end.diff(start, 'minutes')
    return Math.round(duration.minutes)
  } catch {
    return 0
  }
}

/**
 * Get gap between appointments for a doctor
 * @param {Object} appt1
 * @param {Object} appt2
 * @returns {number} Gap in minutes
 */
export const getGapBetween = (appt1, appt2) => {
  if (appt1.doctor_id !== appt2.doctor_id) return 0

  const end1 = DateTime.fromISO(appt1.end_time, { zone: 'utc' })
  const start2 = DateTime.fromISO(appt2.start_time, { zone: 'utc' })

  if (start2 <= end1) return 0 // Overlapping or adjacent

  const gap = start2.diff(end1, 'minutes')
  return Math.round(gap.minutes)
}

/**
 * Suggest best time slot based on gaps
 * Returns appointments with gaps larger than slotDuration
 * @param {Array} appointments
 * @param {string} doctor_id
 * @param {number} slotDuration
 * @param {number} startHour
 * @param {number} endHour
 * @returns {Array<{ startUtc: string, endUtc: string }>}
 */
export const suggestSlots = (
  appointments,
  doctor_id,
  slotDuration = 30,
  startHour = 8,
  endHour = 20
) => {
  const suggestions = []

  try {
    const doctorAppts = appointments
      .filter(a => a.doctor_id === doctor_id)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    // Check gap before first appointment
    if (doctorAppts.length > 0) {
      const firstAppt = doctorAppts[0]
      const firstStart = DateTime.fromISO(firstAppt.start_time, { zone: 'utc' })

      // Get start of day in UTC
      const dayStart = firstStart.setZone('Asia/Tashkent').startOf('day').toUTC()

      if (firstStart.diff(dayStart, 'minutes').minutes >= slotDuration) {
        suggestions.push({
          startUtc: dayStart.toISO() || '',
          endUtc: dayStart.plus({ minutes: slotDuration }).toISO() || ''
        })
      }
    }

    // Check gaps between appointments
    for (let i = 0; i < doctorAppts.length - 1; i++) {
      const gap = getGapBetween(doctorAppts[i], doctorAppts[i + 1])
      if (gap >= slotDuration) {
        const start = DateTime.fromISO(doctorAppts[i].end_time, { zone: 'utc' })
        suggestions.push({
          startUtc: start.toISO() || '',
          endUtc: start.plus({ minutes: slotDuration }).toISO() || ''
        })
      }
    }

    return suggestions
  } catch (error) {
    console.error('Error suggesting slots:', error)
    return []
  }
}
