const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL yoki SUPABASE_SERVICE_KEY topilmadi')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

module.exports = {
  supabase
}
