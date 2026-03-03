<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <!-- Header: solo uchun sodda va chiroyli -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isSolo ? t('patients.soloTitle') : (isAdmin ? t('patients.allPatients') : t('patients.myPatients')) }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            {{ isSolo ? t('patients.soloSubtitle') : (isAdmin ? t('patients.allPatientsSubtitle') : t('patients.myPatientsSubtitle')) }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Export: solo uchun yashirin -->
          <button
            v-if="isAdmin && !isSolo"
            @click="exportPatients"
            class="hidden items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:inline-flex"
          >
            <ArrowDownTrayIcon class="h-5 w-5" />
            {{ t('patients.export') }}
          </button>
          <!-- Desktop Button -->
          <button
            @click="openAddModal"
            class="hidden md:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-600 px-5 py-3 font-medium text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg touch-target-lg"
          >
            <PlusIcon class="h-5 w-5" />
            {{ t('patients.newPatient') }}
          </button>
        </div>
      </div>

      <!-- Qidiruv va filter: solo uchun sodda -->
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center shrink-0">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-500" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('patients.searchPlaceholder')"
              class="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            v-if="isAdmin && !isSolo"
            v-model="selectedDoctor"
            class="rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{{ t('patients.allDoctors') }}</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.full_name }}
            </option>
          </select>
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{{ t('patients.allStatuses') }}</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="patientsStore.loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>

      <div v-else class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead class="sticky top-0 bg-gray-50">
              <tr>
                <!-- ID: solo uchun yashirin (joy tejash) -->
                <th v-if="!isSolo" class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  ID
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.fullName') }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.phone') }}
                </th>
                <!-- Doktor ustuni: faqat admin uchun (solo o'zi bitta) -->
                <th v-if="isAdmin && !isSolo" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.doctor') }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.lastExam') }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.status') }}
                </th>
                <th v-if="isAdmin && !isSolo" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.lastVisit') }}
                </th>
                <th v-if="isAdmin && !isSolo" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Oxirgi to'lov
                </th>
                <th v-if="isAdmin && !isSolo" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Qarzdorlik
                </th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="patient in filteredPatients"
                :key="patient.id"
                @click="goToPatientDetail(patient.id)"
                class="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td v-if="!isSolo" class="px-6 py-4" @click.stop>
                  <span class="text-sm font-mono text-gray-500">#{{ patient.id }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                      {{ getInitials(patient.full_name) }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ patient.full_name }}</p>
                      <p class="text-xs text-gray-500">{{ formatDate(patient.birth_date) }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ patient.phone }}</span>
                </td>
                <td v-if="isAdmin && !isSolo" class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ patient.doctor_name || '-' }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ formatDate(patient.last_visit) || '-' }}</span>
                </td>
                <td class="px-6 py-4">
                  <PatientStatusBadge :status="getPatientRealStatus(patient)" />
                </td>
                <td v-if="isAdmin && !isSolo" class="px-6 py-4">
                  <span v-if="getLastVisitCompletedTime(patient.id)" class="text-xs text-gray-600">
                    {{ new Date(getLastVisitCompletedTime(patient.id)).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td v-if="isAdmin && !isSolo" class="px-6 py-4">
                  <span v-if="getLastPaymentAmount(patient.id) > 0" class="text-xs font-medium text-green-600">
                    {{ getLastPaymentAmount(patient.id).toLocaleString('uz-UZ') }} so'm
                  </span>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td v-if="isAdmin && !isSolo" class="px-6 py-4">
                  <span v-if="getPatientDebtAmount(patient.id) > 0" class="text-xs font-medium text-red-600">
                    {{ getPatientDebtAmount(patient.id).toLocaleString('uz-UZ') }} so'm
                  </span>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td class="px-6 py-4" @click.stop>
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click.stop="openEditModal(patient)"
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      :title="t('patients.edit')"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    <button
                      v-if="isAdmin"
                      @click.stop="confirmDelete(patient)"
                      class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      :title="t('patients.delete')"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile: Optimized Card Layout -->
        <div class="md:hidden space-y-3 pb-20">
          <div
            v-for="patient in filteredPatients"
            :key="patient.id"
            class="mobile-list-item"
            @click="goToPatientDetail(patient.id)"
          >
            <div class="flex items-start gap-3 sm:gap-4">
              <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0 shadow-md">
                {{ getInitials(patient.full_name) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-base sm:text-lg font-semibold text-gray-900 truncate">{{ patient.full_name }}</p>
                    <a
                      :href="'tel:' + patient.phone"
                      @click.stop
                      class="text-sm sm:text-base text-primary-600 hover:underline touch-manipulation mt-0.5 inline-block"
                    >
                      {{ patient.phone }}
                    </a>
                  </div>
                  <PatientStatusBadge :status="getPatientRealStatus(patient)" class="flex-shrink-0" />
                </div>
                <p v-if="isAdmin && !isSolo" class="text-xs text-gray-500 mt-1">
                  {{ t('patients.assignedDoctor') }}: {{ patient.doctor_name || '-' }}
                </p>
                <div class="mt-3 pt-3 border-t border-gray-100">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs sm:text-sm text-gray-500">
                      {{ t('patients.last') }}: {{ formatDate(patient.last_visit) || '-' }}
                    </span>
                  </div>
                  <!-- Mobile Actions - Larger touch targets -->
                  <div class="flex items-center gap-2" @click.stop>
                    <a
                      :href="'tel:' + patient.phone"
                      class="mobile-action-btn text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 touch-manipulation flex items-center justify-center"
                      :title="t('patients.call')"
                    >
                      <PhoneIcon class="w-5 h-5" />
                    </a>
                    <button
                      v-if="isAdmin"
                      @click.stop="confirmDelete(patient)"
                      class="mobile-action-btn text-red-700 bg-red-50 hover:bg-red-100 active:scale-95 touch-manipulation flex items-center justify-center"
                      :title="t('patients.delete')"
                    >
                      <TrashIcon class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state: solo uchun chiroyli va tushunarli -->
        <div v-if="filteredPatients.length === 0 && !patientsStore.loading" class="flex flex-col items-center justify-center py-16 px-6">
          <div class="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <UsersIcon class="h-12 w-12 text-gray-400" />
          </div>
          <p class="mt-5 text-lg font-medium text-gray-900">{{ t('patients.noPatients') }}</p>
          <p v-if="isSolo" class="mt-2 max-w-sm text-center text-sm text-gray-500">
            {{ t('patients.emptyHint') }}
          </p>
          <button
            v-if="isAdmin"
            @click="openAddModal"
            class="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-medium text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg"
          >
            <PlusIcon class="h-5 w-5" />
            {{ t('patients.addNewPatient') }}
          </button>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p class="text-sm text-gray-500">
            {{ t('patients.total') }}: <span class="font-semibold text-gray-900">{{ filteredPatients.length }}</span> {{ t('patients.patientsCount') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Patient Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="closeModal"
        >
          <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">
                  {{ isEditing ? t('patients.editPatient') : t('patients.newPatient') }}
                </h2>
                <p class="text-sm text-gray-500">
                  {{ isEditing ? t('patients.editSubtitle') : t('patients.createSubtitle') }}
                </p>
              </div>
              <button
                @click="closeModal"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body: majburiy birinchi, tushunarli -->
            <div class="p-6 space-y-5">
              <!-- Asosiy: Ism va Telefon -->
              <div class="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  {{ t('patients.requiredFields') }}
                </p>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-gray-900">
                      {{ t('patients.fullName') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="patientForm.full_name"
                      type="text"
                      autofocus
                      class="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      :placeholder="t('patients.fullNamePlaceholder')"
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-gray-900">
                      {{ t('patients.phone') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="patientForm.phone"
                      @focus="ensurePhonePrefix"
                      @input="handlePhoneInput"
                      type="tel"
                      inputmode="tel"
                      class="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      :placeholder="t('patients.phonePlaceholder')"
                    />
                  </div>
                </div>
              </div>

              <!-- Qo'shimcha ma'lumotlar -->
              <div class="space-y-4">
                <p class="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {{ t('patients.optionalFields') }}
                </p>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('patients.birthDate') }}</label>
                  <input
                    v-model="patientForm.birth_date"
                    type="date"
                    class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('patients.gender') }}</label>
                  <select
                    v-model="patientForm.gender"
                    class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{{ t('patients.select') }}</option>
                    <option value="male">{{ t('patients.genderMale') }}</option>
                    <option value="female">{{ t('patients.genderFemale') }}</option>
                  </select>
                </div>
                <!-- Manzil: Toshkent sh./vil. → Tuman → Qolgan joylar -->
                <div class="sm:col-span-2">
                  <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('patients.address') }}</label>
                  <select
                    v-model="patientForm.region"
                    class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @change="patientForm.district = ''"
                  >
                    <option v-for="r in regionOptions" :key="r.value" :value="r.value">
                      {{ r.value ? t(r.label) : t('patients.regionSelect') }}
                    </option>
                  </select>
                  <select
                    v-if="patientForm.region"
                    v-model="patientForm.district"
                    class="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{{ t('patients.districtSelect') }}</option>
                    <option v-for="d in districtOptions" :key="d" :value="d">{{ d }}</option>
                  </select>
                  <input
                    v-model="patientForm.address_detail"
                    type="text"
                    class="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    :placeholder="t('patients.addressDetailPlaceholder')"
                  />
                  <p class="mt-1 text-xs text-gray-500">{{ t('patients.addressHint') }}</p>
                </div>
                <!-- Doktor: solo uchun yashirin (avtomatik) -->
                <div v-if="!isSolo" class="sm:col-span-2">
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    {{ t('patients.assignedDoctor') }}
                    <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="patientForm.doctor_id"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @change="updateDoctorName"
                  >
                    <option value="">{{ t('patients.select') }}</option>
                    <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                      {{ doctor.full_name }}
                      <span v-if="doctor.specialization"> — {{ doctor.specialization }}</span>
                    </option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500">{{ t('patients.assignedDoctorHint') }}</p>
                </div>
                <!-- Status: sodda select -->
                <div class="sm:col-span-2">
                  <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('patients.status') }}</label>
                  <select
                    v-model="patientForm.status"
                    class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                      {{ status.label }}
                    </option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500">{{ t('patients.defaultQueueNote') }}</p>
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('patients.notes') }}</label>
                  <textarea
                    v-model="patientForm.notes"
                    rows="2"
                    class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    :placeholder="t('patients.notesPlaceholder')"
                  />
                </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-100 bg-white p-6">
              <button
                type="button"
                @click="closeModal"
                class="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {{ t('patients.cancel') }}
              </button>
              <button
                type="button"
                @click="savePatient"
                :disabled="patientsStore.loading"
                class="rounded-xl bg-gradient-to-r from-primary-500 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                {{ patientsStore.loading ? t('patients.saving') : t('patients.save') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Patient Profile Modal (with tabs: MED-ID, Odontogram, Visits) -->
    <PatientProfileModal
      :show="showViewModal"
      :patient="viewingPatient"
      :is-admin="isAdmin"
      :doctor-id="authStore.userId"
      :doctor-name="currentDoctorName"
      @close="showViewModal = false"
      @edit="handleEditFromProfile"
    />

    <!-- Mobile FAB -->
    <MobileFAB
      :icon="PlusIcon"
      :label="t('patients.newPatient')"
      @click="openAddModal"
      class="md:hidden"
    />

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showDeleteModal = false"
        >
          <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up">
            <div class="p-6 text-center">
              <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon class="w-8 h-8 text-red-600" />
              </div>
              <h3 class="mt-4 text-lg font-semibold text-gray-900">{{ t('patients.deleteTitle') }}</h3>
              <p class="mt-2 text-sm text-gray-500">
                <span class="font-medium text-gray-700">{{ deletingPatient?.full_name }}</span>
                {{ t('patients.deleteQuestion') }}
                {{ t('patients.deleteWarning') }}
              </p>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                @click="showDeleteModal = false"
                class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {{ t('patients.cancel') }}
              </button>
              <button
                @click="deletePatientConfirmed"
                :disabled="patientsStore.loading"
                class="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {{ patientsStore.loading ? t('patients.deleting') : t('patients.delete') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import PatientProfileModal from '@/components/patients/PatientProfileModal.vue'
import PatientStatusBadge from '@/components/ui/PatientStatusBadge.vue'
import MobileFAB from '@/components/shared/MobileFAB.vue'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { usePatientsStore } from '@/stores/patients'
import { useToast } from '@/composables/useToast'
import * as visitsApi from '@/api/visitsApi'
import { PATIENT_STATUSES, getPatientStatusLabel, normalizePatientStatus } from '@/constants/patientStatus'
import { TASHKENT_OPTIONS, TASHKENT_CITY_DISTRICTS, TASHKENT_REGION_DISTRICTS } from '@/constants/regions'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
} from '@heroicons/vue/24/outline'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const patientsStore = usePatientsStore()
const toast = useToast()
const { t } = useI18n()

const isAdmin = computed(() => authStore.userRole === 'admin' || authStore.userRole === 'solo')
const isSolo = computed(() => authStore.userRole === 'solo')

// Doktor ID ni olish
const getCurrentDoctorId = () => {
  if (isAdmin.value) return null
  if (authStore.user?.id) return authStore.user.id
  if (authStore.userEmail) {
    const doctor = doctorsStore.items.find(item => item.email === authStore.userEmail || item.phone === authStore.userEmail)
    return doctor?.id || null
  }
  return null
}

// Current doctor name (for odontogram and modal)
const currentDoctorName = computed(() => {
  if (authStore.userRole === 'solo') return authStore.user?.full_name || ''
  if (authStore.userRole === 'admin') return t('role.admin')
  const doctorId = getCurrentDoctorId()
  if (!doctorId) return ''
  const doctor = doctorsStore.items.find(d => Number(d.id) === Number(doctorId))
  return doctor?.full_name || ''
})

// Search & Filter
const searchQuery = ref('')
const selectedDoctor = ref('')
const selectedStatus = ref('')

// Modals
const showModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingPatientId = ref(null)
const viewingPatient = ref(null)
const deletingPatient = ref(null)
const patientVisits = ref({}) // { patientId: visit }

const regionOptions = TASHKENT_OPTIONS

const districtOptions = computed(() => {
  const r = patientForm.value?.region || ''
  if (r === 'Toshkent sh.') return TASHKENT_CITY_DISTRICTS
  if (r === 'Toshkent vil.') return TASHKENT_REGION_DISTRICTS
  return []
})

// Form
const initialFormState = {
  full_name: '',
  phone: '+998',
  birth_date: '',
  gender: '',
  address: '',
  region: '',
  district: '',
  address_detail: '',
  doctor_id: '',
  doctor_name: '',
  status: PATIENT_STATUSES.WAITING,
  notes: '',
}
const patientForm = ref({ ...initialFormState })

// Doctors list
const doctors = computed(() => doctorsStore.items)

const statusOptions = computed(() => {
  const values = [
    PATIENT_STATUSES.WAITING,
    PATIENT_STATUSES.IN_CONSULTATION,
    PATIENT_STATUSES.COMPLETED
  ]

  return values.map(value => ({
    value,
    label: getPatientStatusLabel(value)
  }))
})

// Filtered patients
const filteredPatients = computed(() => {
  let result = patientsStore.items

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.full_name.toLowerCase().includes(query) ||
      p.phone.includes(query)
    )
  }

  if (selectedDoctor.value) {
    result = result.filter(p => p.doctor_id === selectedDoctor.value || p.doctor_id === Number(selectedDoctor.value))
  }

  if (selectedStatus.value) {
    result = result.filter(p => normalizePatientStatus(p.status) === selectedStatus.value)
  }

  return result
})

// Helpers
const getInitials = (name) => {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Bemorning haqiqiy statusini oxirgi visitdan olish
const getPatientRealStatus = (patient) => {
  const visit = patientVisits.value[patient.id]
  if (!visit || !visit.status) {
    return normalizePatientStatus(patient.status || PATIENT_STATUSES.WAITING)
  }

  // Visit statusidan bemor statusini aniqlash
  const visitStatus = visit.status
  if (visitStatus === 'completed_debt') {
    return 'debt' // Qarzdor statusi
  }
  if (visitStatus === 'completed_paid') {
    return PATIENT_STATUSES.COMPLETED
  }
  if (visitStatus === 'in_progress' || visitStatus === 'arrived') {
    return PATIENT_STATUSES.IN_CONSULTATION
  }
  // pending, cancelled, no_show
  return PATIENT_STATUSES.WAITING
}

// Bemor qarzdorlik summasi
const getPatientDebtAmount = (patientId) => {
  const visit = patientVisits.value[patientId]
  if (!visit || visit.status !== 'completed_debt') return 0
  return Number(visit.debt_amount) || 0
}

// Oxirgi tashrif yakunlanish vaqtini olish
const getLastVisitCompletedTime = (patientId) => {
  const visit = patientVisits.value[patientId]
  if (!visit) return null

  // Visit'dagi tugallangan vaqt fieldlarini tekshirish
  if (visit.completed_at) return visit.completed_at
  if (visit.end_time) return visit.end_time
  if (visit.updated_at && (visit.status === 'completed_paid' || visit.status === 'completed_debt')) {
    return visit.updated_at
  }
  return null
}

// Oxirgi to'lov summasi
const getLastPaymentAmount = (patientId) => {
  const visit = patientVisits.value[patientId]
  if (!visit) return null
  return visit.paid_amount || 0
}

// Bemorlar uchun visit ma'lumotlarini yuklash (batch)
const loadPatientVisits = async (doctorId = null) => {
  try {
    const visitsMap = {}
    const visits = doctorId
      ? await visitsApi.getVisitsByDoctorId(doctorId)
      : await visitsApi.listVisits('order=created_at.desc')

    visits.forEach((visit) => {
      const patientId = Number(visit.patient_id)
      if (!visitsMap[patientId]) {
        visitsMap[patientId] = visit
      }
    })

    patientVisits.value = visitsMap
  } catch (error) {
    console.error('Failed to load patient visits:', error)
  }
}

const updateDoctorName = () => {
  const doctor = doctors.value.find(d => d.id === patientForm.value.doctor_id || d.id === Number(patientForm.value.doctor_id))
  patientForm.value.doctor_name = doctor?.full_name || ''
}

const PHONE_PREFIX = '+998'

const normalizeUzPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return PHONE_PREFIX

  let localDigits = digits
  if (localDigits.startsWith('998')) {
    localDigits = localDigits.slice(3)
  } else if (localDigits.startsWith('0')) {
    localDigits = localDigits.slice(1)
  }

  localDigits = localDigits.slice(0, 9)
  return `${PHONE_PREFIX}${localDigits}`
}

const formatUzPhone = (value) => {
  const normalized = normalizeUzPhone(value)
  const local = normalized.slice(4)

  const part1 = local.slice(0, 2)
  const part2 = local.slice(2, 5)
  const part3 = local.slice(5, 7)
  const part4 = local.slice(7, 9)

  const parts = [part1, part2, part3, part4].filter(Boolean)
  return parts.length > 0 ? `${PHONE_PREFIX} ${parts.join(' ')}` : PHONE_PREFIX
}

const ensurePhonePrefix = () => {
  patientForm.value.phone = formatUzPhone(patientForm.value.phone)
}

const handlePhoneInput = () => {
  patientForm.value.phone = formatUzPhone(patientForm.value.phone)
}

// Modal Actions
const openAddModal = () => {
  isEditing.value = false
  editingPatientId.value = null
  patientForm.value = { ...initialFormState }

  // Solo doktor: avtomatik o'zini doktor sifatida tayinlash
  if (isSolo.value && authStore.user?.id) {
    patientForm.value.doctor_id = authStore.user.id
    patientForm.value.doctor_name = authStore.user.full_name || ''
  } else if (!isAdmin.value) {
    // Oddiy doktor uchun avtomatik to'ldirish
    const currentDoctorId = getCurrentDoctorId()
    if (currentDoctorId) {
      patientForm.value.doctor_id = String(currentDoctorId)
      const doctor = doctors.value.find(d => Number(d.id) === Number(currentDoctorId))
      if (doctor) patientForm.value.doctor_name = doctor.full_name
    }
  }

  showModal.value = true
}

const openEditModal = (patient) => {
  isEditing.value = true
  editingPatientId.value = patient.id
  const addr = (patient.address || '').trim()
  const parts = addr ? addr.split(/\s*,\s*/) : []
  let region = ''
  let district = ''
  let detail = ''

  if (parts.length >= 1 && (parts[0] === 'Toshkent sh.' || parts[0] === 'Toshkent vil.')) {
    region = parts[0]
    const districts = region === 'Toshkent sh.' ? TASHKENT_CITY_DISTRICTS : TASHKENT_REGION_DISTRICTS
    if (parts.length >= 2 && districts.includes(parts[1])) {
      district = parts[1]
      detail = parts.slice(2).join(', ')
    } else {
      detail = parts.slice(1).join(', ')
    }
  } else if (addr) {
    detail = addr
  }

  patientForm.value = {
    full_name: patient.full_name || '',
    phone: patient.phone || '',
    birth_date: patient.birth_date || '',
    gender: patient.gender || '',
    address: addr,
    region,
    district,
    address_detail: detail,
    doctor_id: patient.doctor_id || '',
    doctor_name: patient.doctor_name || '',
    status: normalizePatientStatus(patient.status),
    notes: patient.notes || '',
  }
  showModal.value = true
}

const handleEditFromProfile = (patient) => {
  showViewModal.value = false
  openEditModal(patient)
}

const closeModal = () => {
  showModal.value = false
  patientForm.value = { ...initialFormState }
  isEditing.value = false
  editingPatientId.value = null
}

const goToPatientDetail = (patientId) => {
  // ID ni number formatga o'tkazish (Supabase'da ID number)
  const numId = Number(patientId)
  console.log('Navigating to patient detail:', { original: patientId, converted: numId, type: typeof numId })
  router.push(`/patients/${numId}`)
}

const confirmDelete = (patient) => {
  deletingPatient.value = patient
  showDeleteModal.value = true
}

const buildAddress = () => {
  const r = patientForm.value.region || ''
  const tuman = patientForm.value.district || ''
  const rest = (patientForm.value.address_detail || '').trim()
  const parts = [r, tuman, rest].filter(Boolean)
  return parts.join(', ')
}

// CRUD Actions
const savePatient = async () => {
  if (!patientForm.value.full_name || !patientForm.value.phone) {
    toast.error('Iltimos, majburiy maydonlarni to\'ldiring')
    return
  }

  if (!isSolo.value && !patientForm.value.doctor_id) {
    toast.error('Klinika rejimida bemorga doktor tanlash majburiy')
    return
  }

  const payload = { ...patientForm.value, address: buildAddress() }
  payload.phone = normalizeUzPhone(patientForm.value.phone)
  payload.birth_date = patientForm.value.birth_date || null
  delete payload.region
  delete payload.district
  delete payload.address_detail

  try {
    if (isEditing.value && editingPatientId.value) {
      await patientsStore.editPatient(editingPatientId.value, payload)
      toast.success(t('patients.toastUpdated'))
    } else {
      const newPatient = await patientsStore.addPatient(payload)
      toast.success(t('patients.toastCreated'))

      // Yangi bemor uchun visit ma'lumotlarini yuklash
      if (newPatient && newPatient.id) {
        const visits = await visitsApi.getVisitsByPatientId(newPatient.id)
        if (visits && visits.length > 0) {
          patientVisits.value[newPatient.id] = visits[0]
        }
      }
    }
    closeModal()
  } catch (err) {
    console.error('Save error:', err)
    toast.error('Xatolik yuz berdi')
  }
}

const deletePatientConfirmed = async () => {
  if (!deletingPatient.value) return

  try {
    await patientsStore.removePatient(deletingPatient.value.id)
    showDeleteModal.value = false
    deletingPatient.value = null
  } catch (err) {
    console.error('Delete error:', err)
  }
}

const exportPatients = () => {
  const data = patientsStore.items
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'patients.json'
  a.click()
  URL.revokeObjectURL(url)
  toast.success(t('patients.toastLoaded'))
}

// Lifecycle
onMounted(async () => {
  await doctorsStore.fetchAll()

  // Check if we should open the modal from query parameter
  if (route.query.action === 'add') {
    openAddModal()
    // Remove query parameter from URL
    router.replace({ query: {} })
  }

  let doctorId = null
  if (!isAdmin.value) {
    if (authStore.user?.id) {
      doctorId = authStore.user.id
    } else if (authStore.userEmail) {
      const doctor = doctorsStore.items.find(item => item.email === authStore.userEmail)
      doctorId = doctor?.id || null
    }
  }

  if (isAdmin.value) {
    await patientsStore.fetchPatients()
    await loadPatientVisits()
  } else if (doctorId) {
    await patientsStore.fetchPatientsByDoctor(doctorId)
    await loadPatientVisits(doctorId)
  } else {
    await patientsStore.fetchPatients()
    await loadPatientVisits()
  }

  // Tolovlar bo'limida bemor statusi o'zgarsa jadvalda refresh bo'lishi uchun
  window.addEventListener('patient-status-updated', async () => {
    await loadPatientVisits()
  })

})
</script>

<style scoped>
.status-dropdown::-webkit-scrollbar {
  width: 6px;
}

.status-dropdown::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.status-dropdown::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.status-dropdown::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
