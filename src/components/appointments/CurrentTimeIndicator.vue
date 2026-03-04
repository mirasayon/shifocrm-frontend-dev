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
  const todayStart = new Date(now)
  todayStart.setHours(startHour.value, 0, 0, 0)
  const diffMs = now - todayStart
  return Math.max(0, Math.min(diffMs / 60000, totalMinutes.value))
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
