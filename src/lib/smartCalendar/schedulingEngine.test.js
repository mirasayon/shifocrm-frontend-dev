import { describe, expect, it } from 'vitest'
import {
  computeServiceDurationMinutes,
  findAvailableSlots,
  recommendSmartSlots,
  schedulingEngineUtils
} from './schedulingEngine'

describe('smartCalendar/schedulingEngine', () => {
  it('computes service duration with prep and cleanup', () => {
    const duration = computeServiceDurationMinutes({
      defaultDurationMin: 40,
      prepMin: 10,
      cleanupMin: 5
    })

    expect(duration).toBe(55)
  })

  it('subtracts blocked intervals and finds slots', () => {
    const slots = findAvailableSlots({
      workingIntervals: [{ start: '09:00', end: '12:00' }],
      breakIntervals: [{ start: '10:00', end: '10:30' }],
      existingAppointments: [{ start_time: '11:00', end_time: '11:30' }],
      durationMinutes: 30,
      stepMinutes: 10
    })

    const starts = slots.map((slot) => slot.start)

    expect(starts).toContain('09:00')
    expect(starts).toContain('09:30')
    expect(starts).toContain('10:30')
    expect(starts).not.toContain('10:00')
    expect(starts).not.toContain('11:00')
  })

  it('recommends top slots with preferred doctor bonus', () => {
    const recommendations = recommendSmartSlots({
      date: '2026-03-14',
      service: { defaultDurationMin: 30, prepMin: 0, cleanupMin: 0 },
      patientPreferredDoctorId: 2,
      requestedTime: '10:00',
      limit: 3,
      doctors: [
        {
          id: 1,
          full_name: 'Dr A',
          skillScore: 0.7,
          workingIntervals: [{ start: '09:00', end: '13:00' }],
          breakIntervals: [],
          blockedIntervals: [],
          existingAppointments: [{ start_time: '09:00', end_time: '10:30' }]
        },
        {
          id: 2,
          full_name: 'Dr B',
          skillScore: 0.8,
          workingIntervals: [{ start: '09:00', end: '13:00' }],
          breakIntervals: [],
          blockedIntervals: [],
          existingAppointments: []
        }
      ]
    })

    expect(recommendations.length).toBe(3)
    expect(recommendations[0].doctorId).toBe(2)
    expect(recommendations[0].start).toBeDefined()
    expect(recommendations[0].score).toBeGreaterThan(0)
  })

  it('merges touching intervals safely', () => {
    const merged = schedulingEngineUtils.mergeIntervals([
      { start: '09:00', end: '09:30' },
      { start: '09:30', end: '10:00' },
      { start: '11:00', end: '11:30' }
    ])

    expect(merged).toEqual([
      { start: 540, end: 600 },
      { start: 660, end: 690 }
    ])
  })
})
