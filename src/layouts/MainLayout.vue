<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar
      :is-open="sidebarOpen"
      @close="sidebarOpen = false"
      @logout="handleLogout"
    />

    <!-- Main Content -->
    <div class="lg:pl-64">
      <!-- Header -->
      <header class="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 sm:px-6 lg:px-8">
        <!-- Left: Mobile menu & Page title -->
        <div class="flex items-center gap-4">
          <!-- Mobile menu button -->
          <button
            @click="sidebarOpen = true"
            class="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Bars3Icon class="w-6 h-6" />
          </button>

          <!-- Page Title -->
          <div class="hidden sm:block">
            <h1 class="text-xl font-semibold text-gray-900">{{ pageTitle }}</h1>
            <p class="text-sm text-gray-500">{{ pageSubtitle }}</p>
          </div>
        </div>

        <!-- Right: ShifoAI, User Menu -->
        <div class="flex items-center gap-3">
          <!-- ShifoAI -->
          <div class="relative">
            <button
              type="button"
              @click="shifoAIOpen = true"
              class="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="ShifoAI — Tizim yordamchisi"
            >
              <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <SparklesIcon class="w-4 h-4 text-white" />
              </div>
              <span class="hidden sm:inline text-sm font-medium text-gray-700">ShifoAI</span>
            </button>
          </div>

          <!-- User Menu -->
          <div class="relative">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <UserCircleIcon class="w-6 h-6 text-gray-500" />
              <ChevronDownIcon class="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
              >
                <router-link
                  :to="authStore.userRole === 'admin' ? '/settings' : '/doctor/profile'"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  <UserCircleIcon class="w-5 h-5 text-gray-400" />
                  {{ t('common.profile') }}
                </router-link>
                <router-link
                  to="/settings"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  <Cog6ToothIcon class="w-5 h-5 text-gray-400" />
                  {{ t('common.settings') }}
                </router-link>
                <router-link
                  to="/help"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >
                  <QuestionMarkCircleIcon class="w-5 h-5 text-gray-400" />
                  {{ t('common.help') }}
                </router-link>
                <hr class="my-1 border-gray-100" />
                <button
                  @click="handleLogout"
                  class="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon class="w-5 h-5" />
                  {{ t('common.logout') }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- ShifoAI Panel -->
    <ShifoAIPanel :open="shifoAIOpen" @close="shifoAIOpen = false" />

    <!-- Click outside to close menus -->
    <div
      v-if="userMenuOpen"
      class="fixed inset-0 z-40"
      @click="userMenuOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import Sidebar from '@/components/layout/Sidebar.vue'
import ShifoAIPanel from '@/components/shared/ShifoAIPanel.vue'
import {
  Bars3Icon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const shifoAIOpen = ref(false)

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': t('dashboard.title'),
    '/patients': authStore.userRole === 'solo' ? t('patients.soloTitle') : t('patients.allPatients'),
    '/doctors': t('doctors.title'),
    '/appointments': t('appointments.title'),
    '/payments': t('payments.title'),
    '/services': t('services.title'),
    '/inventory': t('inventory.title'),
    '/reports': t('reports.title'),
    '/settings': t('settings.title'),
    '/my-patients': t('patients.myPatients'),
    '/my-appointments': t('appointments.myAppointments'),
    '/treatment-plans': t('dashboard.treatmentPlans'),
    '/doctor/profile': t('profile.title'),
  }
  return titles[route.path] || t('dashboard.title')
})

const pageSubtitle = computed(() => {
  const subtitles = {
    '/dashboard': authStore.userRole === 'solo' ? t('soloDashboard.subtitle') : t('dashboard.overview'),
    '/patients': authStore.userRole === 'solo' ? t('patients.soloSubtitle') : t('patients.patientList'),
    '/doctors': t('doctors.doctorsList'),
    '/appointments': t('appointments.appointmentsCalendar'),
    '/payments': t('payments.financialReports'),
    '/services': t('services.servicePrices'),
    '/inventory': t('inventory.title'),
    '/reports': t('reports.statistics'),
    '/settings': t('settings.systemSettings'),
    '/my-patients': t('patients.myPatientList'),
    '/my-appointments': t('appointments.appointmentsCalendar'),
    '/treatment-plans': t('dashboard.treatmentPlans'),
    '/doctor/profile': t('profile.personalInfo'),
  }
  return subtitles[route.path] || ''
})

const userInitials = computed(() => {
  if (authStore.userRole === 'admin') return 'AD'
  const name = authStore.user?.full_name
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const email = authStore.userEmail || ''
  return email.slice(0, 2).toUpperCase() || '??'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

</script>
