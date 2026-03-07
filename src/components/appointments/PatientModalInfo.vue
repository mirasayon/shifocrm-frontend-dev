<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeModal">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" @click.stop>
          <!-- Header -->
          <div class="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">{{ appointment.patient_name || 'N/A' }}</h2>
              <p class="text-primary-100 mt-1">{{ appointment.patient_id || 'Med ID' }}</p>
            </div>
            <button @click="closeModal" class="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-6">
            <!-- Appointment Info -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Uchrashuv ma'lumotlari</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-medium text-gray-500 uppercase">Sana</label>
                  <p class="text-gray-900 font-semibold">{{ formatDate(appointment.date) }}</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 uppercase">Vaqt</label>
                  <p class="text-gray-900 font-semibold">{{ localStartTime }} - {{ localEndTime }}</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 uppercase">Shifokor</label>
                  <p class="text-gray-900 font-semibold">{{ appointment.doctor_name || 'N/A' }}</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 uppercase">Maxsuslik</label>
                  <p class="text-gray-900 font-semibold">{{ appointment.specialization || 'N/A' }}</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <span class="inline-block px-3 py-1 rounded-full text-sm font-medium mt-1" :class="statusBadgeClass">
                    {{ getStatusLabel(appointment.status) }}
                  </span>
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 uppercase">To'lov</label>
                  <span v-if="paymentStatus" class="inline-block px-3 py-1 rounded-full text-sm font-medium mt-1" :class="paymentBadgeClass">
                    {{ paymentStatus }}
                  </span>
                  <span v-else class="text-gray-500 text-sm mt-1">Belgilash kerak</span>
                </div>
              </div>
            </div>

            <!-- Patient Contact Info -->
            <div class="border-t pt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Aloqa ma'lumotlari</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.418 1.265 1.215 2.807 2.986 4.578 1.77 1.77 3.313 2.568 4.578 2.986l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <div>
                      <label class="text-xs font-medium text-gray-500 uppercase block">Telefon</label>
                      <p class="text-gray-900 font-semibold">{{ appointment.phone || 'N/A' }}</p>
                    </div>
                  </div>
                  <button
                    v-if="appointment.phone"
                    @click="callPatient"
                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.418 1.265 1.215 2.807 2.986 4.578 1.77 1.77 3.313 2.568 4.578 2.986l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Qo'ng'iroq
                  </button>
                </div>
              </div>
            </div>

            <!-- Medical History (if available) -->
            <div v-if="appointment.notes || appointment.diagnosis" class="border-t pt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Tibbiy ma'lumot</h3>
              <div class="space-y-3">
                <div v-if="appointment.diagnosis" class="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <label class="text-xs font-medium text-amber-800 uppercase block">Tashxis</label>
                  <p class="text-gray-900 mt-2">{{ appointment.diagnosis }}</p>
                </div>
                <div v-if="appointment.notes" class="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <label class="text-xs font-medium text-purple-800 uppercase block">Izohlar</label>
                  <p class="text-gray-900 mt-2">{{ appointment.notes }}</p>
                </div>
              </div>
            </div>

            <!-- Treatment section -->
            <div v-if="showTreatmentSection" class="border-t pt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Davolash bo'limi</h3>
              <div class="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                <div class="text-sm text-gray-700">
                  <span class="font-semibold">Bemor:</span> {{ appointment.patient_name || 'N/A' }}
                </div>
                <div class="text-sm text-gray-700">
                  <span class="font-semibold">ID:</span> {{ appointment.patient_id || 'N/A' }}
                </div>
                <div class="text-sm text-gray-700">
                  <span class="font-semibold">Telefon:</span> {{ appointment.phone || 'N/A' }}
                </div>
                <div class="text-sm text-gray-700">
                  <span class="font-semibold">Holat:</span> Davolanish jarayonida
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="border-t pt-6 flex gap-3">
              <button
                v-if="appointment.status === 'pending' || appointment.status === 'arrived'"
                @click="startAppointment"
                class="flex-1 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Davolashni boshlash
              </button>
              <button
                v-if="appointment.status === 'in_progress'"
                @click="completeAppointment"
                class="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Tugadi
              </button>
              <button
                v-if="appointment.status === 'in_progress' || appointment.status === 'completed_paid' || appointment.status === 'completed_debt'"
                @click="openPayment"
                class="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                To'lov
              </button>
              <button
                @click="closeModal"
                class="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { extractLocalTime, timeStringToMinutes } from '@/utils/timezoneUtils'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'update-status', 'open-payment', 'call'])

const { t } = useI18n()
const treatmentSectionOpen = ref(false)

watch(
  () => props.appointment?.status,
  (status) => {
    treatmentSectionOpen.value = status === 'in_progress'
  },
  { immediate: true }
)

const showTreatmentSection = computed(() => {
  return treatmentSectionOpen.value || props.appointment?.status === 'in_progress'
})

// Extract local time from appointment
const localStartTime = computed(() => {
  return extractLocalTime(props.appointment.start_time)
})

const localEndTime = computed(() => {
  if (props.appointment.end_time) {
    return extractLocalTime(props.appointment.end_time)
  }
  // Calculate from duration
  const duration = props.appointment.duration_minutes || 60
  const startMin = timeStringToMinutes(localStartTime.value)
  const endMin = startMin + duration
  const endH = Math.floor(endMin / 60)
  const endM = endMin % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
})

const statusBadgeClass = computed(() => {
  const status = props.appointment.status
  if (status === 'pending') return 'bg-blue-100 text-blue-700'
  if (status === 'arrived') return 'bg-amber-100 text-amber-700'
  if (status === 'in_progress') return 'bg-purple-100 text-purple-700'
  if (status === 'completed_paid' || status === 'completed_debt') return 'bg-emerald-100 text-emerald-700'
  if (status === 'cancelled') return 'bg-gray-100 text-gray-700'
  if (status === 'no_show') return 'bg-rose-100 text-rose-700'
  return 'bg-gray-100 text-gray-700'
})

const paymentStatus = computed(() => {
  const status = props.appointment.status
  if (!status?.includes('completed')) return null
  if (status === 'completed_paid') return t('appointments.paid') || 'To\'langan'
  if (status === 'completed_debt') return t('appointments.debt') || 'Qarz'
  return null
})

const paymentBadgeClass = computed(() => {
  const status = props.appointment.status
  if (status === 'completed_paid') return 'bg-green-100 text-green-700'
  if (status === 'completed_debt') return 'bg-orange-100 text-orange-700'
  return 'bg-gray-100 text-gray-700'
})

// Methods
const closeModal = () => {
  emit('close')
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr + 'T00:00:00')
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
    return date.toLocaleDateString('uz-UZ', options)
  } catch {
    return dateStr
  }
}

const getStatusLabel = (status) => {
  const statusMap = {
    'pending': 'Kutmoqda',
    'arrived': 'Prishdi',
    'in_progress': 'Qabulda',
    'completed_paid': 'Tugadi',
    'completed_debt': 'Qarzdor',
    'cancelled': 'Bekor qilindi',
    'no_show': 'Kelmadi'
  }
  return statusMap[status] || 'N/A'
}

const startAppointment = () => {
  treatmentSectionOpen.value = true
  emit('update-status', {
    appointmentId: props.appointment.id,
    status: 'in_progress'
  })
}

const completeAppointment = () => {
  emit('update-status', 'completed_paid')
  closeModal()
}

const openPayment = () => {
  emit('open-payment', props.appointment.id)
  closeModal()
}

const callPatient = () => {
  emit('call', props.appointment.phone)
  if (props.appointment.phone) {
    window.location.href = `tel:${props.appointment.phone}`
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
