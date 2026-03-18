<template>
  <div class="space-y-6">
    <!-- Summary cards + Actions: mobil — kartalar 2x2, tugmalar pastda; desktop — bir qatorda -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 flex-1 min-w-0">
        <div class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('patientPayments.totalPayments') }}</p>
          <p class="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-primary-600" :title="formatCurrency(totalPayments)">{{ formatCurrency(totalPayments) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('patientPayments.refunds') }}</p>
          <p class="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-rose-600">{{ formatCurrency(totalRefunds) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('patientPayments.netIncome') }}</p>
          <p class="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-emerald-600">{{ formatCurrency(netIncome) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('patientPayments.totalServices') }}</p>
          <p class="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-gray-900" :title="formatCurrency(totalServices)">{{ formatCurrency(totalServices) }}</p>
        </div>
      </div>

      <!-- Desktop: tugmalar — To'lov qo'shish asosiy harakat -->
      <div class="hidden md:flex md:flex-wrap items-center justify-end gap-2 shrink-0 ml-4">
        <button
          v-if="canManagePayments"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 shadow-md transition-colors"
          @click="openCreateModal"
        >
          <BanknotesIcon class="w-5 h-5" />
          {{ t('patientPayments.addPayment') }}
        </button>
        <button
          v-if="canManagePayments"
          class="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
          @click="openDiscountModal"
        >
          <TagIcon class="w-5 h-5" />
          {{ t('patientPayments.addDiscount') }}
        </button>
        <button
          v-if="canManagePayments && lastCompletionSummary"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
          @click="printLastCompletion"
        >
          <PrinterIcon class="w-5 h-5" />
          Pechat
        </button>
        <button
          v-if="canManagePayments && hasIncompleteVisits"
          class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
          @click="completeAllVisits"
          :disabled="completingAll"
        >
          <svg v-if="!completingAll" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          {{ completingAll ? t('patientPayments.completing') : t('patientPayments.yakunlash') }}
        </button>
      </div>

      <!-- Mobil: To'lov qo'shish birinchi — asosiy harakat -->
      <div v-if="canManagePayments" class="md:hidden space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="touch-target-lg inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md active:scale-[0.98] active:shadow-lg transition-all"
            @click="openCreateModal"
          >
            <BanknotesIcon class="w-5 h-5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ t('patientPayments.addPayment') }}</span>
          </button>
          <button
            type="button"
            class="touch-target-lg inline-flex items-center justify-center gap-2 rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-3.5 text-sm font-semibold text-violet-700 active:bg-violet-100 active:scale-[0.98] transition-all shadow-sm"
            @click="openDiscountModal"
          >
            <TagIcon class="w-5 h-5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ t('patientPayments.addDiscount') }}</span>
          </button>
        </div>
        <button
          v-if="lastCompletionSummary"
          type="button"
          class="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 active:bg-sky-100 active:scale-[0.99] transition-all"
          @click="printLastCompletion"
        >
          <PrinterIcon class="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Pechat</span>
        </button>
        <button
          v-if="hasIncompleteVisits"
          class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-60"
          @click="completeAllVisits"
          :disabled="completingAll"
        >
          <svg v-if="!completingAll" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <div v-else class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>{{ completingAll ? t('patientPayments.completing') : t('patientPayments.yakunlash') }}</span>
        </button>
      </div>
    </div>

    <div class="md:hidden space-y-3">
      <div
        v-if="loading"
        class="rounded-xl border border-gray-200 bg-white p-4 text-sm text-slate-500 shadow-sm"
      >
        {{ t('patientPayments.loading') }}
      </div>
      <div
        v-else-if="payments.length === 0"
        class="rounded-xl border border-gray-200 bg-white p-4 text-sm text-slate-500 shadow-sm"
      >
        {{ t('patientPayments.noPayments') }}
      </div>
      <div
        v-for="entry in payments"
        :key="`mobile-payment-${entry.id}`"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs text-slate-500">{{ formatDate(entry.paid_at) }}</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">#{{ entry.visit_id || '-' }}</p>
          </div>
          <span :class="['text-xs font-semibold px-2 py-1 rounded-full', getTypeClass(entry)]">
            {{ getTypeDisplayLabel(entry) }}
          </span>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.amount') }}</p>
            <p class="font-semibold text-slate-900">{{ formatCurrency(entry.amount) }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.method') }}</p>
            <p class="font-medium text-slate-700">{{ entry.method || '-' }}</p>
          </div>
        </div>
        <div class="mt-2 text-sm text-slate-700">
          <p class="text-xs text-slate-500">{{ t('patientPayments.note') }}</p>
          <p>{{ getDisplayNote(entry) }}</p>
          <p v-if="getDiscountPercent(entry)" class="mt-1 text-xs font-semibold text-violet-700">
            {{ getDiscountPercent(entry) }}%
          </p>
        </div>
        <div v-if="canManagePayments" class="mt-3 flex items-center gap-4 text-sm">
          <button class="font-medium text-primary-600" @click="openEditModal(entry)">
            {{ t('patientPayments.edit') }}
          </button>
          <button class="font-medium text-rose-600" @click="confirmDelete(entry)">
            {{ t('patientPayments.delete') }}
          </button>
        </div>
      </div>
    </div>

    <div class="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('patientPayments.date') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.visitId') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.type') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.amount') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.method') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.note') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-500" colspan="7">{{ t('patientPayments.loading') }}</td>
          </tr>
          <tr v-else-if="payments.length === 0">
            <td class="px-4 py-4 text-slate-500" colspan="7">{{ t('patientPayments.noPayments') }}</td>
          </tr>
          <tr v-for="entry in payments" :key="entry.id" class="bg-white">
            <td class="px-4 py-3 text-slate-700">{{ formatDate(entry.paid_at) }}</td>
            <td class="px-4 py-3 text-slate-700">#{{ entry.visit_id }}</td>
            <td class="px-4 py-3 text-slate-700">
              <span :class="getTypeClass(entry)">
                {{ getTypeDisplayLabel(entry) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-700">
              {{ formatCurrency(entry.amount) }}
            </td>
            <td class="px-4 py-3 text-slate-700">{{ entry.method || '-' }}</td>
            <td class="px-4 py-3 text-slate-700">
              <div>{{ getDisplayNote(entry) }}</div>
              <span
                v-if="getDiscountPercent(entry)"
                class="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700"
              >
                {{ getDiscountPercent(entry) }}%
              </span>
            </td>
            <td class="px-4 py-3 text-slate-700">
              <div v-if="canManagePayments" class="flex items-center gap-2">
                <button class="text-primary-600 hover:text-primary-700 text-sm" @click="openEditModal(entry)">
                  {{ t('patientPayments.edit') }}
                </button>
                <button class="text-rose-600 hover:text-rose-700 text-sm" @click="confirmDelete(entry)">
                  {{ t('patientPayments.delete') }}
                </button>
              </div>
              <span v-else class="text-slate-400 text-sm">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-3">
      <div
        v-if="servicesLoading"
        class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500"
      >
        {{ t('patientPayments.loading') }}
      </div>
      <div
        v-else-if="services.length === 0"
        class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500"
      >
        {{ t('patientPayments.noServices') }}
      </div>
      <div
        v-for="service in services"
        :key="`mobile-service-${service.id}`"
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.visitId') }}</p>
            <p class="text-sm font-semibold text-slate-900">#{{ service.visit_id }}</p>
          </div>
          <div v-if="canManagePayments">
            <button
              type="button"
              class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
              :disabled="serviceDeleting === service.id"
              :title="t('patientPayments.delete')"
              @click="confirmDeleteService(service)"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p class="mt-2 text-sm font-medium text-slate-800">{{ service.service_name }}</p>
        <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.tooth') }}</p>
            <p class="text-slate-700">{{ service.tooth_id ? `#${service.tooth_id}` : '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.price') }}</p>
            <p class="font-semibold text-slate-900">{{ formatCurrency(service.price) }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.doctor') }}</p>
            <p class="text-slate-700">{{ service.performed_by || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.date') }}</p>
            <p class="text-slate-700">{{ formatDate(service.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('patientPayments.visitId') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.services') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.tooth') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.price') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.doctor') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.date') }}</th>
            <th v-if="canManagePayments" class="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="servicesLoading">
            <td class="px-4 py-4 text-slate-500" :colspan="canManagePayments ? 7 : 6">{{ t('patientPayments.loading') }}</td>
          </tr>
          <tr v-else-if="services.length === 0">
            <td class="px-4 py-4 text-slate-500" :colspan="canManagePayments ? 7 : 6">{{ t('patientPayments.noServices') }}</td>
          </tr>
          <tr v-for="service in services" :key="service.id" class="bg-white">
            <td class="px-4 py-3 text-slate-700">#{{ service.visit_id }}</td>
            <td class="px-4 py-3 text-slate-700">{{ service.service_name }}</td>
            <td class="px-4 py-3 text-slate-700">{{ service.tooth_id ? `#${service.tooth_id}` : '-' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ formatCurrency(service.price) }}</td>
            <td class="px-4 py-3 text-slate-700">{{ service.performed_by || '-' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ formatDate(service.created_at) }}</td>
            <td v-if="canManagePayments" class="px-4 py-3">
              <button
                type="button"
                class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                :disabled="serviceDeleting === service.id"
                :title="t('patientPayments.delete')"
                @click="confirmDeleteService(service)"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ isDiscountMode ? t('patientPayments.addDiscount') : (isEditing ? t('patientPayments.editPayment') : t('patientPayments.addPayment')) }}
              </h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.visitId') }}</label>
                  <input v-model="form.visit_id" type="number" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('patientPayments.visitIdPlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.paidAt') }}</label>
                  <input v-model="form.paid_at" type="datetime-local" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div v-if="!isDiscountMode">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.type') }}</label>
                  <select v-model="form.payment_type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="payment">{{ t('patientPayments.typePayment') }}</option>
                    <option value="refund">{{ t('patientPayments.typeRefund') }}</option>
                    <option value="adjustment">{{ t('patientPayments.typeAdjustment') }}</option>
                    <option value="discount">{{ t('patientPayments.typeDiscount') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.method') }}</label>
                  <select v-model="form.method" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="cash">{{ t('patientPayments.methodCash') }}</option>
                    <option value="card">{{ t('patientPayments.methodCard') }}</option>
                    <option value="transfer">{{ t('patientPayments.methodTransfer') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    {{ isDiscountMode ? t('patientPayments.discountAmount') || 'Chegirma summasi' : t('patientPayments.amount') }}
                  </label>
                  <input
                    v-model="form.amount"
                    type="number"
                    :min="0"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    :placeholder="isDiscountMode ? 'Ixtiyoriy (agar % kiritsangiz avtomatik hisoblanadi)' : t('patientPayments.amountPlaceholder')"
                  />
                  <p v-if="isDiscountMode" class="mt-1 text-xs text-slate-500">
                    % kiritilsa summa avtomatik hisoblanadi.
                  </p>
                </div>
                <div v-if="isDiscountMode">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Chegirma (%)</label>
                  <input v-model="form.discount_percent" type="number" min="0" max="100" step="0.01" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Masalan: 10" />
                  <p v-if="discountPreview.base > 0 && discountPreview.amount > 0" class="mt-1 text-xs font-medium text-violet-700">
                    Avtomatik: {{ formatCurrency(discountPreview.amount) }} (bazaviy summa: {{ formatCurrency(discountPreview.base) }})
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.note') }}</label>
                  <input v-model="form.note" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('patientPayments.notePlaceholder')" />
                </div>
              </div>
              <p v-if="visitPreviewLoading" class="text-sm text-gray-500">{{ t('patientPayments.loadingVisit') }}</p>
              <div v-if="visitPreview" class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                <p class="font-medium text-gray-700">{{ t('patientPayments.visitSummary') }}</p>
                <div class="mt-1 flex flex-wrap gap-4">
                  <span>{{ t('patientPayments.visitPrice') }}: {{ formatCurrency(visitPreview.price || 0) }}</span>
                  <span>{{ t('patientPayments.visitPaid') }}: {{ formatCurrency(visitPreview.paid_amount || 0) }}</span>
                  <span>{{ t('patientPayments.visitDebt') }}: {{ formatCurrency(visitPreview.debt_amount || 0) }}</span>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeModal">
                {{ t('patientPayments.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="savePayment">
                {{ t('patientPayments.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TrashIcon, TagIcon, BanknotesIcon, PrinterIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useClinicStore } from '@/stores/clinic'
import { createPayment, updatePayment, deletePayment, getPaymentsByPatientId, getPaymentsByVisitId } from '@/api/paymentsApi'
import { getVisitServicesByPatientId, getVisitServicesByVisitId, deleteVisitServiceById } from '@/api/visitServicesApi'
import { getVisitById, updateVisit, getVisitsByPatientId } from '@/api/visitsApi'
import { listInventoryItems } from '@/api/inventoryApi'
import { updatePatient } from '@/api/patientsApi'
import { completeAllPatientVisits } from '@/lib/completePatientVisits'
import { openPatientCompletionPreview } from '@/lib/patientCompletionPrint'
import { useToast } from '@/composables/useToast'
import { sendPatientCompletionSummary } from '@/api/telegramApi'

const authStore = useAuthStore()
const clinicStore = useClinicStore()
const canManagePayments = computed(() => ['admin', 'doctor', 'solo'].includes(authStore.userRole || ''))

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  },
  patientName: {
    type: String,
    default: ''
  },
  patientMedId: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update-status'])

const payments = ref([])
const loading = ref(false)
const services = ref([])
const servicesLoading = ref(false)
const serviceDeleting = ref(null)
const visits = ref([])
const completingAll = ref(false)
const inventoryItems = ref([])
const { t } = useI18n()
const toast = useToast()
const showPaymentModal = ref(false)
const isEditing = ref(false)
const isDiscountMode = ref(false)
const visitPreview = ref(null)
const visitPreviewLoading = ref(false)
const lastCompletionSummary = ref(null)

const form = ref({
  id: null,
  visit_id: '',
  amount: '',
  discount_percent: '',
  payment_type: 'payment',
  method: 'cash',
  note: '',
  paid_at: ''
})

const totalPayments = computed(() =>
  payments.value.reduce((sum, entry) => sum + (entry.payment_type === 'payment' ? Number(entry.amount) || 0 : 0), 0)
)

const totalRefunds = computed(() =>
  payments.value.reduce((sum, entry) => {
    if (entry.payment_type !== 'refund') return sum
    if (isDiscountEntry(entry)) return sum
    return sum + (Number(entry.amount) || 0)
  }, 0)
)

const netIncome = computed(() =>
  payments.value.reduce((sum, entry) => {
    const amount = Number(entry.amount) || 0
    return sum + (entry.payment_type === 'refund' ? -amount : amount)
  }, 0)
)

const parsePrice = (v) => {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(String(v).replace(/\s|,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : 0
}

const loadInventoryItems = async () => {
  try {
    inventoryItems.value = await listInventoryItems('order=created_at.desc')
  } catch (error) {
    console.error('Failed to load inventory items for billing:', error)
    inventoryItems.value = []
  }
}

// Yakunlanmagan tashriflar bor-yo'qligini tekshirish
const hasIncompleteVisits = computed(() => {
  // Agar xizmatlar mavjud bo'lsa va to'lovlar bo'lmasa, yakunlash tugmasi ko'rinishi kerak
  if (totalServices.value > 0 && payments.value.length === 0) return true

  // Yoki yakunlanmagan tashriflar bo'lsa
  return visits.value.some(v =>
    v.status === 'in_progress' ||
    v.status === 'completed_debt' ||
    (v.status === 'completed_paid' && (Number(v.debt_amount) || 0) > 0)
  )
})

// Har tish uchun faqat oxirgi xizmat; faqat tishga bog'liq xizmatlar (tooth_id bo'lganlar)
const totalServices = computed(() => {
  const seen = new Set()
  let sum = 0
  const sorted = [...services.value].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  for (const e of sorted) {
    const tid = e.tooth_id
    const vid = e.visit_id
    // tooth_id bo'lmagan yozuvlar tish xizmati emas — jami hisobga kiritmaymiz
    if (tid == null || vid == null) continue
    const key = `v${vid}t${tid}`
    if (seen.has(key)) continue
    seen.add(key)
    sum += parsePrice(e.price)
  }
  return sum
})

const formatCurrency = (amount) => {
  if (!amount) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

const getTypeLabel = (type) => {
  if (type === 'refund') return t('patientPayments.typeRefund')
  if (type === 'adjustment') return t('patientPayments.typeAdjustment')
  return t('patientPayments.typePayment')
}

const DISCOUNT_NOTE_PREFIX = '[DISCOUNT]'
const DISCOUNT_PERCENT_PREFIX = '[DISCOUNT_PERCENT:'

const isDiscountEntry = (entry) => {
  if (entry.payment_type === 'refund' && entry.note && String(entry.note).includes(DISCOUNT_NOTE_PREFIX)) return true
  if (entry.payment_type === 'adjustment' && Number(entry.amount) < 0) return true // eski yozuvlar
  return false
}

const getDiscountTotal = (entries = []) => entries
  .filter(isDiscountEntry)
  .reduce((sum, entry) => sum + Math.abs(Number(entry.amount) || 0), 0)

const getPaidNetWithoutDiscounts = (entries = []) => entries
  .reduce((sum, entry) => {
    const amount = Number(entry.amount) || 0
    if (isDiscountEntry(entry)) return sum
    if (entry.payment_type === 'refund') return sum - amount
    return sum + amount
  }, 0)

const normalizeNoteForPrint = (note) => {
  if (!note) return '-'
  return String(note)
    .replace(/^\s*\[DISCOUNT\]\s*/i, '')
    .replace(/^\s*\[DISCOUNT_PERCENT:[^\]]+\]\s*/i, '')
    .replace(/^\s*\[CATEGORY:[^\]]+\]\s*/i, '')
    .trim() || '-'
}

const getPaymentKindLabel = (entry) => {
  if (!entry) return '-'
  if (isDiscountEntry(entry)) return 'Chegirma'
  if (entry.payment_type === 'payment') return 'To\'lov'
  if (entry.payment_type === 'refund') return 'Refund'
  if (entry.payment_type === 'adjustment') return Number(entry.amount) < 0 ? 'Xarajat' : 'Qo\'shimcha'
  return entry.payment_type || '-'
}

const buildPrintPaymentDetails = (summary) => {
  const visitIds = new Set([
    ...(summary?.services || []).map(item => Number(item.visitId)).filter(Number.isFinite),
    ...(summary?.discounts || []).map(item => Number(item.visitId)).filter(Number.isFinite)
  ])

  const scoped = payments.value.filter(entry => visitIds.size === 0 || visitIds.has(Number(entry.visit_id)))

  return scoped.map(entry => ({
    method: entry.method || '-',
    kind: getPaymentKindLabel(entry),
    amount: Math.abs(Number(entry.amount) || 0),
    note: normalizeNoteForPrint(entry.note)
  }))
}

const getTypeDisplayLabel = (entry) => {
  if (isDiscountEntry(entry)) return t('patientPayments.typeDiscount')
  if (entry.payment_type === 'adjustment' && Number(entry.amount) < 0) return t('patientPayments.typeDiscount')
  return getTypeLabel(entry.payment_type)
}

const getTypeClass = (entry) => {
  if (isDiscountEntry(entry)) return 'text-violet-600 font-medium'
  const type = entry?.payment_type
  if (type === 'refund') return 'text-rose-600 font-medium'
  if (type === 'adjustment') {
    return (Number(entry?.amount) || 0) < 0 ? 'text-violet-600 font-medium' : 'text-amber-600 font-medium'
  }
  return 'text-emerald-600 font-medium'
}

const getDiscountPercent = (entry) => {
  if (!entry?.note) return ''
  const match = String(entry.note).match(/\[DISCOUNT_PERCENT:([\d.]+)\]/i)
  return match?.[1] || ''
}

const getDisplayNote = (entry) => {
  if (!entry?.note) return '-'
  return normalizeNoteForPrint(entry.note)
}

const getVisitServicesTotal = (visitId) => {
  const targetVisitId = Number(visitId)
  if (!Number.isFinite(targetVisitId)) return 0
  return services.value
    .filter(item => Number(item.visit_id) === targetVisitId)
    .reduce((sum, item) => {
      const line = parsePrice(item.total_price ?? item.totalPrice ?? item.price)
      return sum + line
    }, 0)
}

const fetchVisitServicesTotal = async (visitId) => {
  const targetVisitId = Number(visitId)
  if (!Number.isFinite(targetVisitId)) return 0
  const rows = await getVisitServicesByVisitId(targetVisitId)
  if (!Array.isArray(rows) || rows.length === 0) return 0
  return rows.reduce((sum, item) => {
    const line = parsePrice(item.total_price ?? item.totalPrice ?? item.price)
    return sum + line
  }, 0)
}

const discountPreview = computed(() => {
  if (!isDiscountMode.value) return { base: 0, amount: 0 }
  const percent = Number(form.value.discount_percent)
  const visitId = Number(form.value.visit_id)
  if (!Number.isFinite(percent) || percent <= 0 || !Number.isFinite(visitId)) return { base: 0, amount: 0 }
  const fromServices = getVisitServicesTotal(visitId)
  const fromVisit = Number(visitPreview.value?.price) || 0
  const base = fromServices > 0 ? fromServices : fromVisit
  if (base <= 0) return { base: 0, amount: 0 }
  return {
    base,
    amount: Math.round((base * percent) / 100)
  }
})

watch(
  () => [form.value.discount_percent, form.value.visit_id, isDiscountMode.value, discountPreview.value.amount],
  () => {
    if (!isDiscountMode.value) return
    const percent = Number(form.value.discount_percent)
    if (!Number.isFinite(percent) || percent <= 0) return
    if (discountPreview.value.amount > 0) {
      form.value.amount = String(discountPreview.value.amount)
    }
  }
)

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const loadPayments = async () => {
  loading.value = true
  try {
    payments.value = await getPaymentsByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load payments:', error)
    payments.value = []
  } finally {
    loading.value = false
  }
}

const loadServices = async () => {
  servicesLoading.value = true
  try {
    services.value = await getVisitServicesByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load visit services:', error)
    services.value = []
  } finally {
    servicesLoading.value = false
  }
}

const loadVisits = async () => {
  try {
    visits.value = await getVisitsByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load visits:', error)
    visits.value = []
  }
}

const loadAll = async () => {
  await Promise.all([loadPayments(), loadServices(), loadVisits(), loadInventoryItems()])
}

const completeAllVisits = async () => {
  if (!window.confirm(t('patientPayments.confirmCompleteAll') || 'Barcha tashriflarni yakunlashni tasdiqlaysizmi?')) return

  completingAll.value = true
  try {
    const doctorId = authStore.user?.id || null
    const result = await completeAllPatientVisits(props.patientId, doctorId)

    if (result.success) {
      toast.success(t('patientPayments.toastAllCompleted') || `Muvaffaqiyatli yakunlandi: ${result.completed} ta tashrif`)
      lastCompletionSummary.value = result.summary || null

      if (result.summary) {
        const tg = await sendPatientCompletionSummary({
          patientId: props.patientId,
          doctorName: result.summary.doctorName,
          visitDate: result.summary.visitDate,
          services: result.summary.services,
          discounts: result.summary.discounts,
          totalBeforeDiscount: result.summary.totalBeforeDiscount,
          totalDiscount: result.summary.totalDiscount,
          totalAfterDiscount: result.summary.totalAfterDiscount,
          paid: result.summary.paid,
          remaining: result.summary.remaining
        })
        if (!tg.ok) {
          console.warn('Telegram completion summary was not sent:', tg.error)
        }
      }

      await loadAll() // Ma'lumotlarni yangilash
    } else {
      toast.error(result.error || t('patientPayments.errorCompleteAll'))
    }
  } catch (error) {
    console.error('Failed to complete all visits:', error)
    toast.error(t('patientPayments.errorCompleteAll'))
  } finally {
    completingAll.value = false
  }
}

const printLastCompletion = () => {
  if (!lastCompletionSummary.value) {
    toast.error('Pechat uchun yakuniy hisobot topilmadi')
    return
  }

  const summary = lastCompletionSummary.value
  const servicesSum = (summary.services || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0)

  const printResult = openPatientCompletionPreview({
    clinicName: clinicStore.displayName || 'SHIFOCRM',
    clinicLogo: clinicStore.logoUrl || '',
    patientName: props.patientName || `Bemor #${props.patientId}`,
    patientMedId: props.patientMedId || '-',
    doctorName: summary.doctorName,
    responsibleName: authStore.user?.full_name || authStore.user?.name || 'Mas\'ul xodim',
    visitDate: summary.visitDate,
    services: (summary.services || []).map(item => ({
      ...item,
      quantity: 1,
      unitPrice: Number(item.price) || 0,
      totalPrice: Number(item.price) || 0,
      performedBy: summary.doctorName || ''
    })),
    discounts: (summary.discounts || []).map(item => ({
      ...item,
      percent: parseDiscountPercentFromNote(item.note),
      note: normalizeNoteForPrint(item.note)
    })),
    paymentDetails: buildPrintPaymentDetails(summary),
    totalBeforeDiscount: summary.totalBeforeDiscount,
    totalDiscount: summary.totalDiscount,
    totalAfterDiscount: summary.totalAfterDiscount,
    paid: summary.paid,
    remaining: summary.remaining,
    extraCharges: Math.max(0, (Number(summary.totalBeforeDiscount) || 0) - servicesSum),
    template: 'full'
  })

  if (!printResult.ok) {
    toast.error('Pechat oynasi bloklandi. Brauzerda pop-upga ruxsat bering.')
  }
}

onMounted(loadAll)
watch(() => props.patientId, loadAll)

const openCreateModal = () => {
  isEditing.value = false
  isDiscountMode.value = false
  form.value = {
    id: null,
    visit_id: '',
    amount: '',
    discount_percent: '',
    payment_type: 'payment',
    method: 'cash',
    note: '',
    paid_at: ''
  }
  visitPreview.value = null
  showPaymentModal.value = true
}

const openDiscountModal = () => {
  isEditing.value = false
  isDiscountMode.value = true
  form.value = {
    id: null,
    visit_id: '',
    amount: '',
    discount_percent: '',
    payment_type: 'discount',
    method: 'cash',
    note: '',
    paid_at: new Date().toISOString().slice(0, 16)
  }
  visitPreview.value = null
  showPaymentModal.value = true
}

const stripDiscountNotePrefix = (note) => {
  if (!note) return ''
  return String(note)
    .replace(/^\s*\[DISCOUNT\]\s*/i, '')
    .replace(/^\s*\[DISCOUNT_PERCENT:[^\]]+\]\s*/i, '')
    .trim()
}

const parseDiscountPercentFromNote = (note) => {
  if (!note) return ''
  const match = String(note).match(/\[DISCOUNT_PERCENT:([\d.]+)\]/i)
  return match?.[1] || ''
}

const openEditModal = (payment) => {
  isEditing.value = true
  isDiscountMode.value = false
  const amt = Number(payment.amount) || 0
  const isDiscount = isDiscountEntry(payment)
  form.value = {
    id: payment.id,
    visit_id: payment.visit_id ? String(payment.visit_id) : '',
    amount: isDiscount ? Math.abs(amt) : (payment.amount ?? ''),
    discount_percent: isDiscount ? parseDiscountPercentFromNote(payment.note) : '',
    payment_type: isDiscount ? 'discount' : (payment.payment_type || 'payment'),
    method: payment.method || 'cash',
    note: isDiscount ? stripDiscountNotePrefix(payment.note) : (payment.note || ''),
    paid_at: payment.paid_at ? payment.paid_at.slice(0, 16) : ''
  }
  if (isDiscount) isDiscountMode.value = true
  showPaymentModal.value = true
}

const closeModal = () => {
  showPaymentModal.value = false
  isDiscountMode.value = false
  visitPreview.value = null
}

const savePayment = async () => {
  const visitId = Number(form.value.visit_id)
  if (!Number.isFinite(visitId)) {
    toast.error(t('patientPayments.errorVisitRequired'))
    return
  }

  let amount = Number(form.value.amount)
  const hasManualAmount = Number.isFinite(amount) && amount > 0
  let paymentType = form.value.payment_type
  let note = form.value.note || null

  // DB da amount faqat musbat (payments_amount_check); chegirani refund sifatida musbat summa bilan saqlaymiz
  if (paymentType === 'discount') {
    const percent = Number(form.value.discount_percent)
    const hasPercent = Number.isFinite(percent) && percent > 0

    if (hasPercent && percent > 100) {
      toast.error('Chegirma foizi 100 dan katta bo\'lmasligi kerak')
      return
    }

    if (hasPercent) {
      let baseAmount = getVisitServicesTotal(visitId)
      if (baseAmount <= 0) {
        try {
          baseAmount = await fetchVisitServicesTotal(visitId)
        } catch (error) {
          console.warn('Visit services total fetch failed:', error)
        }
      }
      if (baseAmount <= 0) {
        const visit = visitPreview.value || await getVisitById(visitId)
        baseAmount = Number(visit?.price) || 0
      }

      if (baseAmount <= 0) {
        toast.error('Foizli chegirma uchun tashrifdagi xizmatlar summasi topilmadi')
        return
      }

      amount = Math.round((baseAmount * percent) / 100)
      if (amount <= 0) {
        toast.error('Chegirma summasi 0 dan katta bo\'lishi kerak')
        return
      }
      note = note
        ? `${DISCOUNT_PERCENT_PREFIX}${percent}] ${note}`
        : `${DISCOUNT_PERCENT_PREFIX}${percent}]`
    } else if (!hasManualAmount) {
      toast.error('Chegirma uchun summa kiriting yoki foiz kiriting')
      return
    }

    paymentType = 'refund'
    amount = Math.abs(amount)
    note = note ? `${DISCOUNT_NOTE_PREFIX} ${note}` : DISCOUNT_NOTE_PREFIX
  } else if (!hasManualAmount) {
    toast.error(t('patientPayments.errorAmountRequired'))
    return
  }

  const payload = {
    visit_id: visitId,
    patient_id: Number(props.patientId),
    amount,
    payment_type: paymentType,
    method: form.value.method || null,
    note,
    paid_at: form.value.paid_at ? new Date(form.value.paid_at).toISOString() : null
  }

  try {
    if (isEditing.value && form.value.id) {
      await updatePayment(form.value.id, payload)
      toast.success(t('patientPayments.toastUpdated'))
    } else {
      await createPayment(payload)
      toast.success(t('patientPayments.toastCreated'))
    }
    await loadPayments()
    await syncVisitPaymentState(visitId)
    await loadVisits() // Visitlar refresh qilish — bemor statusini hisoblash uchun kerak
    closeModal()
  } catch (error) {
    console.error('Failed to save payment:', error)
    toast.error(t('patientPayments.errorSave'))
  }
}

// To'lov to'liq bo'lsa visitni "To'liq yakunlangan" qilish va bemor statusini yangilash
const syncVisitPaymentState = async (visitId) => {
  try {
    const visit = await getVisitById(visitId)
    if (!visit) return
    const price = Number(visit.price) || 0
    const entries = await getPaymentsByVisitId(visitId)
    const discountTotal = getDiscountTotal(entries)
    const paidNet = getPaidNetWithoutDiscounts(entries)
    const effectiveDue = Math.max(0, price - discountTotal)
    const debtAmount = Math.max(0, effectiveDue - paidNet)

    const updateData = {
      paid_amount: paidNet > 0 ? paidNet : null,
      debt_amount: debtAmount > 0 ? debtAmount : null
    }

    if (visit.status === 'completed_debt' || visit.status === 'completed_paid') {
      updateData.status = debtAmount > 0 ? 'completed_debt' : 'completed_paid'
    }

    await updateVisit(visitId, updateData)

    if (debtAmount <= 0) {

      // Bemor statusini yangilash — agar barcha tashriflar to'liq to'langan bo'lsa "completed"ga o'tkazish
      try {
        const allVisits = visits.value.filter(v => Number(v.patient_id) === Number(props.patientId))
        const hasRemainingDebt = allVisits.some(v =>
          v.status === 'completed_debt' ||
          (v.status !== 'completed_paid' && v.status !== 'cancelled' && v.status !== 'no_show')
        )

        if (!hasRemainingDebt) {
          // Bemor barcha to'lovlarni qilgan — statusini "completed"ga o'tkazish
          await updatePatient(props.patientId, {
            status: 'completed',
            last_visit: new Date().toISOString().split('T')[0]
          })
          // Parent'ni yangilash haqida xabar berish
          emit('update-status', 'completed')
        }
      } catch (e) {
        console.warn('Failed to update patient status after payment:', e)
      }
    }
  } catch (e) {
    console.warn('syncVisitPaymentState:', e)
  }
}

const confirmDelete = async (payment) => {
  const confirmed = window.confirm(t('patientPayments.confirmDelete'))
  if (!confirmed) return
  try {
    await deletePayment(payment.id)
    toast.success(t('patientPayments.toastDeleted'))
    await loadPayments()
    if (Number.isFinite(Number(payment.visit_id))) {
      await syncVisitPaymentState(Number(payment.visit_id))
      await loadVisits()
    }
  } catch (error) {
    console.error('Failed to delete payment:', error)
    toast.error(t('patientPayments.errorDelete'))
  }
}

const confirmDeleteService = async (service) => {
  if (!window.confirm(t('patientPayments.confirmDeleteService'))) return
  serviceDeleting.value = service.id
  try {
    await deleteVisitServiceById(service.id)
    toast.success(t('patientPayments.toastServiceDeleted'))
    await loadServices()
  } catch (error) {
    console.error('Failed to delete visit service:', error)
    toast.error(t('patientPayments.errorServiceDelete'))
  } finally {
    serviceDeleting.value = null
  }
}

const loadVisitPreview = async (visitId) => {
  if (!Number.isFinite(visitId)) {
    visitPreview.value = null
    return
  }
  visitPreviewLoading.value = true
  try {
    visitPreview.value = await getVisitById(visitId)
  } catch (error) {
    console.error('Failed to load visit preview:', error)
    visitPreview.value = null
  } finally {
    visitPreviewLoading.value = false
  }
}

watch(
  () => form.value.visit_id,
  (newValue) => {
    if (newValue === '') {
      visitPreview.value = null
      return
    }
    const visitId = Number(newValue)
    loadVisitPreview(visitId)
  }
)
</script>
