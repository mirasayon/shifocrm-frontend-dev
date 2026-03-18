<template>
  <div
    :class="[blockClasses, appointmentClasses]"
    :style="resolvedBlockStyle"
    :title="`${appointment.patient_name} - ${localStartTime} to ${localEndTime}`"
    @click="handleBlockClick"
  >
    <!-- Bemor ismi (click -> patient detail) -->
    <button
      type="button"
      class="font-semibold text-gray-900 line-clamp-2 sm:line-clamp-1 text-xs sm:text-sm text-left hover:text-primary-700 hover:underline"
      @click.stop="handleOpenPatientDetail"
    >
      {{ appointment.patient_name || 'N/A' }}
    </button>

    <!-- Vaqt (responsive) -->
    <div class="text-gray-600 mt-0.5 flex items-center gap-0.5 sm:gap-1 text-xs">
      <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
      </svg>
      <span class="line-clamp-1">{{ localStartTime }} - {{ localEndTime }}</span>
    </div>

    <!-- Status badge (responsive) -->
    <div class="flex items-center gap-1 mt-1">
      <span class="inline-block px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium line-clamp-1" :class="statusBadgeClass">
        {{ getStatusLabel(appointment.status) }}
      </span>
    </div>

    <!-- To'lov badge (mobile: hidden if small) -->
    <div v-if="paymentStatus" class="hidden sm:flex items-center gap-1 mt-1">
      <span class="inline-block px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium" :class="paymentBadgeClass">
        {{ paymentStatus }}
      </span>
    </div>

    <!-- Quick actions (show on hover, hidden on small mobile) -->
    <div class="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <button
        v-if="canStartAppointment"
        @click.stop="handleStartAppointment"
        class="p-0.5 sm:p-1 rounded bg-amber-500 text-white hover:bg-amber-600 text-xs"
        title="Qabulda"
      >
        <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        v-if="canCompleteAppointment"
        @click.stop="handleCompleteAppointment"
        class="p-0.5 sm:p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 text-xs"
        title="Tugadi"
      >
        <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        v-if="appointment.status === 'in_progress' || appointment.status === 'completed_paid' || appointment.status === 'completed_debt'"
        @click.stop="handlePaymentModal"
        class="p-0.5 sm:p-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs"
        title="To'lov"
      >
        <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { extractLocalTime, timeStringToMinutes, getTimeDuration } from '@/utils/timezoneUtils'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  },
  slotHeightPx: {
    type: Number,
    default: 60 // 30 minut = 60px
  },
  positionedByParent: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-status', 'open-payment', 'open-patient-modal', 'open-patient-detail'])

const { t } = useI18n()

const translateOrFallback = (key, fallback) => {
  const translated = t(key)
  if (!translated || translated === key) return fallback
  return translated
}

// Extract local time from appointment (handles UTC conversion)
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

// Duration hisoblash: end_time yoki duration_minutes dan
const getDuration = () => {
  if (props.appointment.duration_minutes && props.appointment.duration_minutes > 0) {
    return props.appointment.duration_minutes
  }
  if (props.appointment.end_time && props.appointment.start_time) {
    return getTimeDuration(localStartTime.value, localEndTime.value)
  }
  return 60
}

// Duration (minutlar) -> height (px) o'tkazish
const appointmentHeight = computed(() => {
  const duration = getDuration()
  return (duration / 30) * props.slotHeightPx
})

const blockClasses = computed(() => {
  const base = 'appointment-block rounded-lg border border-l-4 p-1 sm:p-2 text-xs cursor-pointer transition-all hover:shadow-md group'
  if (props.positionedByParent) {
    return `${base} relative w-full h-full`
  }
  return `${base} absolute left-0.5 right-0.5`
})

// Block style: top va height
const blockStyle = computed(() => {
  const startMinutes = timeStringToMinutes(localStartTime.value)
  const dayStartMinutes = 9 * 60
  const topOffset = ((startMinutes - dayStartMinutes) / 30) * props.slotHeightPx
  return {
    top: `${topOffset}px`,
    height: `${appointmentHeight.value}px`
  }
})

const resolvedBlockStyle = computed(() => {
  if (props.positionedByParent) {
    return { height: '100%' }
  }
  return blockStyle.value
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
  if (status === 'completed_paid') return translateOrFallback('appointments.paid', 'To\'langan')
  if (status === 'completed_debt') return translateOrFallback('appointments.debt', 'Qarz')
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
// Utilities
const getStatusLabel = (status) => {
  const statusMap = {
    'pending': translateOrFallback('appointments.statusPending', 'Kutmoqda'),
    'arrived': translateOrFallback('appointments.statusArrived', 'Keldi'),
    'in_progress': translateOrFallback('appointments.statusInProgress', 'Qabulda'),
    'completed_paid': translateOrFallback('appointments.statusCompleted', 'Tugadi'),
    'completed_debt': translateOrFallback('appointments.statusDebt', 'Qarzdor'),
    'cancelled': translateOrFallback('appointments.statusCancelled', 'Bekor qilindi'),
    'no_show': translateOrFallback('appointments.statusNoShow', 'Kelmadi')
  }
  return statusMap[status] || 'N/A'
}

// Emit events
const handleBlockClick = () => {
  // Block click - open patient details modal
  emit('open-patient-modal', props.appointment)
}

const handleStartAppointment = () => {
  emit('update-status', {
    appointmentId: props.appointment.id,
    status: 'in_progress'
  })
}

const handleCompleteAppointment = () => {
  emit('update-status', {
    appointmentId: props.appointment.id,
    status: 'completed_paid'
  })
}

const handlePaymentModal = () => {
  emit('open-payment', props.appointment.id)
}

const handleOpenPatientDetail = () => {
  const patientId = Number(props.appointment?.patient_id)
  if (!Number.isFinite(patientId)) return
  emit('open-patient-detail', patientId)
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
