const { supabase } = require('../supabase')

async function recordPatientCompletion({ patientId, chatId = null, patientName = null, phone = null, notes = null, completionDate = null }) {
  const payload = {
    patient_id: String(patientId),
    chat_id: chatId ? String(chatId) : null,
    patient_name: patientName,
    phone,
    notes,
    completion_date: completionDate || new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('patient_completions')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(`recordPatientCompletion failed: ${error.message}`)
  }

  return data
}

async function getPatientLastCompletion(patientId) {
  const { data, error } = await supabase
    .from('patient_completions')
    .select('*')
    .eq('patient_id', String(patientId))
    .order('completion_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return null
  }

  return data
}

async function getPatientCompletionHistory(patientId, limit = 20) {
  const { data, error } = await supabase
    .from('patient_completions')
    .select('*')
    .eq('patient_id', String(patientId))
    .order('completion_date', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`getPatientCompletionHistory failed: ${error.message}`)
  }

  return data || []
}

module.exports = {
  recordPatientCompletion,
  getPatientLastCompletion,
  getPatientCompletionHistory
}
