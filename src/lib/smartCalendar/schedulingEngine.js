const toMinutes = (timeText) => {
  if (typeof timeText === 'number' && Number.isFinite(timeText)) {
    return Math.max(0, Math.floor(timeText))
  }
  const [hours, minutes] = String(timeText || '00:00').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return (hours * 60) + minutes
}

const toTimeString = (minutes) => {
  const safe = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

const normalizeInterval = (interval) => {
  if (!interval) return null
  const start = toMinutes(interval.start)
  const end = toMinutes(interval.end)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
  return { start, end }
}

const mergeIntervals = (intervals = []) => {
  const normalized = intervals
    .map(normalizeInterval)
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)

  if (normalized.length === 0) return []

  const merged = [normalized[0]]
  for (let index = 1; index < normalized.length; index += 1) {
    const current = normalized[index]
    const last = merged[merged.length - 1]
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ ...current })
    }
  }
  return merged
}

const subtractIntervals = (sourceIntervals = [], blockedIntervals = []) => {
  const source = mergeIntervals(sourceIntervals)
  const blocked = mergeIntervals(blockedIntervals)
  if (blocked.length === 0) return source

  const result = []

  source.forEach((sourceItem) => {
    let cursor = sourceItem.start

    blocked.forEach((block) => {
      if (block.end <= cursor || block.start >= sourceItem.end) return

      if (block.start > cursor) {
        result.push({ start: cursor, end: Math.min(block.start, sourceItem.end) })
      }

      cursor = Math.max(cursor, block.end)
    })

    if (cursor < sourceItem.end) {
      result.push({ start: cursor, end: sourceItem.end })
    }
  })

  return mergeIntervals(result)
}

export const computeServiceDurationMinutes = (service = {}) => {
  const base = Number(service.defaultDurationMin ?? service.default_duration_min ?? 0) || 0
  const prep = Number(service.prepMin ?? service.prep_min ?? 0) || 0
  const cleanup = Number(service.cleanupMin ?? service.cleanup_min ?? 0) || 0
  return Math.max(5, base + prep + cleanup)
}

export const findAvailableSlots = ({
  workingIntervals = [],
  breakIntervals = [],
  blockedIntervals = [],
  existingAppointments = [],
  durationMinutes = 30,
  stepMinutes = 10
} = {}) => {
  const duration = Math.max(5, Number(durationMinutes) || 30)
  const step = Math.max(5, Number(stepMinutes) || 10)

  const busyIntervals = [
    ...breakIntervals,
    ...blockedIntervals,
    ...existingAppointments.map((entry) => ({
      start: entry.start || entry.start_time,
      end: entry.end || entry.end_time
    }))
  ]

  const freeIntervals = subtractIntervals(workingIntervals, busyIntervals)

  const slots = []
  freeIntervals.forEach((interval) => {
    for (let start = interval.start; start + duration <= interval.end; start += step) {
      slots.push({
        start: toTimeString(start),
        end: toTimeString(start + duration),
        startMinutes: start,
        endMinutes: start + duration
      })
    }
  })

  return slots
}

const calcDoctorLoad = (appointments = [], totalWorkingMinutes = 1) => {
  const busy = appointments.reduce((sum, entry) => {
    const start = toMinutes(entry.start || entry.start_time)
    const end = toMinutes(entry.end || entry.end_time)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return sum
    return sum + (end - start)
  }, 0)
  const denominator = Math.max(1, totalWorkingMinutes)
  return Math.min(1, busy / denominator)
}

const sumIntervalsDuration = (intervals = []) => intervals
  .map(normalizeInterval)
  .filter(Boolean)
  .reduce((sum, item) => sum + (item.end - item.start), 0)

export const recommendSmartSlots = ({
  date,
  service = {},
  doctors = [],
  patientPreferredDoctorId = null,
  requestedTime = null,
  limit = 5,
  stepMinutes = 10
} = {}) => {
  const targetDuration = computeServiceDurationMinutes(service)
  const requestedMinutes = requestedTime ? toMinutes(requestedTime) : null

  const candidates = []

  doctors.forEach((doctor) => {
    const workingIntervals = doctor.workingIntervals || []
    const breakIntervals = doctor.breakIntervals || []
    const blockedIntervals = doctor.blockedIntervals || []
    const existingAppointments = doctor.existingAppointments || []

    const slots = findAvailableSlots({
      workingIntervals,
      breakIntervals,
      blockedIntervals,
      existingAppointments,
      durationMinutes: targetDuration,
      stepMinutes
    })

    const workingMinutes = sumIntervalsDuration(workingIntervals)
    const doctorLoad = calcDoctorLoad(existingAppointments, workingMinutes)
    const skillScore = Number(doctor.skillScore ?? 0.6)
    const preferredBonus = Number(doctor.id) === Number(patientPreferredDoctorId) ? 0.2 : 0

    slots.forEach((slot) => {
      const earliestScore = 1 - (slot.startMinutes / (24 * 60))
      const timeProximity = Number.isFinite(requestedMinutes)
        ? 1 - (Math.min(720, Math.abs(slot.startMinutes - requestedMinutes)) / 720)
        : 0.5
      const loadBalance = 1 - doctorLoad

      const totalScore =
        (0.28 * earliestScore) +
        (0.24 * skillScore) +
        (0.20 * loadBalance) +
        (0.18 * timeProximity) +
        (0.10 * preferredBonus)

      candidates.push({
        date,
        doctorId: doctor.id,
        doctorName: doctor.full_name || doctor.name || `Doctor #${doctor.id}`,
        start: slot.start,
        end: slot.end,
        durationMinutes: targetDuration,
        score: Number(totalScore.toFixed(6))
      })
    })
  })

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Number(limit) || 5))
}

export const schedulingEngineUtils = {
  toMinutes,
  toTimeString,
  mergeIntervals,
  subtractIntervals
}
