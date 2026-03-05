/**
 * Luxon timezone utilities tests
 */

import { describe, it, expect } from 'vitest'
import { DateTime } from 'luxon'
import {
  utcToTashkent,
  tashkentToUtc,
  createTashkentDateTime,
  formatTime,
  formatTimeRange,
  getDurationMinutes,
  addMinutesToUtc,
  createAppointmentTime,
  isWithinWorkingHours,
  getDateRange,
} from './luxonTimezone.js'

describe('Luxon Timezone Utilities', () => {
  describe('utcToTashkent', () => {
    it('should convert UTC to Tashkent (+5 hours)', () => {
      // 08:00 UTC = 13:00 Tashkent
      const utc = '2026-03-05T08:00:00.000Z'
      const result = utcToTashkent(utc)

      expect(result.hour).toBe(13)
      expect(result.minute).toBe(0)
      expect(result.zoneName).toBe('Asia/Tashkent')
    })

    it('should handle midnight UTC', () => {
      const utc = '2026-03-05T00:00:00.000Z'
      const result = utcToTashkent(utc)

      expect(result.hour).toBe(5)
    })
  })

  describe('tashkentToUtc', () => {
    it('should convert Tashkent to UTC (-5 hours)', () => {
      // 13:00 Tashkent = 08:00 UTC
      const tashkent = createTashkentDateTime(2026, 3, 5, 13, 0)
      const result = tashkentToUtc(tashkent)

      expect(result).toContain('08:00:00')
      expect(result).toMatch(/Z$/)
    })
  })

  describe('Round-trip conversion', () => {
    it('should preserve time in round-trip conversion', () => {
      const originalUtc = '2026-03-05T13:00:00.000Z'
      const tashkent = utcToTashkent(originalUtc)
      const backToUtc = tashkentToUtc(tashkent)

      const original = DateTime.fromISO(originalUtc, { zone: 'utc' })
      const result = DateTime.fromISO(backToUtc, { zone: 'utc' })

      expect(original.diff(result, 'seconds').seconds).toBeLessThan(1)
    })
  })

  describe('getDurationMinutes', () => {
    it('should calculate 30-minute duration', () => {
      const start = '2026-03-05T08:00:00.000Z'
      const end = '2026-03-05T08:30:00.000Z'

      expect(getDurationMinutes(start, end)).toBe(30)
    })

    it('should calculate 1-hour duration', () => {
      const start = '2026-03-05T08:00:00.000Z'
      const end = '2026-03-05T09:00:00.000Z'

      expect(getDurationMinutes(start, end)).toBe(60)
    })
  })

  describe('addMinutesToUtc', () => {
    it('should add 30 minutes', () => {
      const start = '2026-03-05T08:00:00.000Z'
      const result = addMinutesToUtc(start, 30)

      expect(result).toContain('08:30:00')
    })

    it('should handle hour rollover', () => {
      const start = '2026-03-05T08:45:00.000Z'
      const result = addMinutesToUtc(start, 30)

      expect(result).toContain('09:15:00')
    })
  })

  describe('createAppointmentTime', () => {
    it('should create UTC from Tashkent date+time', () => {
      // 13:00 Tashkent = 08:00 UTC
      const result = createAppointmentTime('2026-03-05', '13:00')

      expect(result).toContain('2026-03-05')
      expect(result).toContain('08:00:00')
      expect(result).toMatch(/Z$/)
    })
  })

  describe('isWithinWorkingHours', () => {
    it('should accept time within working hours', () => {
      const start = createAppointmentTime('2026-03-05', '10:00')
      const end = createAppointmentTime('2026-03-05', '11:00')

      expect(isWithinWorkingHours(start, end, 8, 20)).toBe(true)
    })

    it('should reject time before working hours', () => {
      const start = createAppointmentTime('2026-03-05', '07:00')
      const end = createAppointmentTime('2026-03-05', '08:00')

      expect(isWithinWorkingHours(start, end, 8, 20)).toBe(false)
    })

    it('should reject time after working hours', () => {
      const start = createAppointmentTime('2026-03-05', '20:00')
      const end = createAppointmentTime('2026-03-05', '21:00')

      expect(isWithinWorkingHours(start, end, 8, 20)).toBe(false)
    })
  })

  describe('formatTime', () => {
    it('should format as HH:mm', () => {
      const dt = createTashkentDateTime(2026, 3, 5, 13, 30)
      expect(formatTime(dt)).toBe('13:30')
    })
  })

  describe('formatTimeRange', () => {
    it('should format time range', () => {
      const start = createAppointmentTime('2026-03-05', '13:00')
      const end = createAppointmentTime('2026-03-05', '14:00')

      expect(formatTimeRange(start, end)).toBe('13:00 - 14:00')
    })
  })

  describe('getDateRange', () => {
    it('should return day start and end in UTC', () => {
      const result = getDateRange('2026-03-05')

      expect(result.start).toBeTruthy()
      expect(result.end).toBeTruthy()
      expect(result.start).toMatch(/Z$/)
      expect(result.end).toMatch(/Z$/)
    })
  })
})
