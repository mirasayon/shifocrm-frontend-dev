<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('appointments.title') }}</h1>
          <p class="text-gray-500">{{ t('appointments.subtitle') }}</p>
        </div>
        <div class="w-full">
          <button
            @click="openCreateModal"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99] touch-target-lg"
          >
            <PlusIcon class="w-5 h-5" />
            {{ t('appointments.newAppointment') }}
          </button>
        </div>
      </div>

      <!-- Filters - Clean layout -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-4 space-y-3">
        <!-- View mode selector: Today, List, or Schedule -->
        <div class="flex items-center justify-between">
          <div class="grid grid-cols-3 gap-2 md:gap-3 md:flex-none">
            <button
              @click="displayMode = 'today'"
              class="px-3 py-2 text-sm font-medium rounded-lg border transition-all"
              :class="displayMode === 'today' ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-white border-primary-500' : 'border-gray-200 hover:bg-gray-50 text-gray-700'"
            >
              {{ $t('Bugun') || 'Bugun' }}
            </button>
            <button
              @click="displayMode = 'list'"
              class="px-3 py-2 text-sm font-medium rounded-lg border transition-all"
              :class="displayMode === 'list' ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-white border-primary-500' : 'border-gray-200 hover:bg-gray-50 text-gray-700'"
            >
              {{ t('appointments.viewList') || 'Ro\'yxat' }}
            </button>
            <button
              @click="displayMode = 'schedule'"
              class="px-3 py-2 text-sm font-medium rounded-lg border transition-all"
              :class="displayMode === 'schedule' ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-white border-primary-500' : 'border-gray-200 hover:bg-gray-50 text-gray-700'"
            >
              {{ t('appointments.viewSchedule') || 'Stollar' }}
            </button>
          </div>
        </div>

        <!-- List view controls -->
        <div v-if="displayMode === 'list'" class="space-y-3">
          <!-- View mode + Date navigation (single row) -->
          <div class="flex flex-col md:flex-row md:items-center gap-3">
            <!-- Day, Week, Month toggle -->
            <div class="grid grid-cols-3 gap-2 flex-1 md:flex-none">
              <button
                @click="viewMode = 'day'; setToday()"
                class="px-3 py-2 text-sm font-medium rounded-lg border transition-all"
                :class="viewMode === 'day' ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-white border-primary-500' : 'border-gray-200 hover:bg-gray-50 text-gray-700'"
              >
                {{ t('appointments.viewDay') }}
              </button>
              <button
                @click="viewMode = 'week'; setToday()"
                class="px-3 py-2 text-sm font-medium rounded-lg border transition-all"
                :class="viewMode === 'week' ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-white border-primary-500' : 'border-gray-200 hover:bg-gray-50 text-gray-700'"
              >
                {{ t('appointments.viewWeek') }}
              </button>
              <button
                @click="viewMode = 'month'; setToday()"
                class="px-3 py-2 text-sm font-medium rounded-lg border transition-all"
                :class="viewMode === 'month' ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-white border-primary-500' : 'border-gray-200 hover:bg-gray-50 text-gray-700'"
              >
                {{ t('appointments.viewMonth') }}
              </button>
            </div>

            <!-- Date picker + navigation buttons -->
            <div class="flex items-center gap-2">
              <button
                @click="shiftDate(-1)"
                class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                :title="t('appointments.previous')"
              >
                <ChevronLeftIcon class="w-5 h-5" />
              </button>
              <input
                v-model="selectedDate"
              type="date"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              @click="shiftDate(1)"
              class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              :title="t('appointments.next')"
            >
              <ChevronRightIcon class="w-5 h-5" />
            </button>
            <button
              @click="setToday"
              class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg hover:from-primary-600 hover:to-cyan-700 transition-all hidden md:inline-block"
            >
              {{ t('appointments.today') }}
            </button>
          </div>
        </div>

        <!-- Search + Status + Doctor filters (flex row) -->
        <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <!-- Search -->
          <div class="relative flex-1">
            <div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('appointments.searchPlaceholder')"
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          <!-- Status filter -->
          <select
            v-model="selectedStatus"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
          >
            <option value="">{{ t('appointments.allStatuses') }}</option>
            <option v-for="status in statusFilterOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>

          <!-- Doctor filter (admin only) -->
          <select
            v-if="isAdmin"
            v-model="selectedDoctor"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
          >
            <option value="">{{ t('appointments.allDoctors') }}</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.full_name }}
            </option>
          </select>
        </div>

        <!-- Date range label -->
        <div class="text-xs text-gray-500 px-1">
          📅 {{ dateRangeLabel }}
        </div>
        </div>
      </div>

      <!-- Bulk Actions (List view only) -->
      <div v-if="displayMode === 'list' && selectedIds.length > 0" class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium text-amber-800">
          {{ selectedIds.length }} {{ t('appointments.selected') }}
        </span>
        <button
          @click="bulkUpdateStatus('cancelled')"
          class="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700"
        >
          {{ t('appointments.cancel') }}
        </button>
        <button
          @click="bulkUpdateStatus('no_show')"
          class="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700"
        >
          {{ t('appointments.noShow') }}
        </button>
        <div v-if="isAdmin" class="flex items-center gap-2">
          <select
            v-model="bulkDoctorId"
            class="px-3 py-1.5 text-sm border border-amber-200 rounded-lg bg-white"
          >
            <option value="">{{ t('appointments.selectDoctor') }}</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.full_name }}
            </option>
          </select>
          <button
            @click="bulkChangeDoctor"
            class="px-3 py-1.5 text-sm font-medium text-amber-900 bg-amber-200 rounded-lg hover:bg-amber-300"
          >
            {{ t('appointments.changeDoctor') }}
          </button>
        </div>
        <button
          @click="openRescheduleModal"
          class="px-3 py-1.5 text-sm font-medium text-amber-900 bg-amber-200 rounded-lg hover:bg-amber-300"
        >
          {{ t('appointments.reschedule') }}
        </button>
        <button
          @click="clearSelected"
          class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-amber-200 rounded-lg"
        >
          {{ t('appointments.clearSelection') }}
        </button>
      </div>

      <!-- Display: List or Schedule -->
      <div v-if="displayMode === 'list'">
        <!-- Appointments list - streamlined for desktop doctors -->
        <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-visible">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ t('appointments.listTitle') }}</h2>
              <p class="text-sm text-gray-500">{{ filteredVisits.length }} {{ t('appointments.totalAppointments') }}</p>
            </div>
          </div>

          <div class="overflow-x-auto overflow-y-visible">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr class="text-left text-xs font-semibold text-gray-600">
                  <th class="px-4 py-3 w-12"><input type="checkbox" :checked="allSelected" @change="toggleSelectAll" /></th>
                  <th class="px-4 py-3 w-24">{{ t('appointments.date') }}</th>
                <th class="px-4 py-3 w-20">{{ t('appointments.time') }}</th>
                <th class="px-4 py-3 flex-1">{{ t('appointments.patient') }}</th>
                <th v-if="isAdmin" class="px-4 py-3 w-32">{{ t('appointments.doctor') }}</th>
                <th class="px-4 py-3 flex-1">{{ t('appointments.service') }}</th>
                <th class="px-4 py-3 w-28">{{ t('appointments.status') }}</th>
                <th v-if="isAdmin" class="px-4 py-3 w-24">{{ t('appointments.payment') }}</th>
                <th class="px-4 py-3 w-20 text-right">{{ t('appointments.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading" class="h-12">
                <td class="px-6 py-4 text-center text-gray-500 text-sm" :colspan="isAdmin ? 9 : 8">
                  {{ t('appointments.loading') }}
                </td>
              </tr>
              <tr v-else-if="filteredVisits.length === 0" class="h-12">
                <td class="px-6 py-4 text-center text-gray-500 text-sm" :colspan="isAdmin ? 9 : 8">
                  {{ t('appointments.noAppointments') }}
                </td>
              </tr>
              <tr v-for="visit in filteredVisits" :key="visit.id" class="hover:bg-gray-50 transition-colors border-b border-gray-50">
                <td class="px-4 py-3"><input type="checkbox" :checked="selectedIds.includes(visit.id)" @change="toggleSelect(visit.id)" /></td>
                <td class="px-4 py-3 font-medium text-gray-900">{{ formatDate(visit.date) }}</td>
                <td class="px-4 py-3 text-gray-700 text-xs">{{ formatTimeRange(visit) }}</td>
                <td class="px-4 py-3">
                  <router-link
                    :to="{ name: 'patient-detail', params: { id: visit.patient_id } }"
                    class="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {{ getPatientName(visit.patient_id) }}
                  </router-link>
                  <div class="text-xs text-gray-500 mt-0.5">{{ getPatientPhone(visit.patient_id) }}</div>
                </td>
                <td v-if="isAdmin" class="px-4 py-3 text-gray-700 text-sm">{{ visit.doctor_name || getDoctorName(visit.doctor_id) }}</td>
                <td class="px-4 py-3 text-gray-700">
                  <div class="text-sm">{{ visit.service_name || '-' }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">{{ formatCurrency(visit.price || 0) }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(visit.status)">
                    {{ getStatusLabel(visit.status) }}
                  </span>
                </td>
                <td v-if="isAdmin" class="px-4 py-3 text-sm">
                  <div class="text-gray-700">{{ getPaymentLabel(visit) }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">{{ formatCurrency(visit.paid_amount || 0) }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="relative action-menu-wrap flex justify-end">
                    <button
                      :ref="(el) => setActionMenuButtonRef(visit.id, el)"
                      @click.stop="toggleActionMenu(visit.id)"
                      type="button"
                      class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      :class="{ 'bg-gray-100 text-gray-700': openActionMenuId === visit.id }"
                    >
                      <EllipsisVerticalIcon class="w-5 h-5" />
                    </button>
                    <Teleport to="body">
                      <Transition
                        enter-active-class="transition ease-out duration-100"
                        enter-from-class="opacity-0 scale-95"
                        enter-to-class="opacity-100 scale-100"
                        leave-active-class="transition ease-in duration-75"
                        leave-from-class="opacity-100 scale-100"
                        leave-to-class="opacity-0 scale-95"
                      >
                        <div
                          v-if="openActionMenuId === visit.id"
                          class="action-menu-panel fixed z-[90] w-48 py-1 bg-white rounded-xl shadow-lg border border-gray-100 ring-1 ring-black/5 max-h-[70vh] overflow-y-auto"
                          :style="actionMenuStyle"
                        >
                          <template v-if="visit.status === 'pending'">
                            <button @click="updateStatus(visit, 'arrived'); closeActionMenu()" class="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2">
                              <CheckCircleIcon class="w-4 h-4" />
                              {{ t('appointments.arrived') }}
                            </button>
                            <button @click="updateStatus(visit, 'no_show'); closeActionMenu()" class="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                              <XCircleIcon class="w-4 h-4" />
                              {{ t('appointments.noShow') }}
                            </button>
                          </template>
                          <template v-if="visit.status === 'arrived'">
                            <button @click="updateStatus(visit, 'in_progress'); closeActionMenu()" class="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2">
                              <PlayCircleIcon class="w-4 h-4" />
                              {{ t('appointments.started') }}
                            </button>
                            <button @click="updateStatus(visit, 'no_show'); closeActionMenu()" class="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                              <XCircleIcon class="w-4 h-4" />
                              {{ t('appointments.noShow') }}
                            </button>
                          </template>
                          <template v-if="visit.status === 'in_progress'">
                            <button @click="openCompleteModal(visit); closeActionMenu()" class="w-full px-4 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
                              <CheckIcon class="w-4 h-4" />
                              {{ t('appointments.complete') }}
                            </button>
                          </template>
                          <div v-if="visit.status !== 'cancelled' && visit.status !== 'completed_paid' && visit.status !== 'completed_debt' && visit.status !== 'no_show'" class="border-t border-gray-100 my-1" />
                          <button
                            v-if="visit.status !== 'cancelled' && visit.status !== 'completed_paid' && visit.status !== 'completed_debt' && visit.status !== 'no_show'"
                            @click="updateStatus(visit, 'cancelled'); closeActionMenu()"
                            class="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <XMarkIcon class="w-4 h-4" />
                            {{ t('appointments.cancel') }}
                          </button>
                          <div class="border-t border-gray-100 my-1" />
                          <button @click="openRescheduleModal(visit); closeActionMenu()" class="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2">
                            <CalendarDaysIcon class="w-4 h-4" />
                            {{ t('appointments.reschedule') }}
                          </button>
                          <button @click="openStatusModal(visit); closeActionMenu()" class="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                            <Cog6ToothIcon class="w-4 h-4" />
                            {{ t('appointments.changeStatus') }}
                          </button>
                        </div>
                      </Transition>
                    </Teleport>
                    </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <!-- Today's Appointments view (filtered up to 12:00) -->
      <div v-else-if="displayMode === 'today'">
        <TodaysAppointmentsView
          @update-status="handleStatusUpdate"
          @open-payment="openCompleteModal"
        />
      </div>

      <!-- Schedule view (Doctor calendar grid) -->
      <div v-else-if="displayMode === 'schedule'">
        <DoctorScheduleView
          :selected-date="selectedDate"
          @update:selected-date="selectedDate = $event"
          @update-status="handleStatusUpdate"
          @open-payment="openCompleteModal"
        />
      </div>
    </div>
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="w-full max-w-sm bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 class="text-base font-semibold text-gray-900">{{ t('appointments.createTitle') }}</h3>
              <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Form - Minimal fields only -->
            <div class="p-4 space-y-3 overflow-y-auto flex-1">
              <!-- Patient - Required -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  {{ t('appointments.patient') }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="createForm.patient_id"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  :class="{ 'border-red-300': createError && !createForm.patient_id }"
                >
                  <option value="">{{ t('appointments.select') }}</option>
                  <option v-for="patient in availablePatients" :key="patient.id" :value="patient.id">
                    {{ patient.full_name }} ({{ patient.phone }})
                  </option>
                </select>
                <p v-if="availablePatients.length === 0 && !isAdmin" class="mt-1 text-xs text-amber-600">
                  {{ t('appointments.noPatientsAvailable') }}
                </p>
              </div>

              <!-- Doctor - Auto for doctor, required for admin -->
              <div v-if="isAdmin">
                <label class="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  {{ t('appointments.doctor') }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="createForm.doctor_id"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  :class="{ 'border-red-300': createError && !createForm.doctor_id }"
                >
                  <option value="">{{ t('appointments.select') }}</option>
                  <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                    {{ doctor.full_name }}
                  </option>
                </select>
              </div>

              <!-- Date and Time - two columns -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    {{ t('appointments.date') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="createForm.date"
                    type="date"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    :class="{ 'border-red-300': createError && !createForm.date }"
                    :min="new Date().toISOString().split('T')[0]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    {{ t('appointments.startTime') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="createForm.start_time"
                    type="time"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    :class="{ 'border-red-300': createError && !createForm.start_time }"
                  />
                </div>
              </div>

              <!-- Duration -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  {{ t('appointments.duration') }} (min)
                </label>
                <input
                  v-model.number="createForm.duration_minutes"
                  type="number"
                  min="10"
                  step="5"
                  value="30"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <!-- Service + Price (two columns) -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    {{ t('appointments.service') }}
                  </label>
                  <input
                    v-model="createForm.service_name"
                    type="text"
                    :placeholder="t('appointments.servicePlaceholder')"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    {{ t('appointments.price') }}
                  </label>
                  <input
                    v-model.number="createForm.price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <!-- Error message -->
              <div v-if="createError" class="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
                {{ createError }}
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50">
              <button
                @click="closeCreateModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {{ t('appointments.cancel') }}
              </button>
              <button
                @click="createAppointment"
                :disabled="loading"
                class="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loading" class="inline-flex items-center gap-1.5">
                  <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ t('appointments.saving') }}</span>
                </span>
                <span v-else>{{ t('appointments.save') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Reschedule Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showRescheduleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h3 class="text-lg font-semibold text-gray-900">{{ t('appointments.rescheduleTitle') }}</h3>
              <button @click="closeRescheduleModal" class="text-gray-400 hover:text-gray-600">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
            <div class="p-6 space-y-4 overflow-y-auto flex-1">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('appointments.date') }}</label>
                  <input v-model="rescheduleForm.date" type="date" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('appointments.startTime') }}</label>
                  <input v-model="rescheduleForm.start_time" type="time" class="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('appointments.duration') }}</label>
                  <input v-model.number="rescheduleForm.duration_minutes" type="number" min="10" step="5" class="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('appointments.channel') }}</label>
                <input v-model="rescheduleForm.channel" type="text" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('appointments.reason') }}</label>
                <textarea v-model="rescheduleForm.reason" rows="2" class="w-full px-3 py-2 border rounded-lg"></textarea>
              </div>
              <div v-if="rescheduleError" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {{ rescheduleError }}
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button @click="closeRescheduleModal" class="px-4 py-2 text-sm border rounded-lg">{{ t('appointments.cancel') }}</button>
              <button @click="applyReschedule" class="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg">
                {{ t('appointments.save') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Complete Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCompleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h3 class="text-lg font-semibold text-gray-900">{{ t('appointments.completeTitle') }}</h3>
              <button @click="closeCompleteModal" class="text-gray-400 hover:text-gray-600">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
            <div class="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('appointments.priceLabel') }}</label>
                <input v-model.number="completeForm.price" type="number" min="0" step="1000" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('appointments.paidAmountLabel') }}</label>
                <input v-model.number="completeForm.paid_amount" type="number" min="0" step="1000" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div class="text-sm text-gray-600">
                {{ t('appointments.debtLabel') }}: <span class="font-semibold">{{ formatCurrency(Math.max(0, (completeForm.price || 0) - (completeForm.paid_amount || 0))) }}</span>
              </div>
              <div v-if="completeError" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {{ completeError }}
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button @click="closeCompleteModal" class="px-4 py-2 text-sm border rounded-lg">{{ t('appointments.cancel') }}</button>
              <button @click="completeVisit" class="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg">
                {{ t('appointments.complete') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Status Edit Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showStatusModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h3 class="text-lg font-semibold text-gray-900">{{ t('appointments.changeStatusTitle') }}</h3>
              <button @click="closeStatusModal" class="text-gray-400 hover:text-gray-600">
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
            <div class="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('appointments.newStatus') }}</label>
                <select v-model="statusValue" class="w-full px-3 py-2 border rounded-lg">
                  <option value="">{{ t('appointments.select') }}</option>
                  <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                    {{ status.label }}
                  </option>
                </select>
              </div>
              <div v-if="statusError" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {{ statusError }}
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button @click="closeStatusModal" class="px-4 py-2 text-sm border rounded-lg">{{ t('appointments.cancel') }}</button>
              <button @click="applyStatusChange" class="px-4 py-2 text-sm text-white bg-slate-700 rounded-lg">
                {{ t('appointments.save') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </MainLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { usePatientsStore } from '@/stores/patients'
import { useToast } from '@/composables/useToast'
import * as visitsApi from '@/api/visitsApi'
import { createPayment, getPaymentsByVisitId } from '@/api/paymentsApi'
import {
  sendAppointmentConfirmed,
  sendAppointmentCanceled,
  sendDebtReminder,
  sendTelegramNotification
} from '@/api/telegramApi'
import { getVisitStatusLabel, getVisitStatusColors } from '@/constants/visitStatus'
import MainLayout from '@/layouts/MainLayout.vue'
import DoctorScheduleView from '@/components/appointments/DoctorScheduleView.vue'
import TodaysAppointmentsView from '@/components/appointments/TodaysAppointmentsView.vue'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  UserCircleIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  CheckIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const patientsStore = usePatientsStore()
const toast = useToast()
const { t } = useI18n()

const isAdmin = computed(() => authStore.userRole === 'admin')
const doctorId = computed(() => authStore.user?.id || null)

const loading = ref(false)
const visits = ref([])

// Kunlik/Haftalik/Oylik filtrlash
const viewMode = ref('day')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const displayMode = ref('schedule') // 'list' or 'schedule' - Klinika uchun default 'schedule'

const searchQuery = ref('')
const selectedDoctor = ref('')
const selectedStatus = ref('')

const selectedIds = ref([])
const bulkDoctorId = ref('')

const showCreateModal = ref(false)
const createError = ref('')
const createForm = ref({
  patient_id: '',
  doctor_id: '',
  date: '',
  start_time: '',
  duration_minutes: 30,
  service_name: '',
  price: null,
  notes: '',
  room: '',
  channel: ''
})

const showRescheduleModal = ref(false)
const rescheduleError = ref('')
const rescheduleTargets = ref([])
const rescheduleForm = ref({
  date: '',
  start_time: '',
  duration_minutes: 30,
  channel: '',
  reason: ''
})

const showCompleteModal = ref(false)
const completeError = ref('')
const completeTarget = ref(null)
const completeForm = ref({
  price: null,
  paid_amount: null
})

const showStatusModal = ref(false)
const statusError = ref('')
const statusTarget = ref(null)
const statusValue = ref('')

const openActionMenuId = ref(null)
const actionMenuStyle = ref({})
const actionMenuButtonRefs = ref({})

const ACTION_MENU_WIDTH = 192
const ACTION_MENU_ESTIMATED_HEIGHT = 280
const ACTION_MENU_GAP = 8

const setActionMenuButtonRef = (visitId, el) => {
  if (el) {
    actionMenuButtonRefs.value[visitId] = el
    return
  }
  delete actionMenuButtonRefs.value[visitId]
}

const updateActionMenuPosition = (visitId) => {
  const targetButton = actionMenuButtonRefs.value[visitId]
  if (!targetButton) return

  const rect = targetButton.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = rect.right - ACTION_MENU_WIDTH
  left = Math.max(ACTION_MENU_GAP, Math.min(left, viewportWidth - ACTION_MENU_WIDTH - ACTION_MENU_GAP))

  const spaceBelow = viewportHeight - rect.bottom - ACTION_MENU_GAP
  const spaceAbove = rect.top - ACTION_MENU_GAP
  const openUp = spaceBelow < ACTION_MENU_ESTIMATED_HEIGHT && spaceAbove > spaceBelow

  let top = openUp ? rect.top - ACTION_MENU_ESTIMATED_HEIGHT - 4 : rect.bottom + 4
  top = Math.max(ACTION_MENU_GAP, Math.min(top, viewportHeight - ACTION_MENU_ESTIMATED_HEIGHT - ACTION_MENU_GAP))

  actionMenuStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  }
}

const toggleActionMenu = async (visitId) => {
  if (openActionMenuId.value === visitId) {
    closeActionMenu()
    return
  }

  openActionMenuId.value = visitId
  await nextTick()
  updateActionMenuPosition(visitId)
}

const closeActionMenu = () => {
  openActionMenuId.value = null
}

const onDocumentClick = (e) => {
  if (!openActionMenuId.value) return
  if (e.target.closest('.action-menu-wrap')) return
  if (e.target.closest('.action-menu-panel')) return
  closeActionMenu()
}

const onMenuViewportChange = () => {
  if (!openActionMenuId.value) return
  updateActionMenuPosition(openActionMenuId.value)
}

const doctors = computed(() => doctorsStore.items)
const patients = computed(() => patientsStore.items)

// Doktor uchun faqat o'z bemorlarini ko'rsatish
const availablePatients = computed(() => {
  if (isAdmin.value) {
    return patients.value
  }
  // Doktor uchun faqat o'z bemorlarini qaytarish
  return patients.value.filter(patient => {
    const patientDoctorId = patient.doctor_id ? Number(patient.doctor_id) : null
    const currentDoctorId = doctorId.value ? Number(doctorId.value) : null
    return patientDoctorId === currentDoctorId
  })
})

// Joriy doktor nomi
const currentDoctorName = computed(() => {
  if (isAdmin.value) return ''
  const doctor = doctors.value.find(d => Number(d.id) === Number(doctorId.value))
  return doctor?.full_name || ''
})

// Filter: faqat kerakli statuslar (soddalashtirilgan)
const statusFilterOptions = computed(() => [
  { value: 'pending', label: t('appointments.statusPending') },
  { value: 'arrived', label: t('appointments.statusArrived') },
  { value: 'in_progress', label: t('appointments.statusInProgress') },
  { value: 'completed', label: t('appointments.statusCompleted') },
  { value: 'cancelled', label: t('appointments.statusCancelled') },
  { value: 'no_show', label: t('appointments.statusNoShow') }
])
// Modal: barcha statuslar (qo'lda o'zgartirish uchun)
const statusOptions = computed(() => [
  { value: 'pending', label: t('appointments.statusPending') },
  { value: 'arrived', label: t('appointments.statusArrived') },
  { value: 'in_progress', label: t('appointments.statusInProgress') },
  { value: 'completed_paid', label: t('appointments.statusCompleted') },
  { value: 'completed_debt', label: t('appointments.statusDebt') },
  { value: 'cancelled', label: t('appointments.statusCancelled') },
  { value: 'no_show', label: t('appointments.statusNoShow') }
])

// Kunlik/Haftalik/Oylik sana oralig'i
const dateRange = computed(() => {
  const base = new Date(selectedDate.value)
  if (Number.isNaN(base.getTime())) return { start: selectedDate.value, end: selectedDate.value }

  if (viewMode.value === 'day') {
    return { start: toISODate(base), end: toISODate(base) }
  }

  if (viewMode.value === 'week') {
    const start = startOfWeek(base)
    const end = addDays(start, 6)
    return { start: toISODate(start), end: toISODate(end) }
  }

  // Month
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)
  return { start: toISODate(start), end: toISODate(end) }
})

const dateRangeLabel = computed(() => {
  if (dateRange.value.start === dateRange.value.end) {
    return formatDate(dateRange.value.start)
  }
  return `${formatDate(dateRange.value.start)} - ${formatDate(dateRange.value.end)}`
})

const filteredVisits = computed(() => {
  let result = visits.value

  if (selectedDoctor.value) {
    const doctorIdNum = Number(selectedDoctor.value)
    result = result.filter(v => Number(v.doctor_id) === doctorIdNum)
  }
  if (selectedStatus.value) {
    if (selectedStatus.value === 'completed') {
      result = result.filter(v => v.status === 'completed_paid' || v.status === 'completed_debt')
    } else {
      result = result.filter(v => v.status === selectedStatus.value)
    }
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(v => {
      const patient = patientsStore.items.find(p => Number(p.id) === Number(v.patient_id))
      const name = patient?.full_name?.toLowerCase() || ''
      const phone = patient?.phone || ''
      const medId = patient?.med_id ? String(patient.med_id) : ''
      return name.includes(query) || phone.includes(query) || medId.includes(query)
    })
  }

  return result
})

const allSelected = computed(() => filteredVisits.value.length > 0 && selectedIds.value.length === filteredVisits.value.length)

const loadVisits = async () => {
  loading.value = true
  try {
    const { start, end } = dateRange.value
    if (isAdmin.value) {
      visits.value = await visitsApi.getVisitsByDateRange(start, end)
    } else if (doctorId.value) {
      visits.value = await visitsApi.getVisitsByDoctorAndDateRange(doctorId.value, start, end)
    } else {
      visits.value = []
    }
  } catch (error) {
    console.error('Failed to load visits:', error)
    visits.value = []
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  createError.value = ''
  // Doktor uchun avtomatik to'ldirish
  if (!isAdmin.value && doctorId.value) {
    createForm.value.doctor_id = String(doctorId.value)
  } else {
    createForm.value.doctor_id = ''
  }
  // Bugungi sanani default qilish
  if (!createForm.value.date) {
    createForm.value.date = selectedDate.value || new Date().toISOString().split('T')[0]
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  // Formani tozalash
  createForm.value = {
    patient_id: '',
    doctor_id: isAdmin.value ? '' : String(doctorId.value || ''),
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    duration_minutes: 30,
    service_name: '',
    price: null,
    notes: '',
    room: '',
    channel: ''
  }
}

const openRescheduleModal = (visit = null) => {
  rescheduleError.value = ''
  const targets = visit ? [visit] : selectedVisits()
  rescheduleTargets.value = targets.filter(item => Number.isFinite(Number(item?.id)))
  if (rescheduleTargets.value.length === 0) {
    rescheduleError.value = t('appointments.errorNotFound')
    return
  }
  const first = rescheduleTargets.value[0]
  rescheduleForm.value = {
    date: first.date || selectedDate.value,
    start_time: first.start_time || '',
    duration_minutes: first.duration_minutes || 30,
    channel: first.channel || '',
    reason: ''
  }
  showRescheduleModal.value = true
}

const closeRescheduleModal = () => {
  showRescheduleModal.value = false
  rescheduleTargets.value = []
}

const openCompleteModal = (visit) => {
  completeError.value = ''
  completeTarget.value = visit
  completeForm.value = {
    price: visit.price || null,
    paid_amount: visit.paid_amount || null
  }
  showCompleteModal.value = true
}

const closeCompleteModal = () => {
  showCompleteModal.value = false
  completeTarget.value = null
}

const openStatusModal = (visit) => {
  statusError.value = ''
  statusTarget.value = visit
  statusValue.value = visit.status
  showStatusModal.value = true
}

const closeStatusModal = () => {
  showStatusModal.value = false
  statusTarget.value = null
  statusValue.value = ''
}

const applyStatusChange = async () => {
  if (!statusTarget.value || !statusValue.value) {
    statusError.value = t('appointments.errorSelectStatus')
    return
  }
  try {
    await updateStatus(statusTarget.value, statusValue.value)
    closeStatusModal()
  } catch (error) {
    console.error('Failed to change status:', error)
    statusError.value = t('appointments.errorStatus')
  }
}

const createAppointment = async () => {
  createError.value = ''
  loading.value = true

  // Doktor uchun avtomatik to'ldirish
  if (!isAdmin.value && doctorId.value && !createForm.value.doctor_id) {
    createForm.value.doctor_id = String(doctorId.value)
  }

  if (!createForm.value.patient_id || !createForm.value.doctor_id) {
    createError.value = t('appointments.errorSelectPatientDoctor')
    loading.value = false
    return
  }
  if (!createForm.value.date || !createForm.value.start_time) {
    createError.value = t('appointments.errorDateTimeRequired')
    return
  }

  const durationMinutes = Number(createForm.value.duration_minutes)
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    createError.value = 'Davomiylik (min) to\'g\'ri bo\'lishi kerak.'
    return
  }
  const endTime = buildEndTime(createForm.value.start_time, durationMinutes)
  const overlap = await hasOverlap({
    date: createForm.value.date,
    start_time: createForm.value.start_time,
    end_time: endTime,
    doctor_id: createForm.value.doctor_id,
    room: createForm.value.room
  })
  if (overlap) {
    createError.value = t('appointments.errorOverlap')
    loading.value = false
    return
  }

  try {
    const doctor = doctors.value.find(d => Number(d.id) === Number(createForm.value.doctor_id))
    await visitsApi.createVisit({
      patient_id: createForm.value.patient_id,
      doctor_id: createForm.value.doctor_id,
      doctor_name: doctor?.full_name || '',
      notes: createForm.value.notes,
      status: 'pending',
      price: createForm.value.price,
      service_name: createForm.value.service_name,
      date: createForm.value.date,
      start_time: createForm.value.start_time,
      end_time: endTime,
      duration_minutes: durationMinutes,
      room: createForm.value.room,
      channel: createForm.value.channel,
      updated_by: getActorLabel()
    })
    // Avtomatik Telegram: qabul tasdiqlandi
    const appointmentDateStr = `${formatDate(createForm.value.date)} ${createForm.value.start_time || ''}`
    await sendAppointmentConfirmed({
      patientId: createForm.value.patient_id,
      appointmentDate: appointmentDateStr,
      doctorName: doctor?.full_name || ''
    })
    toast.success(t('appointments.toastCreated'))
    closeCreateModal()
    await loadVisits()
  } catch (error) {
    console.error('Failed to create appointment:', error)
    createError.value = t('appointments.errorSave')
  } finally {
    loading.value = false
  }
}

const applyReschedule = async () => {
  rescheduleError.value = ''
  if (!rescheduleForm.value.date || !rescheduleForm.value.start_time) {
    rescheduleError.value = t('appointments.errorDateTimeRequired')
    return
  }

  const durationMinutes = Number(rescheduleForm.value.duration_minutes)
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    rescheduleError.value = 'Davomiylik (min) to\'g\'ri bo\'lishi kerak.'
    return
  }
  const endTime = buildEndTime(rescheduleForm.value.start_time, durationMinutes)
  for (const visit of rescheduleTargets.value) {
    const overlap = await hasOverlap({
      date: rescheduleForm.value.date,
      start_time: rescheduleForm.value.start_time,
      end_time: endTime,
      doctor_id: visit.doctor_id,
      room: visit.room,
      ignoreVisitId: visit.id
    })
    if (overlap) {
      rescheduleError.value = t('appointments.errorOverlapConflict')
      return
    }
  }

  try {
    const newDateStr = formatDate(rescheduleForm.value.date)
    const newTimeStr = rescheduleForm.value.start_time || ''
    for (const visit of rescheduleTargets.value) {
      await visitsApi.updateVisit(visit.id, {
        date: rescheduleForm.value.date,
        start_time: rescheduleForm.value.start_time,
        end_time: endTime,
        duration_minutes: durationMinutes,
        channel: rescheduleForm.value.channel,
        notes: visit.notes,
        updated_by: getActorLabel()
      })
      // Avtomatik Telegram: qabul qayta belgilandi
      const msg = `📅 Qabulingiz qayta belgilandi.\n\nSana: ${newDateStr}\nVaqt: ${newTimeStr}\n\nIltimos, yangi vaqtda keling.`
      await sendTelegramNotification({
        patientId: visit.patient_id,
        message: msg
      })
    }
    toast.success(t('appointments.toastRescheduled'))
    closeRescheduleModal()
    await loadVisits()
  } catch (error) {
    console.error('Failed to reschedule:', error)
    rescheduleError.value = t('appointments.errorReschedule')
  }
}

const updateStatus = async (visit, status) => {
  try {
    await visitsApi.updateVisit(visit.id, { status, updated_by: getActorLabel() })
    if (status === 'completed_paid' || status === 'completed_debt') {
      await patientsStore.editPatient(visit.patient_id, { status: 'completed' })
    }
    // Avtomatik Telegram: qabul bekor qilindi
    if (status === 'cancelled') {
      await sendAppointmentCanceled({ patientId: visit.patient_id, reason: '' })
    }
    await loadVisits()
  } catch (error) {
    console.error('Failed to update status:', error)
    toast.error(t('appointments.errorStatus'))
  }
}

const handleStatusUpdate = async (appointmentId) => {
  // Appointment ID bo'yicha status yangilash (Schedule view'dan chaqiriladi)
  const appointment = visits.value.find(v => v.id === appointmentId)
  if (!appointment) return

  // Qabula chiqarish
  await updateStatus(appointment, 'in_progress')
}

const completeVisit = async () => {
  if (!completeTarget.value) return
  completeError.value = ''

  const price = completeForm.value.price !== null ? Number(completeForm.value.price) : null
  const paidAmount = completeForm.value.paid_amount !== null ? Number(completeForm.value.paid_amount) : null
  const debt = price !== null ? price - (paidAmount || 0) : null

  try {
    const updateData = {
      price,
      paid_amount: paidAmount,
      debt_amount: debt > 0 ? debt : null,
      status: debt > 0 ? 'completed_debt' : 'completed_paid',
      updated_by: getActorLabel()
    }

    await visitsApi.updateVisit(completeTarget.value.id, updateData)
      // Bemor statusini 'completed' qilish (visit yakunlanganda)
      await patientsStore.editPatient(completeTarget.value.patient_id, { status: 'completed' })
    if (paidAmount && paidAmount > 0) {
      await syncPayment(completeTarget.value, paidAmount)
    }
    // Avtomatik Telegram: qarz qolganda qarz eslatmasi
    if (debt > 0) {
      await sendDebtReminder({
        patientId: completeTarget.value.patient_id,
        amount: debt,
        dueDate: ''
      })
    }
    toast.success(t('appointments.toastCompleted'))
    closeCompleteModal()
    await loadVisits()
  } catch (error) {
    console.error('Failed to complete visit:', error)
    completeError.value = t('appointments.errorComplete')
  }
}

const syncPayment = async (visit, paidAmount) => {
  try {
    const existing = await getPaymentsByVisitId(visit.id)
    const netPaid = existing.reduce((sum, entry) => {
      const amount = Number(entry.amount) || 0
      return sum + (entry.payment_type === 'refund' ? -amount : amount)
    }, 0)
    const diff = paidAmount - netPaid
    if (diff > 0) {
      await createPayment({
        visit_id: visit.id,
        patient_id: visit.patient_id,
        doctor_id: visit.doctor_id,
        amount: diff,
        payment_type: 'payment',
        method: 'cash',
        note: netPaid > 0 ? 'Qo\'shimcha to\'lov' : 'Tashrif to\'lovi'
      })
    }
  } catch (error) {
    console.error('Payment sync failed:', error)
  }
}

const bulkUpdateStatus = async (status) => {
  try {
    const toCancel = status === 'cancelled' ? visits.value.filter(v => selectedIds.value.includes(v.id)) : []
    for (const id of selectedIds.value) {
      await visitsApi.updateVisit(id, { status, updated_by: getActorLabel() })
    }
    // Avtomatik Telegram: bulk bekor qilishda har bir bemorga xabar
    if (status === 'cancelled') {
      for (const visit of toCancel) {
        await sendAppointmentCanceled({ patientId: visit.patient_id, reason: '' })
      }
    }
    clearSelected()
    await loadVisits()
  } catch (error) {
    console.error('Failed bulk status update:', error)
  }
}

const bulkChangeDoctor = async () => {
  if (!bulkDoctorId.value) return
  const doctor = doctors.value.find(d => Number(d.id) === Number(bulkDoctorId.value))
  try {
    for (const id of selectedIds.value) {
      await visitsApi.updateVisit(id, {
        doctor_id: Number(bulkDoctorId.value),
        doctor_name: doctor?.full_name || '',
        updated_by: getActorLabel()
      })
    }
    clearSelected()
    await loadVisits()
  } catch (error) {
    console.error('Failed bulk doctor change:', error)
  }
}

const toggleSelect = (id) => {
  const normalizedId = Number(id)
  if (!Number.isFinite(normalizedId)) return
  if (selectedIds.value.includes(normalizedId)) {
    selectedIds.value = selectedIds.value.filter(item => item !== normalizedId)
  } else {
    selectedIds.value.push(normalizedId)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredVisits.value
      .map(v => Number(v.id))
      .filter(id => Number.isFinite(id))
  }
}

const clearSelected = () => {
  selectedIds.value = []
  bulkDoctorId.value = ''
}

const selectedVisits = () => visits.value.filter(v => selectedIds.value.includes(Number(v.id)))

const exportAppointments = () => {
  const data = filteredVisits.value.map(visit => ({
    id: visit.id,
    patient_id: visit.patient_id,
    doctor_id: visit.doctor_id,
    date: visit.date,
    start_time: visit.start_time,
    duration_minutes: visit.duration_minutes,
    service_name: visit.service_name,
    price: visit.price,
    status: visit.status
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'appointments.json'
  a.click()
  URL.revokeObjectURL(url)
    toast.success(t('appointments.toastExportReady'))
}

const importAppointments = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const lines = text.split('\n').filter(Boolean)
  if (lines.length <= 1) {
    toast.error('CSV bo\'sh yoki noto\'g\'ri')
    return
  }
  const [headerLine, ...rows] = lines
  const headers = headerLine.split(',').map(h => h.trim())
  const required = ['patient_id', 'doctor_id', 'date', 'start_time', 'duration_minutes']
  if (!required.every(r => headers.includes(r))) {
    toast.error('CSV ustunlari yetarli emas')
    return
  }
  try {
    for (const row of rows) {
      const cells = row.split(',').map(c => c.trim())
      const payload = headers.reduce((acc, key, index) => {
        acc[key] = cells[index] || ''
        return acc
      }, {})
      const endTime = buildEndTime(payload.start_time, Number(payload.duration_minutes))
      await visitsApi.createVisit({
        patient_id: payload.patient_id,
        doctor_id: payload.doctor_id,
        date: payload.date,
        start_time: payload.start_time,
        end_time: endTime,
        duration_minutes: Number(payload.duration_minutes),
        service_name: payload.service_name || null,
        price: payload.price ? Number(payload.price) : null,
        notes: payload.notes || null,
        room: payload.room || null,
        channel: payload.channel || null,
        status: payload.status || 'pending',
        updated_by: getActorLabel()
      })
    }
    toast.success('Import yakunlandi')
    await loadVisits()
  } catch (error) {
    console.error('Import failed:', error)
    toast.error(t('appointments.errorImport'))
  } finally {
    event.target.value = ''
  }
}

// Bugungi sanaga o'tish
const setToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
}

// Sana navigatsiyasi (kunlik/haftalik/oylik bo'yicha)
const shiftDate = (direction) => {
  const base = new Date(selectedDate.value)
  if (Number.isNaN(base.getTime())) return

  let delta = 1
  if (viewMode.value === 'week') delta = 7
  if (viewMode.value === 'month') {
    const newDate = new Date(base.getFullYear(), base.getMonth() + direction, base.getDate())
    selectedDate.value = toISODate(newDate)
    return
  }

  const newDate = addDays(base, delta * direction)
  selectedDate.value = toISODate(newDate)
}

// Helper funksiyalar
const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const startOfWeek = (date) => {
  const day = date.getDay()
  const diff = date.getDate() - (day === 0 ? 6 : day - 1)
  return new Date(date.getFullYear(), date.getMonth(), diff)
}

const getPatientName = (patientId) => {
  const patient = patientsStore.items.find(p => Number(p.id) === Number(patientId))
  return patient?.full_name || `#${patientId}`
}

const getPatientPhone = (patientId) => {
  const patient = patientsStore.items.find(p => Number(p.id) === Number(patientId))
  return patient?.phone || ''
}

const getDoctorName = (doctorIdValue) => {
  const doctor = doctorsStore.items.find(d => Number(d.id) === Number(doctorIdValue))
  return doctor?.full_name || '-'
}

const getStatusLabel = (status) => getVisitStatusLabel(status)

const getStatusClass = (status) => {
  const colors = getVisitStatusColors(status)
  return `${colors.bgClass} ${colors.textClass}`
}

const getPaymentStatus = (visit) => {
  const price = Number(visit.price || 0)
  const paid = Number(visit.paid_amount || 0)
  if (visit.status === 'completed_debt') return 'debt'
  if (price === 0) return 'paid'
  if (paid >= price) return 'paid'
  if (paid > 0 && paid < price) return 'partial'
  return 'unpaid'
}

const getPaymentLabel = (visit) => {
  const status = getPaymentStatus(visit)
  if (status === 'paid') return t('appointments.paymentPaid')
  if (status === 'partial') return t('appointments.paymentPartial')
  if (status === 'debt') return t('appointments.paymentDebt')
  return t('appointments.paymentUnpaid')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatTimeRange = (visit) => {
  const start = visit.start_time || ''
  const end = visit.end_time || (visit.start_time ? buildEndTime(visit.start_time, visit.duration_minutes || 0) : '')
  if (!start) return '--'
  return end ? `${start} - ${end}` : start
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0).replace('UZS', 'so\'m')
}

const toISODate = (date) => date.toISOString().split('T')[0]

const buildEndTime = (startTime, durationMinutes) => {
  if (!startTime || !durationMinutes) return null
  const [hours, minutes] = startTime.split(':').map(Number)
  const total = hours * 60 + minutes + Number(durationMinutes)
  const endHours = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const endMinutes = String(total % 60).padStart(2, '0')
  return `${endHours}:${endMinutes}`
}

const hasOverlap = async ({ date, start_time, end_time, doctor_id, room, ignoreVisitId = null }) => {
  if (!date || !start_time || !end_time) return false
  const start = timeToMinutes(start_time)
  const end = timeToMinutes(end_time)
  const baseVisits = await getVisitsForDate(date, doctor_id)
  return baseVisits.some(visit => {
    if (ignoreVisitId && visit.id === ignoreVisitId) return false
    if (visit.date !== date) return false
    const sameDoctor = doctor_id && Number(visit.doctor_id) === Number(doctor_id)
    const sameRoom = room && visit.room && visit.room === room
    if (!sameDoctor && !sameRoom) return false
    const visitStart = timeToMinutes(visit.start_time || '00:00')
    const visitEnd = timeToMinutes(visit.end_time || visit.start_time || '00:00')
    return start < visitEnd && end > visitStart
  })
}

const getVisitsForDate = async (date, doctorIdValue) => {
  const { start, end } = dateRange.value
  if (date >= start && date <= end) {
    return visits.value
  }

  try {
    if (doctorIdValue) {
      return await visitsApi.getVisitsByDoctorAndDateRange(doctorIdValue, date, date)
    }
    return await visitsApi.getVisitsByDateRange(date, date)
  } catch (error) {
    console.error('Failed to load visits for overlap:', error)
    return visits.value
  }
}

const timeToMinutes = (value) => {
  if (!value) return 0
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

const getActorLabel = () => {
  if (isAdmin.value) return 'admin'
  return authStore.user?.id ? `doctor:${authStore.user.id}` : 'doctor'
}

onMounted(async () => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('resize', onMenuViewportChange)
  window.addEventListener('scroll', onMenuViewportChange, true)
  const patientLoad = isAdmin.value
    ? patientsStore.fetchPatients()
    : (doctorId.value ? patientsStore.fetchPatientsByDoctor(doctorId.value) : patientsStore.fetchPatients())

  await Promise.all([
    doctorsStore.fetchAll(),
    patientLoad
  ])
  await loadVisits()
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('resize', onMenuViewportChange)
  window.removeEventListener('scroll', onMenuViewportChange, true)
})

watch([viewMode, selectedDate], loadVisits)
</script>
