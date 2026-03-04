<template>
  <div class="doctor-schedule-container space-y-4">
    <!-- Header: Date nav + Today button + View toggle -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <button
          @click="shiftPeriod(-1)"
          class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          :title="`Oldingi ${viewModeLabel}`"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <input
          v-model="selectedDateLocal"
          type="date"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          @click="shiftPeriod(1)"
          class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          :title="`Keyingi ${viewModeLabel}`"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          @click="setToday"
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

      <div class="text-lg font-semibold text-gray-900">
        {{ periodLabel }}
      </div>
    </div>

    <!-- Schedule grid - Day view -->
    <div v-if="viewMode === 'day'" class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div class="flex overflow-x-auto relative">
        <!-- Left: Time column -->
        <TimeGrid
          :start-hour="9"
          :end-hour="18"
          :slot-height-px="slotHeightPx"
        />

        <!-- Right: Doctor columns -->
        <div class="flex flex-1 overflow-x-auto relative">
          <!-- Current time indicator (in scrollable area) -->
          <CurrentTimeIndicator
            :start-hour="9"
            :end-hour="18"
            class="absolute left-0 right-0 z-10"
          />

          <DoctorColumn
            v-for="doctor in visibleDoctors"
            :key="doctor.id"
            :doctor="doctor"
            :appointments="dayAppointments"
            :start-hour="9"
            :end-hour="18"
            :slot-height-px="slotHeightPx"
            @update-status="handleStatusUpdate"
            @open-payment="handleOpenPayment"
          />
        </div>
      </div>
    </div>

    <!-- Schedule grid - Week view -->
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
              v-for="(doctor, docIdx) in visibleDoctors"
              :key="`doctor-${doctor.id}`"
              :class="[
                'border-b border-gray-200',
                docIdx !== visibleDoctors.length - 1 ? 'border-b-2' : ''
              ]"
            >
              <td class="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 border-r border-gray-200 sticky left-0">
                <div>{{ doctor.full_name }}</div>
                <div class="text-xs text-gray-500">{{ doctor.specialization }}</div>
              </td>
              <td
                v-for="day in weekDays"
                :key="`${doctor.id}-${day.dateStr}`"
                class="px-2 py-3 border-l border-gray-200 text-center min-w-[120px] bg-gradient-to-br from-blue-50 to-transparent hover:from-blue-100 cursor-pointer transition-colors"
                @click="currentDate = day.dateStr; viewMode = 'day'"
              >
                <div class="text-2xl font-bold text-primary-600">
                  {{ getAppointmentsForDoctorAndDate(doctor.id, day.dateStr).length }}
                </div>
                <div class="text-xs text-gray-500 mt-1">uchrashuvlar</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Schedule grid - Month view -->
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
                  'px-3 py-2 border-r border-gray-200 h-32 align-top cursor-pointer hover:bg-primary-50 transition-colors',
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                ]"
                @click="day.isCurrentMonth && (currentDate = day.dateStr, viewMode = 'day')"
              >
                <div :class="['text-sm font-semibold mb-2', day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400']">
                  {{ day.dayNum }}
                </div>
                <div v-if="day.isCurrentMonth" class="space-y-1.5 text-xs">
                  <template v-for="doctor in visibleDoctors" :key="`${day.dateStr}-${doctor.id}`">
                    <div v-if="getAppointmentsForDoctorAndDate(doctor.id, day.dateStr).length > 0" class="flex items-center justify-between">
                      <span class="font-medium text-gray-700 truncate">{{ doctor.full_name }}</span>
                      <span class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white font-bold text-xs">
                        {{ getAppointmentsForDoctorAndDate(doctor.id, day.dateStr).length }}
                      </span>
                    </div>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Info: no doctors -->
    <div v-if="visibleDoctors.length === 0" class="text-center py-12 text-gray-500">
      <p>{{ t('appointments.noDoctors') || 'Doktorlar topilmadi' }}</p>
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
import { useDoctorsStore } from '@/stores/doctors'
import * as visitsApi from '@/api/visitsApi'
import { getVisitStatusLabel, getVisitStatusColors } from '@/constants/visitStatus'
import TimeGrid from './TimeGrid.vue'
import DoctorColumn from './DoctorColumn.vue'
import CurrentTimeIndicator from './CurrentTimeIndicator.vue'

const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:selectedDate', 'update-status', 'open-payment'])

const { t } = useI18n()
const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()

const loading = ref(false)
const appointments = ref([])
const slotHeightPx = 60 // 30 minut = 60px
const viewMode = ref('day') // 'day', 'week', 'month'
const currentDate = ref(props.selectedDate)

const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Yak']

// Doktor uchun faqat o'z appointmentlari, admin uchun barchasi
const visibleDoctors = computed(() => {
  const allDoctors = doctorsStore.items || []
  if (authStore.userRole === 'admin') {
    return allDoctors
  }
  // Doktor uchun faqat o'zini ko'rsatish
  const myId = authStore.user?.id
  return allDoctors.filter(d => Number(d.id) === Number(myId))
})

// Tanlangan kun uchun appointmentlar (day view)
const dayAppointments = computed(() => {
  return appointments.value.filter(appt => appt.date === currentDate.value)
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

// View mode label
const viewModeLabel = computed(() => {
  if (viewMode.value === 'day') return t('appointments.viewDay')
  if (viewMode.value === 'week') return t('appointments.viewWeek')
  return t('appointments.viewMonth')
})

// Period label
const periodLabel = computed(() => {
  if (viewMode.value === 'day') {
    return formatDateLabel(currentDate.value)
  } else if (viewMode.value === 'week') {
    const start = getWeekStart(currentDate.value)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.split('T')[0]} - ${end.toISOString().split('T')[0]}`
  } else {
    const date = new Date(currentDate.value + 'T00:00:00')
    return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })
  }
})

// Tanlangan sanani o'zgartirish
const selectedDateLocal = computed({
  get: () => props.selectedDate,
  set: (val) => emit('update:selectedDate', val)
})

const shiftPeriod = (days) => {
  const date = new Date(currentDate.value)

  if (viewMode.value === 'day') {
    date.setDate(date.getDate() + days)
  } else if (viewMode.value === 'week') {
    date.setDate(date.getDate() + days * 7)
  } else {
    date.setMonth(date.getMonth() + days)
  }

  currentDate.value = date.toISOString().split('T')[0]
}

const setToday = () => {
  currentDate.value = new Date().toISOString().split('T')[0]
}

const getWeekStart = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay() || 7
  const diff = date.getDate() - day + 1
  const weekStart = new Date(date.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}

const formatDateLabel = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const getStatusLabel = (status) => {
  return getVisitStatusLabel(status)
}

const getStatusBadgeClass = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bg} ${colors.text}`
}

const getAppointmentsForDoctorAndDate = (doctorId, dateStr) => {
  return appointments.value
    .filter(appt => appt.date === dateStr && Number(appt.doctor_id) === Number(doctorId))
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
}

const getAppointmentsForDateMonth = (dateStr) => {
  return appointments.value
    .filter(appt => appt.date === dateStr)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
}

// Appointmentlarni yuklash
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

// Status o'zgartirish
const handleStatusUpdate = async ({ appointmentId, newStatus }) => {
  try {
    await visitsApi.updateVisit(appointmentId, { status: newStatus })
    await loadAppointments()
    emit('update-status', appointmentId)
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}

// To'lov modali ochish
const handleOpenPayment = (appointmentId) => {
  emit('open-payment', appointmentId)
}

// Watch current date va view mode
watch([() => currentDate.value, () => viewMode.value], loadAppointments)

onMounted(loadAppointments)
</script>

<style scoped>
.doctor-schedule-container {
  width: 100%;
}
</style>
