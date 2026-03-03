const { supabase } = require('../supabase')

async function getTelegramChatId(patientId) {
  const { data, error } = await supabase
    .from('telegram_chat_ids')
    .select('chat_id')
    .eq('patient_id', String(patientId))
    .single()

  if (error || !data) {
    return null
  }

  return data.chat_id
}

module.exports = {
  getTelegramChatId
}
