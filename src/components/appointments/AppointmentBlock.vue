<template>
  <div
    class="appointment-block absolute left-0.5 right-0.5 rounded-lg border border-l-4 p-2 text-xs cursor-pointer transition-all hover:shadow-md group"
    :class="appointmentClasses"
    :style="blockStyle"
    :title="`${appointment.patient_name} - ${formatTime(appointment.start_time)} to ${formatTime(endTime)}`"
  >
    <!-- Bemor ismi -->
    <div class="font-semibold text-gray-900 line-clamp-1">{{ appointment.patient_name || 'N/A' }}</div>

    <!-- Vaqt -->
    <div class="text-gray-600 mt-0.5">{{ formatTime(appointment.start_time) }}</div>

    <!-- Status badge -->
    <div class="flex items-center gap-1 mt-1">
      <span class="inline-block px-2 py-0.5 rounded text-xs font-medium" :class="statusBadgeClass">
        {{ getStatusLabel(appointment.status) }}
      </span>
    </div>

    <!-- To'lov badge -->
    <div v-if="paymentStatus" class="flex items-center gap-1 mt-1">
      <span class="inline-block px-2 py-0.5 rounded text-xs font-medium" :class="paymentBadgeClass">
        {{ paymentStatus }}
      </span>
    </div>

    <!-- Quick actions (show on hover) -->
    <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        v-if="canStartAppointment"
        @click.stop="handleStartAppointment"
        class="p-1 rounded bg-amber-500 text-white hover:bg-amber-600"
        title="Qabulda"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        v-if="canCompleteAppointment"
        @click.stop="handleCompleteAppointment"
        class="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600"
        title="Tugadi"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        v-if="appointment.status === 'in_progress' || appointment.status === 'completed_paid' || appointment.status === 'completed_debt'"
        @click.stop="handlePaymentModal"
        class="p-1 rounded bg-blue-500 text-white hover:bg-blue-600"
        title="To'lov"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  },
  slotHeightPx: {
    type: Number,
    default: 60 // 30 minut = 60px
  }
})

const emit = defineEmits(['update-status', 'open-payment'])

const { t } = useI18n()

// Duration (minutlar) -> height (px) o'tkazish
const appointmentHeight = computed(() => {
  const duration = props.appointment.duration_minutes || 30
  return (duration / 30) * props.slotHeightPx
})

// Block style: top va height
const blockStyle = computed(() => {
  const startMinutes = timeStringToMinutes(props.appointment.start_time || '09:00')
  const topOffset = (startMinutes / 30) * props.slotHeightPx
  return {
    top: `${topOffset}px`,
    height: `${appointmentHeight.value}px`
  }
})

// End time hisoblash
const endTime = computed(() => {
  if (!props.appointment.start_time) return '09:30'
  const duration = props.appointment.duration_minutes || 30
  const [hours, minutes] = props.appointment.start_time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
})

// Status orqali rang
const appointmentClasses = computed(() => {
  const status = props.appointment.status
  const base = 'bg-white'
  
  if (status === 'pending') return `${base} border-blue-400 bg-blue-50`
  if (status === 'arrived') return `${base} border-amber-400 bg-amber-50`
  if (status === 'in_progress') return `${base} border-purple-400 bg-purple-50`
  if (status === 'completed_paid' || status === 'completed_debt') return `${base} border-emerald-400 bg-emerald-50`
  if (status === 'cancelled') return `${base} border-gray-400 bg-gray-50`
  if (status === 'no_show') return `${base} border-rose-400 bg-rose-50`
  
  return base
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

const canStartAppointment = computed(() => {
  return props.appointment.status === 'pending' || props.appointment.status === 'arrived'
})

const canCompleteAppointment = computed(() => {
  return props.appointment.status === 'in_progress'
})

// Utilities
const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A'
  return timeStr
}

const getStatusLabel = (status) => {
  const statusMap = {
    'pending': t('appointments.statusPending') || 'Kutmoqda',
    'arrived': t('appointments.statusArrived') || 'Prishdi',
    'in_progress': t('appointments.statusInProgress') || 'Qabulda',
    'completed_paid': t('appointments.statusCompleted') || 'Tugadi',
    'completed_debt': t('appointments.statusDebt') || 'Qarzdor',
    'cancelled': t('appointments.statusCancelled') || 'Bekor qilindi',
    'no_show': t('appointments.statusNoShow') || 'Kelmadi'
  }
  return statusMap[status] || 'N/A'
}

// Emit events
const handleStartAppointment = () => {
  emit('update-status', 'in_progress')
}

const handleCompleteAppointment = () => {
  emit('update-status', 'completed_paid')
}

const handlePaymentModal = () => {
  emit('open-payment')
}
</script>

<style scoped>
.appointment-block {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.appointment-block:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
