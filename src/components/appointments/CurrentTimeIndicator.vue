<template>
  <div
    v-if="isVisible"
    class="absolute left-0 right-0 z-20 pointer-events-none"
    :style="{ top: positionPercent }"
  >
    <div class="flex items-center gap-2">
      <div class="text-xs font-semibold text-red-600 whitespace-nowrap px-2">
        {{ currentTimeText }}
      </div>
      <div class="flex-1 h-0.5 bg-red-500"></div>
      <div class="w-3 h-3 bg-red-500 rounded-full -mr-1.5"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const currentTime = ref(new Date())
const startHour = ref(9)
const endHour = ref(18)

const currentTimeText = computed(() => {
  const h = String(currentTime.value.getHours()).padStart(2, '0')
  const m = String(currentTime.value.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

const totalMinutes = computed(() => {
  return (endHour.value - startHour.value) * 60
})

const currentMinutes = computed(() => {
  const now = currentTime.value
  const hour = now.getHours()
  const minute = now.getMinutes()

  // Convert current time to minutes from start of day
  const nowMinutes = hour * 60 + minute
  const startMinutes = startHour.value * 60

  // Calculate how many minutes into the working hours
  const minutesIntoCurrent = nowMinutes - startMinutes

  // Clamp between 0 and totalMinutes
  return Math.max(0, Math.min(minutesIntoCurrent, totalMinutes.value))
})

const positionPercent = computed(() => {
  return `${(currentMinutes.value / totalMinutes.value) * 100}%`
})

const isVisible = computed(() => {
  const hour = currentTime.value.getHours()
  return hour >= startHour.value && hour < endHour.value
})

const updateTime = () => {
  currentTime.value = new Date()
}

let interval
onMounted(() => {
  updateTime()
  interval = setInterval(updateTime, 60000) // Update har 1 minutda
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<style scoped>
</style>
