/**
 * Conflict detection tests
 */

import { describe, it, expect } from 'vitest'
import {
  hasOverlap,
  checkConflicts,
  validateWorkingHours,
  snapToSlot,
  calculateDuration,
  getGapBetween,
  findFirstAvailableSlot,
} from './luxonConflicts.js'
import { createAppointmentTime } from './luxonTimezone.js'

describe('Conflict Detection Utilities', () => {
  const doctorId = '1'

  const mockAppt = (doctorId, startTime, endTime, id = '1') => ({
    id,
    doctor_id: doctorId,
    start_time: startTime,
    end_time: endTime,
  })

  describe('hasOverlap', () => {
    it('should detect overlapping appointments', () => {
      const appt1 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '09:00'),
        createAppointmentTime('2026-03-05', '10:00')
      )
      const appt2 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '09:30'),
        createAppointmentTime('2026-03-05', '10:30')
      )

      expect(hasOverlap(appt1, appt2)).toBe(true)
    })

    it('should not detect overlap for adjacent appointments', () => {
      const appt1 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '09:00'),
        createAppointmentTime('2026-03-05', '10:00')
      )
      const appt2 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '10:00'),
        createAppointmentTime('2026-03-05', '11:00')
      )

      expect(hasOverlap(appt1, appt2)).toBe(false)
    })

    it('should not detect overlap for separate appointments', () => {
      const appt1 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '09:00'),
        createAppointmentTime('2026-03-05', '10:00')
      )
      const appt2 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '11:00'),
        createAppointmentTime('2026-03-05', '12:00')
      )

      expect(hasOverlap(appt1, appt2)).toBe(false)
    })
  })

  describe('checkConflicts', () => {
    it('should find conflicting appointment', () => {
      const newAppt = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '09:30'),
        createAppointmentTime('2026-03-05', '10:30'),
        'new'
      )
      const existing = [
        mockAppt(doctorId,
          createAppointmentTime('2026-03-05', '09:00'),
          createAppointmentTime('2026-03-05', '10:00'),
          'existing1'
        ),
      ]

      const result = checkConflicts(newAppt, existing)
      expect(result).toBeTruthy()
      expect(result.id).toBe('existing1')
    })

    it('should ignore different doctor appointments', () => {
      const newAppt = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '09:30'),
        createAppointmentTime('2026-03-05', '10:30'),
        'new'
      )
      const existing = [
        mockAppt('2',
          createAppointmentTime('2026-03-05', '09:00'),
          createAppointmentTime('2026-03-05', '10:00'),
          'different-doctor'
        ),
      ]

      expect(checkConflicts(newAppt, existing)).toBeNull()
    })
  })

  describe('validateWorkingHours', () => {
    it('should accept time within hours', () => {
      const start = createAppointmentTime('2026-03-05', '10:00')
      const end = createAppointmentTime('2026-03-05', '11:00')

      const result = validateWorkingHours(start, end, 9, 17)
      expect(result.valid).toBe(true)
    })

    it('should reject time before hours', () => {
      const start = createAppointmentTime('2026-03-05', '07:00')
      const end = createAppointmentTime('2026-03-05', '08:00')

      const result = validateWorkingHours(start, end, 9, 17)
      expect(result.valid).toBe(false)
      expect(result.message).toContain('before')
    })

    it('should reject time after hours', () => {
      const start = createAppointmentTime('2026-03-05', '18:00')
      const end = createAppointmentTime('2026-03-05', '19:00')

      const result = validateWorkingHours(start, end, 9, 17)
      expect(result.valid).toBe(false)
      expect(result.message).toContain('after')
    })
  })

  describe('snapToSlot', () => {
    it('should snap to nearest 15-min slot', () => {
      expect(snapToSlot(9, 7, 15)).toBe('09:00')
      expect(snapToSlot(9, 8, 15)).toBe('09:15')
      expect(snapToSlot(9, 22, 15)).toBe('09:15')
      expect(snapToSlot(9, 23, 15)).toBe('09:30')
    })

    it('should handle hour rollover', () => {
      expect(snapToSlot(9, 53, 15)).toBe('10:00')
    })
  })

  describe('calculateDuration', () => {
    it('should calculate duration in minutes', () => {
      const start = createAppointmentTime('2026-03-05', '09:00')
      const end = createAppointmentTime('2026-03-05', '09:30')

      expect(calculateDuration(start, end)).toBe(30)
    })
  })

  describe('getGapBetween', () => {
    it('should calculate gap between appointments', () => {
      const appt1 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '09:00'),
        createAppointmentTime('2026-03-05', '10:00')
      )
      const appt2 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '10:30'),
        createAppointmentTime('2026-03-05', '11:00')
      )

      expect(getGapBetween(appt1, appt2)).toBe(30)
    })

    it('should return 0 for adjacent appointments', () => {
      const appt1 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '09:00'),
        createAppointmentTime('2026-03-05', '10:00')
      )
      const appt2 = mockAppt(doctorId,
        createAppointmentTime('2026-03-05', '10:00'),
        createAppointmentTime('2026-03-05', '11:00')
      )

      expect(getGapBetween(appt1, appt2)).toBe(0)
    })
  })

  describe('findFirstAvailableSlot', () => {
    it('should find first available slot', () => {
      const slot = findFirstAvailableSlot(
        '2026-03-05',
        doctorId,
        [],
        30,
        9,
        17
      )

      expect(slot).toBe('09:00')
    })

    it('should skip busy slots', () => {
      const existing = [
        mockAppt(doctorId,
          createAppointmentTime('2026-03-05', '09:00'),
          createAppointmentTime('2026-03-05', '09:30')
        ),
      ]

      const slot = findFirstAvailableSlot(
        '2026-03-05',
        doctorId,
        existing,
        30,
        9,
        17
      )

      expect(slot).toBe('09:30')
    })
  })
})
