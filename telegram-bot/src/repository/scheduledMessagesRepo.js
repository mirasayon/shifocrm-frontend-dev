const { supabase } = require('../supabase')

async function createScheduledMessage({ patientId, message, scheduledTime }) {
  const payload = {
    patient_id: String(patientId),
    message,
    scheduled_time: scheduledTime,
    status: 'pending'
  }

  const { data, error } = await supabase
    .from('scheduled_messages')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(`createScheduledMessage failed: ${error.message}`)
  }

  return data
}

async function scheduleFollowUpMessages({ patientId, messages }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  const rows = messages.map((entry) => ({
    patient_id: String(patientId),
    message: entry.message,
    scheduled_time: entry.scheduledTime,
    status: 'pending'
  }))

  const { data, error } = await supabase
    .from('scheduled_messages')
    .insert(rows)
    .select('*')

  if (error) {
    throw new Error(`scheduleFollowUpMessages failed: ${error.message}`)
  }

  return data || []
}

async function getPendingMessages({ nowIso, limit = 50 }) {
  const { data, error } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('status', 'pending')
    .is('sent_at', null)
    .lte('scheduled_time', nowIso)
    .order('scheduled_time', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`getPendingMessages failed: ${error.message}`)
  }

  return data || []
}

async function updateMessageStatus({ id, status, failureReason = null, sentAt = null }) {
  const payload = {
    status,
    failure_reason: failureReason,
    sent_at: sentAt,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('scheduled_messages')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw new Error(`updateMessageStatus failed: ${error.message}`)
  }

  return true
}

module.exports = {
  createScheduledMessage,
  getPendingMessages,
  scheduleFollowUpMessages,
  updateMessageStatus
}
