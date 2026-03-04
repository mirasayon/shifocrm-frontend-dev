<template>
  <div class="doctor-column flex-1 min-w-[280px] bg-white border-r border-gray-200 relative">
    <!-- Doctor header (sticky) -->
    <div class="sticky top-0 z-20 bg-gradient-to-r from-primary-50 to-cyan-50 border-b border-gray-200 p-3 flex items-center justify-between">
      <div>
        <h3 class="font-semibold text-sm text-gray-900">{{ doctor.full_name }}</h3>
        <p v-if="doctor.specialization" class="text-xs text-gray-500">{{ doctor.specialization }}</p>
      </div>
      <div v-if="appointmentCount > 0" class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold">
        {{ appointmentCount }}
      </div>
    </div>

    <!-- Time slots grid -->
    <div class="relative py-4 px-1 min-h-screen">
      <!-- Time slot backgrounds (30 min chunks) -->
      <div
        v-for="(time, idx) in timeSlots"
        :key="`slot-${idx}`"
        class="absolute left-0 right-0 border-t border-gray-100"
        :style="{ top: `${idx * slotHeightPx + 56}px`, height: `${slotHeightPx}px` }"
      />

      <!-- Appointment blocks (absolute positioning) -->
      <AppointmentBlock
        v-for="appt in doctorAppointments"
        :key="`appt-${appt.id}`"
        :appointment="appt"
        :slot-height-px="slotHeightPx"
        @update-status="handleStatusUpdate(appt.id, $event)"
        @open-payment="handleOpenPayment(appt.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppointmentBlock from './AppointmentBlock.vue'

const props = defineProps({
  doctor: {
    type: Object,
    required: true
  },
  appointments: {
    type: Array,
    default: () => []
  },
  startHour: {
    type: Number,
    default: 9
  },
  endHour: {
    type: Number,
    default: 18
  },
  slotHeightPx: {
    type: Number,
    default: 60
  }
})

const emit = defineEmits(['update-status', 'open-payment'])

// Doctor uchun faqat o'sha kunning appointmentlari
const doctorAppointments = computed(() => {
  if (!props.doctor || !props.doctor.id) return []
  return props.appointments.filter(
    appt => Number(appt.doctor_id) === Number(props.doctor.id)
  )
})

const appointmentCount = computed(() => doctorAppointments.value.length)

// Time slots (30 min)
const timeSlots = computed(() => {
  const slots = []
  for (let h = props.startHour; h < props.endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})

// Events emit
const handleStatusUpdate = (appointmentId, newStatus) => {
  emit('update-status', { appointmentId, newStatus })
}

const handleOpenPayment = (appointmentId) => {
  emit('open-payment', appointmentId)
}
</script>

<style scoped>
.doctor-column {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
