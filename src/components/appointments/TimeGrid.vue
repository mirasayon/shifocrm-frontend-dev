<template>
  <div class="time-grid-column bg-gray-50 border-r border-gray-200 py-4 pr-3">
    <!-- Har bir vaqt sloti uchun 30 minut -->
    <div
      v-for="(time, idx) in timeSlots"
      :key="idx"
      class="text-xs font-medium text-gray-600 text-right mb-0"
      :style="{ height: `${slotHeightPx}px` }"
    >
      {{ time }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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
    default: 60 // 30 minut
  }
})

// 30-minutli slotlar
const timeSlots = computed(() => {
  const slots = []
  for (let h = props.startHour; h < props.endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})
</script>

<style scoped>
.time-grid-column {
  min-width: 60px;
  flex-shrink: 0;
  overflow: hidden;
}
</style>
