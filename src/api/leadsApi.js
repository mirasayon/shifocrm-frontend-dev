/**
 * Leads API - Public doctor profile lead capture
 * Handles lead submissions, tracking, and clinic staff access
 */

import { supabaseGet, supabasePost, supabasePatchWhere } from './supabaseConfig'

const TABLE = 'leads'

/**
 * Submit a public lead from doctor profile page
 * @param {object} payload - {doctor_id, clinic_id, patient_name, phone, preferred_date, preferred_time, selected_service, note}
 * @returns {object} Created lead with id
 */
export const createLead = async (payload) => {
  try {
    const {
      doctor_id,
      clinic_id,
      patient_name,
      phone,
      preferred_date = null,
      preferred_time = null,
      selected_service = null,
      note = null
    } = payload

    // Validation
    const doctorId = Number(doctor_id)
    const clinicId = Number(clinic_id)
    if (!Number.isFinite(doctorId) || !Number.isFinite(clinicId)) {
      throw new Error('Invalid doctor_id or clinic_id')
    }
    const cleanName = String(patient_name || '').trim()
    const cleanPhone = String(phone || '').trim()
    const cleanPreferredDate = String(preferred_date || '').trim()
    const cleanPreferredTime = String(preferred_time || '').trim()
    if (!cleanName) throw new Error('Patient name required')
    if (!cleanPhone) throw new Error('Phone number required')
    if (!cleanPreferredDate) throw new Error('Preferred date required')
    if (!cleanPreferredTime) throw new Error('Preferred time required')

    const now = new Date().toISOString()
    const preferredSummary = `Sana/Vaqt: ${cleanPreferredDate} ${cleanPreferredTime}`
    const data = {
      doctor_id: doctorId,
      clinic_id: clinicId,
      patient_name: cleanName,
      phone: cleanPhone,
      preferred_date: cleanPreferredDate,
      preferred_time: cleanPreferredTime,
      selected_service: selected_service ? String(selected_service).trim() : null,
      note: note ? String(note).trim() : null,
      source: 'doctor_public_page',
      status: 'new',
      created_at: now,
      updated_at: now
    }

    let result
    try {
      result = await supabasePost(TABLE, data)
    } catch (error) {
      const message = String(error?.message || '').toLowerCase()
      const hasPreferredDateSchemaError =
        message.includes('preferred_date') ||
        message.includes('preferred_time') ||
        message.includes('selected_service') ||
        message.includes('could not find the')

      if (!hasPreferredDateSchemaError) throw error

      const fallbackData = {
        doctor_id: doctorId,
        clinic_id: clinicId,
        patient_name: cleanName,
        phone: cleanPhone,
        note: [preferredSummary, note ? String(note).trim() : ''].filter(Boolean).join(' | '),
        source: 'doctor_public_page',
        status: 'new',
        created_at: now,
        updated_at: now
      }
      result = await supabasePost(TABLE, fallbackData)
    }

    console.log('✅ Lead created:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create lead:', error)
    throw error
  }
}

/**
 * Get all leads for a doctor (authenticated)
 * @param {number} doctorId
 * @returns {array} List of leads
 */
export const listLeadsByDoctor = async (doctorId) => {
  try {
    const numId = Number(doctorId)
    if (!Number.isFinite(numId)) throw new Error('Invalid doctor_id')
    const rows = await supabaseGet(TABLE, `doctor_id=eq.${numId}&order=created_at.desc`)
    return rows || []
  } catch (error) {
    console.error('❌ Failed to fetch doctor leads:', error)
    throw error
  }
}

/**
 * Get all leads for a clinic (authenticated clinic admin)
 * @param {number} clinicId
 * @returns {array} List of leads
 */
export const listLeadsByClinic = async (clinicId) => {
  try {
    const numId = Number(clinicId)
    if (!Number.isFinite(numId)) throw new Error('Invalid clinic_id')
    const rows = await supabaseGet(TABLE, `clinic_id=eq.${numId}&order=created_at.desc`)
    return rows || []
  } catch (error) {
    console.error('❌ Failed to fetch clinic leads:', error)
    throw error
  }
}

/**
 * Update lead status
 * @param {number} leadId
 * @param {string} status - 'new', 'contacted', 'converted', 'rejected', etc.
 * @returns {object} Updated lead
 */
export const updateLeadStatus = async (leadId, status) => {
  try {
    const numId = Number(leadId)
    if (!Number.isFinite(numId)) throw new Error('Invalid lead_id')
    const cleanStatus = String(status || '').trim()
    if (!cleanStatus) throw new Error('Status required')

    const data = {
      status: cleanStatus,
      updated_at: new Date().toISOString()
    }
    const result = await supabasePatchWhere(TABLE, `id=eq.${numId}`, data)
    console.log('✅ Lead updated:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update lead:', error)
    throw error
  }
}
