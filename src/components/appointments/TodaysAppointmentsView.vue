<template>
  <div class="p-4 bg-white">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ $t('Bugungi Uchrashuvlar') }}</h1>
      <p class="text-gray-600 mt-1">{{ $t('Soat 12:00 gacha bo\'lgan uchrashuvlar') }}</p>
    </div>

    <!-- Loading & Error States -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      <p class="text-gray-600 mt-2">Yuklanmoqda...</p>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ error }}
    </div>

    <!-- No Appointments -->
    <div v-else-if="appointmentsUpTo12.length === 0" class="text-center py-8 bg-gray-50 rounded-lg">
      <p class="text-gray-600">{{ $t('Soat 12:00 gacha uchrashuvlar yo\'q') }}</p>
    </div>

    <!-- Appointments List -->
    <div v-else class="space-y-4">
      <div
        v-for="appt in appointmentsUpTo12"
        :key="appt.id"
        class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- Appointment Header with Time & Status -->
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-4">
              <!-- Time -->
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm font-semibold text-gray-900">{{ formatTime(appt.start_time) }}</span>
                <span class="text-gray-500">—</span>
                <span class="text-sm text-gray-700">{{ formatTime(getEndTime(appt)) }}</span>
              </div>

              <!-- Doctor Name -->
              <div class="flex items-center gap-2 text-gray-700">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h-2m2 0h-2m2 0H8m4 0h2m-2 0h2m-2 0v-2m0 2v2m0-2V8m0 2v2" />
                </svg>
                <span class="text-sm font-medium">{{ appt.doctor_name || 'N/A' }}</span>
              </div>
            </div>

            <!-- Status Badge -->
            <span :class="getStatusBadgeClass(appt.status)" class="px-3 py-1 rounded-full text-xs font-semibold">
              {{ getStatusLabel(appt.status) }}
            </span>
          </div>
        </div>

        <!-- Patient Information Section -->
        <div class="p-4 border-b border-gray-200">
          <div class="grid grid-cols-2 gap-4">
            <!-- Patient Name -->
            <div>
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Bemor Ismi</label>
              <p class="text-base font-bold text-gray-900 mt-1">{{ appt.patient_name || 'N/A' }}</p>
            </div>

            <!-- Medical ID -->
            <div>
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Med ID</label>
              <p class="text-base font-mono font-bold text-blue-600 mt-1">{{ appt.patient_id || 'N/A' }}</p>
            </div>

            <!-- Phone -->
            <div>
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Telefon</label>
              <a
                v-if="patientDetails[appt.patient_id]?.phone"
                :href="`tel:${patientDetails[appt.patient_id].phone}`"
                class="text-base font-semibold text-blue-600 hover:underline mt-1"
              >
                {{ patientDetails[appt.patient_id].phone }}
              </a>
              <p v-else class="text-base text-gray-500 mt-1">N/A</p>
            </div>

            <!-- Age/Birth Date -->
            <div v-if="patientDetails[appt.patient_id]?.birth_date">
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tug'ilgan Sana</label>
              <p class="text-base font-semibold text-gray-900 mt-1">{{ formatBirthDate(patientDetails[appt.patient_id].birth_date) }}</p>
            </div>

            <!-- Gender -->
            <div v-if="patientDetails[appt.patient_id]?.gender">
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Jinsi</label>
              <p class="text-base font-semibold text-gray-900 mt-1">{{ getGenderLabel(patientDetails[appt.patient_id].gender) }}</p>
            </div>
          </div>
        </div>

        <!-- Medical History / Diagnosis Section -->
        <div v-if="appt.service_name || appt.notes || patientMedicalHistory[appt.patient_id]" class="p-4 bg-amber-50 border-t border-gray-200">
          <div class="space-y-3">
            <!-- Service -->
            <div v-if="appt.service_name">
              <label class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Xizmat</label>
              <p class="text-sm font-semibold text-gray-900 mt-1">{{ appt.service_name }}</p>
            </div>

            <!-- Notes -->
            <div v-if="appt.notes">
              <label class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Eslatma</label>
              <p class="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{{ appt.notes }}</p>
            </div>

            <!-- Medical History -->
            <div v-if="patientMedicalHistory[appt.patient_id]">
              <label class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Med Tarixi</label>
              <div class="mt-1 space-y-1">
                <p v-if="patientMedicalHistory[appt.patient_id].diagnoses" class="text-sm text-gray-700">
                  <span class="font-semibold">Diagnozlar:</span> {{ patientMedicalHistory[appt.patient_id].diagnoses }}
                </p>
                <p v-if="patientMedicalHistory[appt.patient_id].medications" class="text-sm text-gray-700">
                  <span class="font-semibold">Dori-darmonlar:</span> {{ patientMedicalHistory[appt.patient_id].medications }}
                </p>
                <p v-if="patientMedicalHistory[appt.patient_id].allergies" class="text-sm text-gray-700">
                  <span class="font-semibold">Allergiya:</span> {{ patientMedicalHistory[appt.patient_id].allergies }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Status -->
        <div v-if="appt.status === 'completed_paid' || appt.status === 'completed_debt'" class="p-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700">To'lov Holati:</span>
            <span
              :class="appt.status === 'completed_paid'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-800'
              "
              class="px-3 py-1 rounded-full text-xs font-semibold"
            >
              {{ appt.status === 'completed_paid' ? 'To\'langan' : 'Qarzdor' }}
            </span>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            v-if="appt.status === 'scheduled' || appt.status === 'arrived'"
            @click="handleStartAppointment(appt.id)"
            class="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded transition"
          >
            Qabulda
          </button>
          <button
            v-if="appt.status === 'in_progress'"
            @click="handleCompleteAppointment(appt.id)"
            class="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded transition"
          >
            Tugadi
          </button>
          <button
            v-if="appt.status === 'in_progress' || appt.status === 'completed_debt'"
            @click="openPaymentModal(appt.id)"
            class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded transition"
          >
            To'lov
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listAppointments } from '@/api/appointmentsApi'
import { listPatients } from '@/api/patientsApi'

const loading = ref(false)
const error = ref(null)
const appointments = ref([])
const patientDetails = ref({})
const patientMedicalHistory = ref({})

const emit = defineEmits(['update-status', 'open-payment'])

// Faqat bugungi soat 12:00 gacha bo'lgan qabullar
const appointmentsUpTo12 = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const noon = new Date(today.getTime() + 12 * 60 * 60 * 1000) // Soat 12:00

  return appointments.value.filter(appt => {
    if (!appt.scheduled_at) return false
    const apptDate = new Date(appt.scheduled_at)
    return apptDate >= today && apptDate <= noon
  }).sort((a, b) => {
    return new Date(a.scheduled_at) - new Date(b.scheduled_at)
  })
})

// API dan ma'lumotlarni yuklash
const loadAppointments = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await listAppointments('order=scheduled_at.asc')
    appointments.value = data || []

    // Barcha bemorlarni yukla
    const patients = await listPatients()
    patients.forEach(p => {
      patientDetails.value[p.id] = p
      // Oddiycha medicinal tarixni o'rnatish (Supabase'dan to'liq ma'lumot kerak bo'lsa)
      patientMedicalHistory.value[p.id] = {
        diagnoses: p.diagnoses || '',
        medications: p.medications || '',
        allergies: p.allergies || ''
      }
    })
  } catch (err) {
    console.error('❌ Qabullarni yuklashda xato:', err)
    error.value = 'Qabullarni yuklashda xato yuz berdi'
  } finally {
    loading.value = false
  }
}

// Vaqt formatlash (HH:MM)
const formatTime = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Tugash vaqtini hisoblash (30 minut qo'shish)
const getEndTime = (appt) => {
  if (!appt.start_time) return null
  const start = new Date(appt.start_time)
  start.setMinutes(start.getMinutes() + 30)
  return start.toISOString()
}

// Tug'ilgan sanani formatlash
const formatBirthDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('uz-UZ')
}

// Jinsi label
const getGenderLabel = (gender) => {
  const genderMap = {
    male: 'Erkak',
    female: 'Ayol',
    other: 'Boshqa'
  }
  return genderMap[gender] || gender
}

// Status label
const getStatusLabel = (status) => {
  const statusMap = {
    scheduled: 'Kutmoqda',
    arrived: 'Kutmoqda',
    in_progress: 'Qabulda',
    completed_paid: 'Tugadi',
    completed_debt: 'Tugadi'
  }
  return statusMap[status] || status
}

// Status badge style
const getStatusBadgeClass = (status) => {
  const classMap = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    arrived: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed_paid: 'bg-emerald-100 text-emerald-800',
    completed_debt: 'bg-orange-100 text-orange-800'
  }
  return classMap[status] || 'bg-gray-100 text-gray-800'
}

// Qabul boshla
const handleStartAppointment = async (appointmentId) => {
  emit('update-status', { appointmentId, newStatus: 'in_progress' })
}

// Qabul tugat
const handleCompleteAppointment = async (appointmentId) => {
  emit('update-status', { appointmentId, newStatus: 'completed_debt' })
}

// To'lov modali
const openPaymentModal = (appointmentId) => {
  emit('open-payment', appointmentId)
}

// Boshlang'ich
onMounted(() => {
  loadAppointments()
})
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
