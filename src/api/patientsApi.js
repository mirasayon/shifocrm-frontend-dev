/**
 * Patients API - Supabase REST API orqali.
 * Tenant isolation; clinic_id yo'q bo'lsa filtersiz fallback.
 */

import { supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const TABLE = 'patients'

const normalizeNullableDateField = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

const normalizePatientPayload = (payload) => {
  const normalized = { ...payload }
  const dateFields = ['birth_date', 'last_visit', 'next_appointment']

  dateFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(normalized, field)) {
      normalized[field] = normalizeNullableDateField(normalized[field])
    }
  })

  if (Object.prototype.hasOwnProperty.call(normalized, 'doctor_id')) {
    const doctorId = normalized.doctor_id
    if (doctorId === '' || doctorId === null || doctorId === undefined) {
      normalized.doctor_id = null
    } else {
      normalized.doctor_id = Number(doctorId)
    }
  }

  return normalized
}

export const listPatients = async () => {
  try {
    const cid = await getCurrentClinicId()
    return await supabaseGetWithClinicFallback(TABLE, 'order=created_at.desc', cid)
  } catch (error) {
    console.error('❌ Failed to fetch patients:', error)
    throw error
  }
}

export const getPatientById = async (id) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) return null
    const cid = await getCurrentClinicId()
    const rows = await supabaseGetWithClinicFallback(TABLE, `id=eq.${numId}`, cid)
    return rows && rows[0] ? rows[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch patient:', error)
    return null
  }
}

export const getPatientsByDoctorId = async (doctorId) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `doctor_id=eq.${Number(doctorId)}&order=created_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch patients by doctor:', error)
    throw error
  }
}

// 5 xonali unique ID generatsiya qilish (10000-99999)
const generateId = async () => {
  try {
    const patients = await listPatients()
    const existingIds = patients.map(p => Number(p.id))

    let newId
    do {
      newId = Math.floor(10000 + Math.random() * 90000)
    } while (existingIds.includes(newId))

    return newId
  } catch {
    // Fallback: timestamp based ID
    return Math.floor(10000 + Math.random() * 90000)
  }
}

export const createPatient = async ({
  full_name,
  phone,
  birth_date = null,
  gender = null,
  address = null,
  doctor_id = null,
  doctor_name = null,
  status = 'waiting',
  notes = null,
  createFirstVisit = true
}) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

    const now = new Date().toISOString()
    const id = await generateId()

    const newPatient = normalizePatientPayload({
      id,
      full_name,
      phone,
      birth_date: birth_date || null,
      gender: gender || null,
      address: address || null,
      doctor_id,
      doctor_name: doctor_name || null,
      status,
      notes: notes || null,
      last_visit: null,
      next_appointment: null,
      clinic_id: cid,
      created_at: now,
      updated_at: now
    })

    const result = await supabasePost(TABLE, newPatient)
    const created = result && result[0]
    if (!created) throw new Error('Bemor yaratishda javob olinmadi.')
    if (createFirstVisit) {
      try {
        const { createVisit } = await import('./visitsApi')
        await createVisit({
          patient_id: created.id,
          doctor_id: doctor_id || null,
          doctor_name: doctor_name || null,
          status: 'pending',
          notes: 'Birinchi tashrif (avtomatik yaratilgan)',
          price: null,
          paid_amount: null,
          debt_amount: null
        })
      } catch (visitError) {
        console.warn('⚠️ First visit create failed:', visitError)
      }
    }
    return created
  } catch (error) {
    console.error('❌ Failed to create patient:', error)
    throw error
  }
}

// Bemor ma'lumotlarini yangilash
export const updatePatient = async (id, payload) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const updateData = normalizePatientPayload({
      ...payload,
      updated_at: new Date().toISOString()
    })

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid patient id')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, updateData)
    console.log('✅ Patient updated:', result[0])
    return result && result[0] ? result[0] : null
  } catch (error) {
    console.error('❌ Failed to update patient:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      status: error?.status
    })
    throw error
  }
}

// Bemorni o'chirish
export const deletePatient = async (id) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid patient id')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    await supabaseDeleteWhere(TABLE, q)
    console.log('✅ Patient deleted:', id)
    return { id }
  } catch (error) {
    console.error('❌ Failed to delete patient:', error)
    throw error
  }
}

// Initialization (Supabase uchun kerak emas, lekin backward compatibility uchun)
export const initPatients = async () => {
  // No-op for Supabase
  return true
}

// Refresh (backward compatibility)
export const refreshFromServer = async () => {
  return await listPatients()
}

// Export to JSON file
export const downloadDbJson = async () => {
  const patients = await listPatients()
  const data = { patients }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'patients.json'
  a.click()
  URL.revokeObjectURL(url)
}
