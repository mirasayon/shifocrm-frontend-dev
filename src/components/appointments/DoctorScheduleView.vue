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

    <!-- Schedule grid - Day view (Dentist+ style) -->
    <div v-if="viewMode === 'day'" class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden flex flex-col">
      <!-- Toolbar -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
        <!-- Doctor Filter with Multi-select -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Shifokorlar:</label>
          <div class="relative" ref="doctorDropdownRef">
            <button
              @click="showDoctorDropdown = !showDoctorDropdown"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white flex items-center gap-2 min-w-[200px]"
            >
              <span v-if="selectedDoctorIds.length === 0" class="text-gray-500">Hammasi</span>
              <span v-else-if="selectedDoctorIds.length === visibleDoctors.length" class="text-gray-900">Hammasi tanlangan</span>
              <span v-else class="text-gray-900">{{ selectedDoctorIds.length }} ta tanlangan</span>
              <svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- Dropdown -->
            <div
              v-if="showDoctorDropdown"
              class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[250px]"
            >
              <div class="p-2 border-b border-gray-200 flex gap-2">
                <button
                  @click="selectAllDoctors"
                  class="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded"
                >
                  Hammasini tanlash
                </button>
                <button
                  @click="clearDoctorSelection"
                  class="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded"
                >
                  Tozalash
                </button>
              </div>
              <div class="max-h-60 overflow-y-auto p-2">
                <label
                  v-for="doctor in visibleDoctors"
                  :key="doctor.id"
                  class="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="doctor.id"
                    v-model="selectedDoctorIds"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm">{{ doctor.full_name }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- New Appointment Button -->
        <button
          @click="openNewAppointmentModal(null, null)"
          class="px-4 py-2 bg-gradient-to-r from-primary-500 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:from-primary-600 hover:to-cyan-700 transition-all"
        >
          + Yangi uchrashuv
        </button>
      </div>

      <!-- Schedule Canvas -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Left: Time column (sticky) -->
        <div class="w-20 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto sticky left-0 z-40">
          <div v-for="hour in hours" :key="hour.time" class="text-right pr-3 py-0 text-xs font-medium text-gray-600 border-b border-gray-100" :style="{ height: slotHeightPx + 'px' }">
            <div class="pt-1">{{ hour.time }}</div>
          </div>
        </div>

        <!-- Right: Doctor columns -->
        <div class="flex flex-1 overflow-x-auto overflow-y-auto">
          <div
            v-for="doctor in displayedDoctors"
            :key="doctor.id"
            class="flex-1 min-w-[250px] border-r border-gray-200 relative"
          >
            <!-- Doctor header -->
            <div class="sticky top-0 z-30 bg-white border-b border-gray-200 px-3 py-2">
              <div class="text-sm font-semibold text-gray-900">{{ doctor.full_name }}</div>
              <div class="text-xs text-gray-500">{{ doctor.specialization || 'Shifokor' }}</div>
            </div>

            <!-- Time slots background -->
            <div class="relative">
              <!-- Background grid -->
              <div v-for="hour in hours" :key="`bg-${doctor.id}-${hour.time}`" class="border-b border-gray-100 bg-gradient-to-b from-blue-50 via-white to-white hover:bg-blue-50 cursor-pointer transition-colors" :style="{ height: slotHeightPx + 'px' }" @click="handleSlotClick(doctor.id, hour.time)"></div>

              <!-- Current time indicator for this column -->
              <CurrentTimeIndicator
                :start-hour="9"
                :end-hour="18"
                class="absolute left-0 right-0 z-20 pointer-events-none"
              />

              <!-- Appointments for this doctor -->
              <div class="absolute inset-0 pointer-events-none">
                <div
                  v-for="appt in getAppointmentsForDoctor(doctor.id)"
                  :key="appt.id"
                  class="absolute left-2 right-2 pointer-events-auto cursor-move"
                  :style="getAppointmentStyle(appt)"
                  @mousedown="startDrag($event, appt)"
                >
                  <AppointmentBlock
                    :appointment="appt"
                    :slot-height-px="slotHeightPx"
                    @update-status="handleStatusUpdate"
                    @open-payment="handleOpenPayment"
                  />
                </div>
              </div>
            </div>
          </div>
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
                  'px-4 py-3 border-r border-gray-200 h-40 align-top',
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                ]"
              >
                <div :class="['text-sm font-semibold mb-2', day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400']">
                  {{ day.dayNum }}
                </div>
                <div v-if="day.isCurrentMonth" class="space-y-1 text-xs">
                  <div
                    v-for="appt in getAppointmentsForDateMonth(day.dateStr)"
                    :key="appt.id"
                    :class="['p-1 rounded cursor-pointer hover:shadow-md truncate', getStatusBadgeClass(appt.status)]"
                    :title="`${appt.patient_name} - ${appt.doctor_name} (${appt.start_time})`"
                    @click="$emit('open-payment', appt.id)"
                  >
                    <div class="font-medium truncate">{{ appt.patient_name }}</div>
                    <div class="text-xs opacity-75">{{ appt.doctor_name }}</div>
                  </div>
                  <div v-if="getAppointmentsForDateMonth(day.dateStr).length > 3" class="text-xs text-gray-500 mt-1">
                    +{{ getAppointmentsForDateMonth(day.dateStr).length - 3 }} boshqa
                  </div>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import * as visitsApi from '@/api/visitsApi'
import { getVisitStatusColors } from '@/constants/visitStatus'
import CurrentTimeIndicator from './CurrentTimeIndicator.vue'
import AppointmentBlock from './AppointmentBlock.vue'

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
const selectedDoctorIds = ref([]) // Multi-select doctor IDs
const showDoctorDropdown = ref(false)
const doctorDropdownRef = ref(null) // Ref for dropdown element
const draggingAppointment = ref(null)
const dragStartY = ref(0)
const dragStartTime = ref('')

const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Yak']

// Close dropdown on outside click
const handleClickOutside = (event) => {
  if (doctorDropdownRef.value && !doctorDropdownRef.value.contains(event.target)) {
    showDoctorDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Time array for day view grid (09:00 - 18:00, 30 min slots)
const hours = computed(() => {
  const result = []
  for (let h = 9; h < 18; h++) {
    result.push({ time: `${String(h).padStart(2, '0')}:00` })
    result.push({ time: `${String(h).padStart(2, '0')}:30` })
  }
  return result
})

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

// Displayed doctors (filtered by selection)
const displayedDoctors = computed(() => {
  if (selectedDoctorIds.value.length === 0) {
    return visibleDoctors.value
  }
  return visibleDoctors.value.filter(d => selectedDoctorIds.value.includes(d.id))
})

// Tanlangan kun uchun appointmentlar (day view)
const dayAppointments = computed(() => {
  return appointments.value.filter(appt => appt.date === currentDate.value)
})

// Get appointments for specific doctor
const getAppointmentsForDoctor = (doctorId) => {
  return dayAppointments.value
    .filter(appt => Number(appt.doctor_id) === Number(doctorId))
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
}

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

// Multi-select dropdown metodlari
const selectAllDoctors = () => {
  selectedDoctorIds.value = visibleDoctors.value.map(d => d.id)
}

const clearDoctorSelection = () => {
  selectedDoctorIds.value = []
}

// Click-to-create appointment
const handleSlotClick = (doctorId, timeStr) => {
  openNewAppointmentModal(doctorId, timeStr)
}

const openNewAppointmentModal = (doctorId, startTime) => {
  emit('open-payment', null, { 
    doctorId, 
    startTime, 
    date: currentDate.value 
  })
}

// Drag & drop implementation
const startDrag = (event, appt) => {
  event.stopPropagation() // Prevent slot click
  draggingAppointment.value = appt
  dragStartY.value = event.clientY
  dragStartTime.value = appt.start_time
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  document.body.style.cursor = 'grabbing'
}

const handleDragMove = (event) => {
  if (!draggingAppointment.value) return
  
  const deltaY = event.clientY - dragStartY.value
  const deltaSlots = Math.round(deltaY / slotHeightPx)
  
  if (deltaSlots !== 0) {
    const [h, m] = dragStartTime.value.split(':').map(Number)
    const newMinutes = h * 60 + m + (deltaSlots * 30)
    const newH = Math.floor(newMinutes / 60)
    const newM = newMinutes % 60
    
    if (newH >= 9 && newH < 18) {
      const newTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
      draggingAppointment.value.start_time = newTime
      
      // Update end_time if exists
      if (draggingAppointment.value.end_time) {
        const [endH, endM] = draggingAppointment.value.end_time.split(':').map(Number)
        const duration = (endH * 60 + endM) - (h * 60 + m)
        const newEndMinutes = newMinutes + duration
        const newEndH = Math.floor(newEndMinutes / 60)
        const newEndM = newEndMinutes % 60
        draggingAppointment.value.end_time = `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`
      }
      
      dragStartY.value = event.clientY
      dragStartTime.value = newTime
    }
  }
}

const handleDragEnd = async () => {
  if (!draggingAppointment.value) return
  
  try {
    // Update appointment via API
    await visitsApi.update(draggingAppointment.value.id, {
      start_time: draggingAppointment.value.start_time,
      end_time: draggingAppointment.value.end_time
    })
    
    // Reload appointments
    await loadAppointments()
  } catch (error) {
    console.error('Failed to update appointment:', error)
    // Reload to revert visual changes
    await loadAppointments()
  } finally {
    draggingAppointment.value = null
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
    document.body.style.cursor = ''
  }
}

// To'lov modali ochish
const handleOpenPayment = (appointmentId) => {
  emit('open-payment', appointmentId)
}

// Appointment'ning pixel position'ini hisoblash (start_time va end_time bo'yicha)
const getAppointmentStyle = (appt) => {
  if (!appt.start_time) return {}
  
  const [startH, startM] = appt.start_time.split(':').map(Number)
  const startMinutesFromDay = (startH - 9) * 60 + startM
  const topPx = (startMinutesFromDay / 30) * slotHeightPx
  
  // Default duration 30 minutes agar end_time bo'lmasa
  let heightPx = slotHeightPx
  if (appt.end_time) {
    const [endH, endM] = appt.end_time.split(':').map(Number)
    const endMinutesFromDay = (endH - 9) * 60 + endM
    const durationMinutes = endMinutesFromDay - startMinutesFromDay
    heightPx = (durationMinutes / 30) * slotHeightPx
  } else if (appt.duration_minutes) {
    heightPx = (appt.duration_minutes / 30) * slotHeightPx
  }
  
  return {
    top: `${topPx}px`,
    height: `${heightPx}px`,
    minHeight: `${slotHeightPx}px`
  }
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
