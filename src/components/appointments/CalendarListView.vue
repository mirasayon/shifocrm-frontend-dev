<template>
  <div class="calendar-list-container space-y-6">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <button
          @click="shiftPeriod(-1)"
          class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          :title="`Oldingi ${viewModeLabels[viewMode]}`"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="text-lg font-semibold text-gray-900 min-w-[200px]">
          {{ periodLabel }}
        </div>
        <button
          @click="shiftPeriod(1)"
          class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          :title="`Keyingi ${viewModeLabels[viewMode]}`"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          @click="goToToday"
          class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg hover:from-primary-600 hover:to-cyan-700 transition-all"
        >
          {{ t('appointments.today') }}
        </button>
      </div>

      <!-- View mode toggle -->
      <div class="flex gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          @click="viewMode = 'day'"
          :class="[
            'px-3 py-2 text-sm font-medium rounded transition-colors',
            viewMode === 'day'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          {{ t('appointments.viewDay') }}
        </button>
        <button
          @click="viewMode = 'week'"
          :class="[
            'px-3 py-2 text-sm font-medium rounded transition-colors',
            viewMode === 'week'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          {{ t('appointments.viewWeek') }}
        </button>
        <button
          @click="viewMode = 'month'"
          :class="[
            'px-3 py-2 text-sm font-medium rounded transition-colors',
            viewMode === 'month'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          {{ t('appointments.viewMonth') }}
        </button>
      </div>
    </div>

    <!-- Calendar: Day view -->
    <div v-if="viewMode === 'day'" class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ formatDate(currentDate) }}</h3>
        <div v-if="dayAppointments.length > 0" class="space-y-3">
          <div
            v-for="appt in dayAppointments"
            :key="appt.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-gray-900">{{ appt.patient_name }}</span>
                  <span :class="['text-xs px-2 py-1 rounded-full font-medium', getStatusBadgeClass(appt.status)]">
                    {{ getStatusLabel(appt.status) }}
                  </span>
                  <span v-if="appt.paid_amount !== null" :class="['text-xs px-2 py-1 rounded-full', appt.paid_amount >= (appt.price || 0) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700']">
                    {{ appt.paid_amount >= (appt.price || 0) ? t('appointments.paymentPaid') : t('appointments.paymentPartial') }}
                  </span>
                </div>
                <div class="text-sm text-gray-600 mt-2">
                  {{ appt.start_time }} - {{ calculateEndTime(appt.start_time, appt.duration_minutes) }} | {{ appt.doctor_name }}
                </div>
                <div v-if="appt.service_name" class="text-sm text-gray-500 mt-1">
                  {{ appt.service_name }}
                </div>
              </div>
              <div class="flex gap-2 ml-4">
                <button
                  @click="$emit('open-payment', appt.id)"
                  class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  {{ t('appointments.payment') }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          {{ t('appointments.noAppointments') }}
        </div>
      </div>
    </div>

    <!-- Calendar: Week view -->
    <div v-else-if="viewMode === 'week'" class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 w-32">{{ t('appointments.time') }}</th>
              <th
                v-for="day in weekDays"
                :key="day.dateStr"
                class="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50 border-l border-gray-200"
              >
                <div class="font-medium">{{ day.dayName }}</div>
                <div class="text-xs text-gray-500">{{ day.dateStr }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="timeSlot in timeSlots"
              :key="timeSlot"
              class="border-b border-gray-200 h-16"
            >
              <td class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200 sticky left-0">
                {{ timeSlot }}
              </td>
              <td
                v-for="day in weekDays"
                :key="`${day.dateStr}-${timeSlot}`"
                class="px-2 py-2 border-l border-gray-200 text-center"
              >
                <div
                  v-for="appt in getAppointmentsForTimeSlot(day.dateStr, timeSlot)"
                  :key="appt.id"
                  :class="['text-xs p-1 rounded cursor-pointer hover:shadow-md transition-shadow', getStatusBadgeClass(appt.status)]"
                  @click="$emit('open-payment', appt.id)"
                >
                  <div class="font-medium">{{ appt.patient_name }}</div>
                  <div class="text-xs opacity-75">{{ appt.start_time }}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Calendar: Month view -->
    <div v-else-if="viewMode === 'month'" class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th
                v-for="dayName in dayNames"
                :key="dayName"
                class="px-4 py-3 text-center text-sm font-semibold text-gray-900"
              >
                {{ dayName }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(week, weekIdx) in monthCalendar"
              :key="weekIdx"
              class="border-b border-gray-200"
            >
              <td
                v-for="day in week"
                :key="day.dateStr"
                :class="[
                  'px-4 py-3 border-r border-gray-200 h-32 align-top',
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                ]"
              >
                <div :class="['text-sm font-semibold mb-1', day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400']">
                  {{ day.dayNum }}
                </div>
                <div v-if="day.isCurrentMonth" class="space-y-1">
                  <div
                    v-for="appt in getAppointmentsForDate(day.dateStr)"
                    :key="appt.id"
                    :class="['text-xs p-1 rounded cursor-pointer hover:shadow-md truncate', getStatusBadgeClass(appt.status)]"
                    :title="`${appt.patient_name} - ${appt.start_time}`"
                    @click="$emit('open-payment', appt.id)"
                  >
                    {{ appt.patient_name }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-6 text-gray-500">
      {{ t('appointments.loading') }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import * as visitsApi from '@/api/visitsApi'
import { getVisitStatusLabel, getVisitStatusColors } from '@/constants/visitStatus'

const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  }
})

defineEmits(['update:selectedDate', 'open-payment'])

const { t } = useI18n()
const authStore = useAuthStore()

const viewMode = ref('month') // 'day', 'week', 'month'
const currentDate = ref(props.selectedDate)
const appointments = ref([])
const loading = ref(false)

const viewModeLabels = {
  day: t('appointments.viewDay'),
  week: t('appointments.viewWeek'),
  month: t('appointments.viewMonth')
}

const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Yak']

const timeSlots = computed(() => {
  const slots = []
  for (let h = 9; h < 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
})

// Period label - kun/hafta/oy
const periodLabel = computed(() => {
  if (viewMode.value === 'day') {
    return formatDate(currentDate.value)
  } else if (viewMode.value === 'week') {
    const start = getWeekStart(currentDate.value)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${formatDate(start.toISOString().split('T')[0])} - ${formatDate(end.toISOString().split('T')[0])}`
  } else {
    const date = new Date(currentDate.value + 'T00:00:00')
    return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })
  }
})

// Day appointments
const dayAppointments = computed(() => {
  return appointments.value.filter(appt => appt.date === currentDate.value)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
})

// Week days
const weekDays = computed(() => {
  const weekStart = getWeekStart(currentDate.value)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      dateStr,
      dayName: d.toLocaleDateString('uz-UZ', { weekday: 'short' }),
      dayNum: d.getDate()
    })
  }
  return days
})

// Month calendar (42-day grid)
const monthCalendar = computed(() => {
  const date = new Date(currentDate.value + 'T00:00:00')
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const calendar = []
  let week = []
  const current = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    const dateStr = current.toISOString().split('T')[0]
    const isCurrentMonth = current.getMonth() === date.getMonth()

    week.push({
      dateStr,
      dayNum: current.getDate(),
      isCurrentMonth
    })

    if (week.length === 7) {
      calendar.push(week)
      week = []
    }

    current.setDate(current.getDate() + 1)
  }

  return calendar
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const getWeekStart = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay() || 7 // 1-7 (Mon-Sun)
  const diff = date.getDate() - day + 1
  const weekStart = new Date(date.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}

const shiftPeriod = (direction) => {
  const date = new Date(currentDate.value + 'T00:00:00')

  if (viewMode.value === 'day') {
    date.setDate(date.getDate() + direction)
  } else if (viewMode.value === 'week') {
    date.setDate(date.getDate() + direction * 7)
  } else {
    date.setMonth(date.getMonth() + direction)
  }

  currentDate.value = date.toISOString().split('T')[0]
}

const goToToday = () => {
  currentDate.value = new Date().toISOString().split('T')[0]
}

const calculateEndTime = (startTime, durationMinutes) => {
  const [h, m] = startTime.split(':').map(Number)
  const totalMin = h * 60 + m + durationMinutes
  const endH = Math.floor(totalMin / 60)
  const endM = totalMin % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

const getStatusLabel = (status) => {
  return getVisitStatusLabel(status)
}

const getStatusBadgeClass = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bgClass} ${colors.textClass}`
}

const getAppointmentsForDate = (dateStr) => {
  return appointments.value
    .filter(appt => appt.date === dateStr)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 3) // Show max 3 in month view
}

const getAppointmentsForTimeSlot = (dateStr, timeStr) => {
  return appointments.value.filter(appt => appt.date === dateStr && appt.start_time === timeStr)
}

const loadAppointments = async () => {
  loading.value = true
  try {
    let startDate, endDate

    if (viewMode.value === 'day') {
      startDate = currentDate.value
      endDate = currentDate.value
    } else if (viewMode.value === 'week') {
      const weekStart = getWeekStart(currentDate.value)
      startDate = weekStart
      const weekEnd = new Date(weekStart + 'T00:00:00')
      weekEnd.setDate(weekEnd.getDate() + 6)
      endDate = weekEnd.toISOString().split('T')[0]
    } else {
      const date = new Date(currentDate.value + 'T00:00:00')
      startDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      endDate = lastDay.toISOString().split('T')[0]
    }

    if (authStore.userRole === 'admin') {
      appointments.value = await visitsApi.getVisitsByDateRange(startDate, endDate)
    } else if (authStore.user?.id) {
      appointments.value = await visitsApi.getVisitsByDoctorAndDateRange(
        authStore.user.id,
        startDate,
        endDate
      )
    }
  } catch (error) {
    console.error('Failed to load appointments:', error)
    appointments.value = []
  } finally {
    loading.value = false
  }
}

// Watch currentDate and viewMode
watch([() => currentDate.value, () => viewMode.value], loadAppointments)

onMounted(loadAppointments)
</script>

<style scoped>
.calendar-list-container {
  width: 100%;
}
</style>
