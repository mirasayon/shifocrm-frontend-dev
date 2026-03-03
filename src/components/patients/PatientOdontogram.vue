<template>
  <div class="space-y-6">
    <!-- Visit Selection Header — mobil uchun to'liq kenglik, touch-friendly -->
    <div class="flex flex-col gap-4 bg-white rounded-xl p-4 sm:p-4 border border-gray-100">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div class="flex-1 w-full">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">{{ t('odontogram.visit') }}</label>
          <select
            v-model="selectedVisitId"
            @change="onVisitChange"
            class="w-full sm:w-auto min-w-0 px-4 py-3 sm:py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 touch-manipulation min-h-[44px]"
            :disabled="loading"
          >
            <option value="">{{ t('odontogram.select') }}</option>
            <option v-for="visit in visits" :key="visit.id" :value="visit.id">
              {{ formatVisitDate(visit.date) }} - {{ getVisitStatusText(visit.status) }}
            </option>
          </select>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <button
            v-if="!hasActiveVisit"
            @click="startNewVisit"
            :disabled="loading"
            class="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            <PlusIcon class="w-5 h-5" />
            {{ t('odontogram.newVisit') }}
          </button>
          <button
            v-if="currentVisit && currentVisit.status === 'in_progress' && (isDoctor || isSolo)"
            @click="completeCurrentVisit"
            :disabled="loading"
            class="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 active:scale-[0.98] transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            <CheckIcon class="w-5 h-5" />
            {{ t('odontogram.completeVisit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <!-- No Visit Selected -->
    <div v-else-if="!selectedVisitId" class="bg-gray-50 rounded-xl p-8 text-center">
      <DocumentTextIcon class="w-12 h-12 text-gray-300 mx-auto" />
      <p class="mt-4 text-gray-500">Odontogrammani ko'rish uchun tashrif tanlang yoki yangi tashrif boshlang</p>
    </div>

    <!-- Odontogram Content — mobil-first, stomatolog uchun qulay -->
    <div v-else class="space-y-4 sm:space-y-6 pb-6">
      <!-- Jami hisob — xizmatlar + material sarfi -->
      <div class="flex flex-col gap-2 rounded-xl bg-slate-50 border border-slate-100 p-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600">{{ t('odontogram.servicesTotal') }}:</span>
          <span class="font-medium text-slate-800">{{ formatCurrency(servicesTotal) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-600">{{ t('odontogram.materialTotal') }}:</span>
          <span class="font-medium text-slate-800">{{ formatCurrency(consumptionsTotal) }}</span>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-slate-200">
          <span class="text-sm font-semibold text-slate-700">{{ t('odontogram.total') }}:</span>
          <span class="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700">
            {{ formatCurrency(totalBill) }}
          </span>
        </div>
      </div>

      <!-- Odontogram — mobil: kichik tishlar, smooth scroll; desktop: to'liq -->
      <div class="odontogram-wrapper overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-100 bg-white p-3 sm:p-6 shadow-sm -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide odontogram-scroll">
        <div class="odontogram-inner relative">
          <div class="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-slate-200 hidden sm:block"></div>
          <div class="pointer-events-none absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-slate-200 hidden sm:block"></div>

          <div class="space-y-4 sm:space-y-6">
            <!-- Yuqori jag' -->
            <div class="flex justify-center">
              <div class="odontogram-row flex items-start gap-1 sm:gap-2 md:gap-4">
                <div class="flex gap-1 sm:gap-2">
                  <Tooth
                    v-for="id in upperRight"
                    :key="id"
                    :id="id"
                    :status="toothStatusMap[id]"
                    :service-color="toothServiceColorMap[id]"
                    :disabled="!canEdit"
                    @select="openStatusMenu"
                  />
                </div>
                <div class="h-16 sm:h-24 w-px bg-slate-200 flex-shrink-0 hidden sm:block"></div>
                <div class="flex gap-1 sm:gap-2">
                  <Tooth
                    v-for="id in upperLeft"
                    :key="id"
                    :id="id"
                    :status="toothStatusMap[id]"
                    :service-color="toothServiceColorMap[id]"
                    :disabled="!canEdit"
                    @select="openStatusMenu"
                  />
                </div>
              </div>
            </div>

            <!-- Pastki jag' -->
            <div class="flex justify-center">
              <div class="odontogram-row flex items-start gap-1 sm:gap-2 md:gap-4">
                <div class="flex gap-1 sm:gap-2">
                  <Tooth
                    v-for="id in lowerLeft"
                    :key="id"
                    :id="id"
                    :status="toothStatusMap[id]"
                    :service-color="toothServiceColorMap[id]"
                    :disabled="!canEdit"
                    @select="openStatusMenu"
                  />
                </div>
                <div class="h-16 sm:h-24 w-px bg-slate-200 flex-shrink-0 hidden sm:block"></div>
                <div class="flex gap-1 sm:gap-2">
                  <Tooth
                    v-for="id in lowerRight"
                    :key="id"
                    :id="id"
                    :status="toothStatusMap[id]"
                    :service-color="toothServiceColorMap[id]"
                    :disabled="!canEdit"
                    @select="openStatusMenu"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Material sarfi — mobil: kartalar, desktop: jadval -->
      <div class="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 class="text-base font-semibold text-gray-900">{{ t('odontogram.materialTitle') }}</h4>
            <p v-if="consumptions.length > 0" class="text-sm text-gray-500 mt-0.5">
              Jami: {{ formatCurrency(consumptionsTotal) }}
            </p>
          </div>
          <button
            v-if="canManageMaterial"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg hover:from-primary-600 hover:to-cyan-700 transition-all active:scale-[0.98] touch-manipulation min-h-[44px]"
            @click="openConsumptionModal"
          >
            <PlusIcon class="w-5 h-5" />
            {{ t('odontogram.addMaterial') }}
          </button>
        </div>
        <div v-if="consumptionsLoading" class="py-8 text-center text-slate-500 text-sm">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
          {{ t('odontogram.loadingMaterials') }}
        </div>
        <div v-else-if="consumptions.length === 0" class="py-8 text-center rounded-lg bg-slate-50 border border-slate-100">
          <p class="text-sm text-slate-500 mb-3">{{ t('odontogram.noMaterials') }}</p>
          <button
            v-if="canManageMaterial"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors touch-manipulation"
            @click="openConsumptionModal"
          >
            <PlusIcon class="w-4 h-4" />
            {{ t('odontogram.addMaterial') }}
          </button>
        </div>
        <template v-else>
          <!-- Mobil: kartalar -->
          <div class="md:hidden space-y-2">
            <div
              v-for="entry in consumptions"
              :key="entry.id"
              class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div class="min-w-0 flex-1">
                <p class="font-medium text-slate-800 truncate">{{ itemLabel(entry.item_id) }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ formatDate(entry.created_at) }} · {{ entry.quantity }} {{ t('odontogram.materialQty') }}</p>
                <p class="text-sm font-medium text-primary-600 mt-1">{{ formatCurrency(consumptionTotal(entry)) }}</p>
                <p v-if="entry.note" class="text-xs text-slate-600 mt-1 truncate">{{ entry.note }}</p>
              </div>
              <button
                v-if="canManageMaterial"
                type="button"
                class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg touch-manipulation"
                :disabled="consumptionDeleting === entry.id"
                @click="confirmDeleteConsumption(entry)"
              >
                <TrashIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
          <!-- Desktop: jadval -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-4 py-3">{{ t('odontogram.materialDate') }}</th>
                  <th class="px-4 py-3">{{ t('odontogram.materialItem') }}</th>
                  <th class="px-4 py-3">{{ t('odontogram.materialQty') }}</th>
                  <th class="px-4 py-3">{{ t('odontogram.materialPrice') }}</th>
                  <th class="px-4 py-3">{{ t('odontogram.materialNote') }}</th>
                  <th v-if="canManageMaterial" class="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="entry in consumptions" :key="entry.id" class="bg-white">
                  <td class="px-4 py-3 text-slate-700">{{ formatDate(entry.created_at) }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ itemLabel(entry.item_id) }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ entry.quantity }}</td>
                  <td class="px-4 py-3 text-slate-700 font-medium text-primary-600">{{ formatCurrency(consumptionTotal(entry)) }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ entry.note || '-' }}</td>
                  <td v-if="canManageMaterial" class="px-4 py-3">
                    <button
                      type="button"
                      class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      :disabled="consumptionDeleting === entry.id"
                      @click="confirmDeleteConsumption(entry)"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- Desktop: floating menu -->
      <div
        v-if="menuOpen && selectedToothId"
        ref="menuRef"
        class="fixed z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl hidden md:block"
        :style="menuStyle"
      >
        <div class="px-2 pb-1 text-xs font-medium text-slate-500">
          {{ t('odontogram.toothLabel', { id: selectedToothId }) }} · {{ activeUserRole.toUpperCase() }}
        </div>
        <button
          v-for="option in menuOptionsWithClear"
          :key="option.value"
          class="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
          @click="applyMenuSelection(option)"
        >
          <span class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full" :class="option.dotClass"></span>
            <span class="text-slate-700">{{ option.labelKey ? t(option.labelKey) : option.label }}</span>
          </span>
          <span v-if="option.price" class="text-xs text-slate-500">{{ formatCurrency(option.price) }}</span>
        </button>
      </div>

      <!-- Mobile: bottom sheet — stomatolog uchun barmoq bilan qulay -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-full opacity-0"
      >
        <div
          v-if="menuOpen && selectedToothId"
          class="fixed inset-x-0 bottom-0 z-50 md:hidden"
          @click.self="closeStatusMenu"
        >
          <div class="absolute inset-0 bg-black/40" @click="closeStatusMenu"></div>
          <div class="relative bg-white rounded-t-2xl shadow-2xl pb-6 max-h-[70vh] overflow-y-auto">
            <div class="sticky top-0 bg-white px-4 py-3 border-b border-slate-100 rounded-t-2xl flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900">
                {{ t('odontogram.toothLabel', { id: selectedToothId }) }}
              </h3>
              <button class="p-2 -m-2 text-slate-400 hover:text-slate-600 rounded-lg" @click="closeStatusMenu">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="p-4 space-y-1">
              <button
                v-for="option in menuOptionsWithClear"
                :key="option.value"
                class="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left text-base bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation min-h-[52px]"
                @click="applyMenuSelection(option)"
              >
                <span class="flex items-center gap-3">
                  <span class="w-4 h-4 rounded-full flex-shrink-0" :class="option.dotClass"></span>
                  <span class="font-medium text-slate-800">{{ option.labelKey ? t(option.labelKey) : option.label }}</span>
                </span>
                <span v-if="option.price" class="text-sm font-semibold text-primary-600">{{ formatCurrency(option.price) }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Legend — mobil: yig'iladi, stomatolog tez ko'radi -->
      <details class="bg-white rounded-xl border border-gray-100 group">
        <summary class="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer list-none flex items-center justify-between touch-manipulation min-h-[44px]">
          {{ t('odontogram.noteLabel') }}
          <ChevronDownIcon class="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
        </summary>
        <div class="px-4 pb-4 pt-0 flex flex-wrap gap-3">
          <div v-for="(state, key) in TOOTH_STATES" :key="key" class="flex items-center gap-2">
            <span
              class="w-6 h-6 rounded flex items-center justify-center text-white text-xs flex-shrink-0"
              :class="state.color"
            >
              {{ state.icon }}
            </span>
            <span class="text-sm text-gray-600">{{ state.labelKey ? t(state.labelKey) : state.label }}</span>
          </div>
        </div>
      </details>

      <!-- Save Button -->
      <div v-if="canEdit && hasChanges" class="flex justify-end">
        <button
          @click="saveOdontogram"
          :disabled="saving"
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <template v-if="saving">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {{ t('odontogram.saving') }}
          </template>
          <template v-else>
            {{ t('odontogram.save') }}
          </template>
        </button>
      </div>
    </div>

  </div>

  <!-- Material sarfi modali — mobil: bottom sheet, desktop: markaziy modal -->
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="showConsumptionModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeConsumptionModal">
      <div class="fixed inset-0 bg-black/40 md:bg-gray-500/75 transition-opacity" @click="closeConsumptionModal"></div>
      <!-- Desktop: markaziy modal -->
      <div class="hidden md:flex items-center justify-center min-h-screen px-4 py-8">
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl" @click.stop>
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">{{ t('odontogram.addMaterial') }}</h3>
            <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg" @click="closeConsumptionModal">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialItem') }}</label>
                <select v-model="consumptionForm.item_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">{{ t('odontogram.selectMaterial') }}</option>
                  <option v-for="item in inventoryItems" :key="item.id" :value="String(item.id)">
                    {{ formatMaterialOption(item) }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialQty') }}</label>
                <input v-model="consumptionForm.quantity" type="number" min="0" step="0.01" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="0" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialNote') }}</label>
                <input v-model="consumptionForm.note" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeConsumptionModal">
              {{ t('odontogram.cancel') }}
            </button>
            <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="saveConsumption">
              {{ t('odontogram.save') }}
            </button>
          </div>
        </div>
      </div>
      <!-- Mobil: bottom sheet — stomatolog uchun barmoq bilan qulay -->
      <div class="md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[90vh]">
        <div class="bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" @click.stop>
          <div class="flex-shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900">{{ t('odontogram.addMaterial') }}</h3>
            <button class="p-2 -m-2 text-slate-400 hover:text-slate-600 rounded-lg touch-manipulation" @click="closeConsumptionModal">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialItem') }}</label>
              <select v-model="consumptionForm.item_id" class="w-full rounded-xl border border-gray-200 px-4 py-3 text-base touch-manipulation min-h-[48px]">
                <option value="">{{ t('odontogram.selectMaterial') }}</option>
                <option v-for="item in inventoryItems" :key="item.id" :value="String(item.id)">
                  {{ formatMaterialOption(item) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialQty') }}</label>
              <input v-model="consumptionForm.quantity" type="number" min="0" step="0.01" class="w-full rounded-xl border border-gray-200 px-4 py-3 text-base touch-manipulation min-h-[48px]" placeholder="0" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialNote') }}</label>
              <input v-model="consumptionForm.note" type="text" class="w-full rounded-xl border border-gray-200 px-4 py-3 text-base touch-manipulation min-h-[48px]" placeholder="" />
            </div>
          </div>
          <div class="flex-shrink-0 px-4 py-4 border-t border-slate-100 flex gap-3">
            <button class="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium touch-manipulation min-h-[48px]" @click="closeConsumptionModal">
              {{ t('odontogram.cancel') }}
            </button>
            <button class="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 touch-manipulation min-h-[48px]" @click="saveConsumption">
              {{ t('odontogram.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, CheckIcon, DocumentTextIcon, XMarkIcon, ChevronDownIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/lib/date'
import { getVisitStatusLabel } from '@/constants/visitStatus'
import * as visitsApi from '@/api/visitsApi'
import * as odontogramApi from '@/api/odontogramApi'
import * as visitServicesApi from '@/api/visitServicesApi'
import { listServices } from '@/api/servicesApi'
import { listInventoryItems, listInventoryConsumptionsByVisitId, createInventoryConsumption, deleteInventoryConsumption } from '@/api/inventoryApi'
import { createPayment, getPaymentsByVisitId } from '@/api/paymentsApi'
import { sendVisitCompleted, schedulePatientFollowUps } from '@/api/telegramApi'
import Tooth from './Tooth.vue'

const { TOOTH_STATES } = odontogramApi

const props = defineProps({
  patient: {
    type: Object,
    required: true
  },
  doctorId: {
    type: [Number, String],
    default: null
  },
  doctorName: {
    type: String,
    default: ''
  },
  initialVisitId: {
    type: [Number, String],
    default: null
  }
})

const toast = useToast()
const authStore = useAuthStore()
const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const visits = ref([])
const selectedVisitId = ref('')
const currentVisit = ref(null)
const currentOdontogram = ref(null)
const originalOdontogramData = ref(null)

const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]
const lowerLeft = [38, 37, 36, 35, 34, 33, 32, 31]
const lowerRight = [41, 42, 43, 44, 45, 46, 47, 48]
const toothIds = [...upperRight, ...upperLeft, ...lowerLeft, ...lowerRight]

const teeth = ref(toothIds.map(id => ({ id, status: 'healthy', service_id: null })))
const selectedToothId = ref(null)
const menuOpen = ref(false)
const menuRef = ref(null)
const menuStyle = ref({ left: '0px', top: '0px', transform: 'translate(-50%, 0)' })
const ignoreClose = ref(false)

const statusOptions = [
  { type: 'status', value: 'healthy', labelKey: 'odontogram.statusHealthy', dotClass: 'bg-slate-200' },
  { type: 'status', value: 'caries', labelKey: 'odontogram.statusCaries', dotClass: 'bg-red-500' },
  { type: 'status', value: 'filling', labelKey: 'odontogram.statusFilling', dotClass: 'bg-blue-500' },
  { type: 'status', value: 'crown', labelKey: 'odontogram.statusCrown', dotClass: 'bg-amber-500' },
  { type: 'status', value: 'root_canal', labelKey: 'odontogram.statusRootCanal', dotClass: 'bg-violet-500' },
  { type: 'status', value: 'missing', labelKey: 'odontogram.statusMissing', dotClass: 'bg-slate-400' }
]

const servicesList = ref([])
const inventoryItems = ref([])
const consumptions = ref([])
const consumptionsLoading = ref(false)
const consumptionDeleting = ref(null)
const showConsumptionModal = ref(false)
const consumptionForm = ref({
  item_id: '',
  quantity: '',
  note: ''
})

// Computed
const hasActiveVisit = computed(() => {
  return visits.value.some(v => v.status === 'in_progress')
})

const canEdit = computed(() => {
  return currentVisit.value && currentVisit.value.status === 'in_progress'
})

const hasChanges = computed(() => {
  if (!currentOdontogram.value || !originalOdontogramData.value) return false
  return JSON.stringify(currentOdontogram.value.data) !== JSON.stringify(originalOdontogramData.value)
})

const activeUserRole = computed(() => authStore.userRole || 'doctor')
const isDoctor = computed(() => activeUserRole.value === 'doctor')
const isAdmin = computed(() => activeUserRole.value === 'admin')
const isSolo = computed(() => activeUserRole.value === 'solo')
// Material sarfini: admin — istalgan tashrifda; doktor va yakka doktor — faqat "Davolanish boshlandi" da
const canManageMaterial = computed(() => {
  if (!selectedVisitId.value) return false
  if (isAdmin.value) return true
  return canEdit.value && (isDoctor.value || isSolo.value)
})

// Tish bilan ishlashda xizmatlar bo'limidagi xizmatlardan foydalanamiz; bo'sh bo'lsa statuslar
const menuOptions = computed(() =>
  servicesList.value.length > 0 ? servicesList.value : statusOptions
)

// Tanlangan tishda xizmat bor bo'lsa — "Tozalash" birinchi qatorga
const menuOptionsWithClear = computed(() => {
  const opts = menuOptions.value
  const tid = selectedToothId.value
  const tooth = teeth.value.find((t) => t.id === tid)
  const hasService = tooth?.service_id || tooth?.status !== 'healthy'
  if (!hasService || !tid) return opts
  const clearOption = {
    type: 'status',
    value: 'healthy',
    labelKey: 'odontogram.statusClear',
    dotClass: 'bg-slate-200'
  }
  return [clearOption, ...opts]
})

// Methods
const formatVisitDate = (date) => formatDate(date)

const getVisitStatusText = (status) => getVisitStatusLabel(status)

const formatCurrency = (amount) => {
  if (!amount) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

// Har bir tish uchun status map - faqat odontogramdan olinadi
const toothStatusMap = computed(() => {
  const map = {}
  teeth.value.forEach((tooth) => {
    map[tooth.id] = tooth.status
  })
  return map
})

// Tish uchun xizmat rangi (xizmatlar bo'limida sozlangan rang)
const toothServiceColorMap = computed(() => {
  const map = {}
  teeth.value.forEach((tooth) => {
    const sid = tooth.service_id
    if (sid) {
      const svc = servicesList.value.find(s => s.value === String(sid))
      map[tooth.id] = svc?.colorHex || null
    } else {
      map[tooth.id] = null
    }
  })
  return map
})

const visitServices = ref([]) // Joriy tashrif xizmatlari — jami hisob uchun

const parsePrice = (v) => {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(String(v).replace(/\s|,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : 0
}

// visit_services dan to'g'ridan-to'g'ri hisoblaymiz (faqat tooth_id bo'lganlar)
// Bu to'g'ri, chunki visit_services — asosiy manba, odontogram.data.teeth esa faqat ko'rinish
const servicesTotal = computed(() => {
  const seen = new Set()
  let sum = 0
  const sorted = [...visitServices.value].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  for (const e of sorted) {
    const tid = e.tooth_id
    if (tid == null) continue // tooth_id bo'lmagan yozuvlar tish xizmati emas
    const key = `t${tid}`
    if (seen.has(key)) continue // Har tish uchun faqat oxirgi xizmat
    seen.add(key)
    sum += parsePrice(e.price)
  }
  return sum
})

// Material sarfi jami (tashrif bo'yicha)
const consumptionsTotal = computed(() =>
  consumptions.value.reduce((sum, entry) => sum + consumptionTotal(entry), 0)
)

// Jami hisob = xizmatlar + material sarfi
const totalBill = computed(() => servicesTotal.value + consumptionsTotal.value)

const syncTeethFromOdontogram = () => {
  const raw = currentOdontogram.value?.data?.teeth
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  teeth.value = toothIds.map((id) => {
    // API dan kelganda kalitlar string bo'lishi mumkin; raqam bilan ham tekshiramiz
    const toothData = data[id] ?? data[String(id)]
    if (!toothData || toothData.state === 'healthy') {
      return { id, status: 'healthy', service_id: null }
    }
    // "filled" ni "filling" ga normallashtirish (API va UI bir xil bo'lishi uchun)
    const state = toothData.state === 'filled' ? 'filling' : (toothData.state || 'healthy')
    return {
      id,
      status: state,
      service_id: toothData.service_id ?? null
    }
  })
}

// visit_services dan faqat odontogramda yo'q tishlarni qo'shamiz — mavjud tishlarni overwrite qilmaymiz
// Bu funksiya faqat yangi tashrif yaratilganda chaqiriladi
const syncTeethFromVisitServices = () => {
  if (!currentOdontogram.value || !visitServices.value.length) return

  if (!currentOdontogram.value.data.teeth) {
    currentOdontogram.value.data.teeth = {}
  }
  const data = currentOdontogram.value.data.teeth
  let hasChanges = false

  for (const service of visitServices.value) {
    const tid = service.tooth_id
    if (tid == null) continue
    const key = String(tid)

    // Faqat odontogramda bu tish yo'q bo'lsa qo'shamiz (foydalanuvchi o'zgartirganini overwrite qilmaymiz)
    if (data[tid] || data[key]) continue

    let serviceId = null
    if (service.service_name && servicesList.value.length > 0) {
      const matched = servicesList.value.find(s =>
        s.label.toLowerCase() === service.service_name.toLowerCase() ||
        s.label === service.service_name
      )
      if (matched) {
        serviceId = Number(matched.value) || null
      }
    }

    const inferredStatus = inferStatusFromServiceName(service.service_name) || 'filling'
    data[key] = {
      state: inferredStatus,
      service_id: serviceId,
      note: ''
    }
    hasChanges = true
  }

  if (hasChanges) {
    currentOdontogram.value.data.teeth = { ...data }
    syncTeethFromOdontogram()
    if (currentOdontogram.value.id) {
      odontogramApi.updateOdontogramSnapshot(currentOdontogram.value.id, currentOdontogram.value.data)
        .catch(err => console.warn('Failed to auto-save odontogram sync:', err))
    }
  }
}

const loadVisitServices = async () => {
  if (!currentVisit.value?.id) {
    visitServices.value = []
    return
  }
  try {
    visitServices.value = await visitServicesApi.getVisitServicesByVisitId(currentVisit.value.id)
  } catch (error) {
    console.error('Failed to load visit services:', error)
    visitServices.value = []
  }
}

const loadInventoryItems = async () => {
  try {
    inventoryItems.value = await listInventoryItems('order=created_at.desc')
  } catch (error) {
    console.error('Failed to load inventory items:', error)
    inventoryItems.value = []
  }
}

const loadConsumptions = async () => {
  if (!currentVisit.value?.id) {
    consumptions.value = []
    return
  }
  consumptionsLoading.value = true
  try {
    consumptions.value = await listInventoryConsumptionsByVisitId(currentVisit.value.id)
  } catch (error) {
    console.error('Failed to load consumptions:', error)
    consumptions.value = []
  } finally {
    consumptionsLoading.value = false
  }
}

const itemLabel = (itemId) => {
  const match = inventoryItems.value.find(item => Number(item.id) === Number(itemId))
  return match ? match.name : `#${itemId}`
}

const itemPrice = (itemId) => {
  const match = inventoryItems.value.find(item => Number(item.id) === Number(itemId))
  return match ? (Number(match.cost_price) || 0) : 0
}

const formatMaterialOption = (item) => {
  const stock = item.current_stock ?? 0
  const price = Number(item.cost_price) || 0
  const unit = item.unit || ''
  const stockStr = unit ? `${stock} ${unit}` : stock
  const priceStr = formatCurrency(price)
  return `${item.name} (${t('odontogram.materialStock')}: ${stockStr}) — ${priceStr}`
}

const consumptionTotal = (entry) => {
  const qty = Number(entry.quantity) || 0
  const price = itemPrice(entry.item_id)
  return qty * price
}

const openConsumptionModal = () => {
  consumptionForm.value = {
    item_id: '',
    quantity: '',
    note: ''
  }
  showConsumptionModal.value = true
}

const closeConsumptionModal = () => {
  showConsumptionModal.value = false
}

const confirmDeleteConsumption = async (entry) => {
  if (!currentVisit.value?.id) return
  if (!confirm(t('odontogram.confirmDeleteMaterial'))) return
  consumptionDeleting.value = entry.id
  try {
    await deleteInventoryConsumption(entry.id)
    toast.success(t('odontogram.toastMaterialDeleted'))
    await Promise.all([loadConsumptions(), loadInventoryItems()])
  } catch (error) {
    console.error('Failed to delete consumption:', error)
    toast.error(t('odontogram.errorMaterialDelete'))
  } finally {
    consumptionDeleting.value = null
  }
}

const saveConsumption = async () => {
  if (!currentVisit.value?.id) return
  if (!consumptionForm.value.item_id) {
    toast.error(t('odontogram.errorMaterialRequired'))
    return
  }
  const quantity = Number(consumptionForm.value.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    toast.error(t('odontogram.errorMaterialQty'))
    return
  }
  const selectedItem = inventoryItems.value.find(item => Number(item.id) === Number(consumptionForm.value.item_id))
  if (selectedItem && Number.isFinite(Number(selectedItem.current_stock)) && quantity > Number(selectedItem.current_stock)) {
    toast.error(t('odontogram.errorMaterialStock'))
    return
  }
  try {
    await createInventoryConsumption({
      visit_id: currentVisit.value.id,
      patient_id: props.patient.id,
      doctor_id: props.doctorId,
      item_id: Number(consumptionForm.value.item_id),
      quantity,
      note: consumptionForm.value.note || null
    })
    toast.success(t('odontogram.toastMaterialAdded'))
    await Promise.all([loadConsumptions(), loadInventoryItems()])
    closeConsumptionModal()
  } catch (error) {
    console.error('Failed to save consumption:', error)
    const message = error?.message || t('odontogram.errorMaterialSave')
    toast.error(message)
  }
}

const ODONTOGRAM_COLOR_MAP = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500'
}

// Xizmat ranglari — tish SVG fill/stroke uchun hex
const ODONTOGRAM_COLOR_HEX = {
  red: '#ef4444',
  blue: '#3b82f6',
  amber: '#f59e0b',
  emerald: '#10b981',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  slate: '#64748b'
}

// Xizmat nomidan tish statusini aniqlash (stomatolog uchun avtomatik rang)
const inferStatusFromServiceName = (name) => {
  if (!name) return null
  const n = name.toLowerCase()
  if (/plomb|пломб|filling|to'ldirish/i.test(n)) return 'filling'
  if (/krona|корон|crown/i.test(n)) return 'crown'
  if (/olib tashlash|удален|extraction|sug'urish/i.test(n)) return 'missing'
  if (/kanal|canal|root|endodont/i.test(n)) return 'root_canal'
  if (/karies|кариес|caries/i.test(n)) return 'caries'
  return null
}

const mapServiceToOption = (service) => ({
  type: 'service',
  value: String(service.id),
  label: service.name,
  price: Number(service.base_price) || 0,
  dotClass: ODONTOGRAM_COLOR_MAP[service.odontogram_color] || 'bg-cyan-500',
  colorHex: ODONTOGRAM_COLOR_HEX[service.odontogram_color] || '#06b6d4',
  inferredStatus: inferStatusFromServiceName(service.name)
})

const loadServicesMenu = async () => {
  try {
    const data = await listServices('order=created_at.desc')
    servicesList.value = (data || [])
      .filter(service => service.is_active !== false && service.show_in_odontogram === true)
      .map(mapServiceToOption)
    // Agar odontogrammada hech qanday xizmat belgilanmasa, barcha faol xizmatlarni ko'rsatish (oldingi xatti-harakat)
    if (servicesList.value.length === 0) {
      servicesList.value = (data || [])
        .filter(service => service.is_active !== false)
        .map(mapServiceToOption)
    }
  } catch (error) {
    console.error('Failed to load services list:', error)
    servicesList.value = []
  }
}

const addHistoryEntry = async ({ toothId, serviceName, price }) => {
  if (!currentVisit.value?.id) {
    toast.error('Avval tashrifni tanlang')
    return
  }
  try {
    const entry = await visitServicesApi.createVisitService({
      visit_id: currentVisit.value.id,
      patient_id: props.patient.id,
      doctor_id: props.doctorId,
      tooth_id: toothId,
      service_name: serviceName,
      price,
      performed_by: authStore.user?.full_name || props.doctorName || 'Doctor'
    })
    visitServices.value.unshift(entry)
  } catch (error) {
    console.error('Failed to save visit service:', error)
    toast.error(t('odontogram.errorSaveService'))
  }
}

const loadVisits = async () => {
  loading.value = true
  try {
    visits.value = await visitsApi.getVisitsByPatientId(props.patient.id)

    // Auto-select active visit yoki oxirgi tashrif
    const activeVisit = visits.value.find(v => v.status === 'in_progress')
    if (activeVisit) {
      selectedVisitId.value = activeVisit.id
      await loadOdontogram(activeVisit.id)
    } else if (visits.value.length > 0 && !selectedVisitId.value) {
      // Agar faol tashrif bo'lmasa va tashrif tanlanmagan bo'lsa, oxirgi tashrifni tanlaymiz
      const lastVisit = visits.value[0] // created_at.desc bo'yicha tartiblangan
      selectedVisitId.value = lastVisit.id
      await loadOdontogram(lastVisit.id)
    }
  } catch (error) {
    console.error('Failed to load visits:', error)
    toast.error(t('odontogram.errorLoadVisits'))
  } finally {
    loading.value = false
  }
}

const loadOdontogram = async (visitId) => {
  if (!visitId) {
    currentOdontogram.value = null
    originalOdontogramData.value = null
    currentVisit.value = null
    return
  }

  loading.value = true
  try {
    currentVisit.value = await visitsApi.getVisitById(visitId)
    currentOdontogram.value = await odontogramApi.getOrCreateOdontogram({
      patient_id: props.patient.id,
      visit_id: visitId,
      doctor_id: props.doctorId
    })
    originalOdontogramData.value = JSON.parse(JSON.stringify(currentOdontogram.value.data))
    syncTeethFromOdontogram() // Tishlar statusini faqat odontogramdan olamiz
    await loadServicesMenu()
    await Promise.all([loadConsumptions(), loadVisitServices(), loadInventoryItems()])
  } catch (error) {
    console.error('Failed to load odontogram:', error)
    toast.error(t('odontogram.errorLoadOdontogram'))
  } finally {
    loading.value = false
  }
}

const onVisitChange = () => {
  loadOdontogram(selectedVisitId.value)
}

const startNewVisit = async () => {
  loading.value = true
  try {
    const newVisit = await visitsApi.createVisit({
      patient_id: props.patient.id,
      doctor_id: props.doctorId,
      doctor_name: props.doctorName
    })

    visits.value.unshift(newVisit)
    selectedVisitId.value = newVisit.id
    await loadOdontogram(newVisit.id)

    toast.success(t('odontogram.toastVisitStarted'))
  } catch (error) {
    console.error('Failed to create visit:', error)
    toast.error(t('odontogram.errorCreateVisit'))
  } finally {
    loading.value = false
  }
}

const completeCurrentVisit = async () => {
  if (!currentVisit.value) return

  // Save odontogram first if there are changes
  if (hasChanges.value) {
    await saveOdontogram()
  }

  loading.value = true
  try {
    if (visitServices.value.length === 0) {
      visitServices.value = await visitServicesApi.getVisitServicesByVisitId(currentVisit.value.id)
    }
    const totalPrice = totalBill.value

    // Odontogrammani yakunlash - data ichiga status va completed_at qo'shamiz
    if (currentOdontogram.value?.id) {
      try {
        const completedData = {
          ...currentOdontogram.value.data,
          _status: 'completed',
          _completed_at: new Date().toISOString()
        }
        await odontogramApi.updateOdontogramSnapshot(currentOdontogram.value.id, completedData)
        currentOdontogram.value.data = completedData
      } catch (err) {
        console.warn('Failed to mark odontogram as completed:', err)
      }
    }

    await visitsApi.updateVisit(currentVisit.value.id, {
      status: 'completed_paid',
      price: totalPrice,
      paid_amount: totalPrice,
      debt_amount: null
    })
    currentVisit.value.status = 'completed_paid'
    currentVisit.value.price = totalPrice
    currentVisit.value.paid_amount = totalPrice

    if (totalPrice > 0) {
      const existingPayments = await getPaymentsByVisitId(currentVisit.value.id)
      const netPaid = existingPayments.reduce((sum, entry) => {
        const amount = Number(entry.amount) || 0
        return sum + (entry.payment_type === 'refund' ? -amount : amount)
      }, 0)

      if (netPaid < totalPrice) {
        await createPayment({
          visit_id: currentVisit.value.id,
          patient_id: props.patient.id,
          doctor_id: props.doctorId,
          amount: totalPrice - netPaid,
          payment_type: 'payment',
          method: 'cash',
          note: 'Odontogramma yakunlandi'
        })
      }
    }

    // Update in list
    const index = visits.value.findIndex(v => v.id === currentVisit.value.id)
    if (index !== -1) {
      visits.value[index].status = 'completed_paid'
      visits.value[index].price = totalPrice
      visits.value[index].paid_amount = totalPrice
    }

    toast.success(t('odontogram.toastVisitCompleted'))

    // Telegram habar yuborish (async, xatolarni ushlamaydi)
    try {
      const discountPercent = currentVisit.value.discount_percent || 0
      const paidAmount = totalPrice
      const debtAmount = Number(currentVisit.value.debt_amount) || 0

      const totalBeforeDiscount = discountPercent > 0
        ? Math.round(totalPrice / (1 - discountPercent / 100))
        : totalPrice

      const visitDate = currentVisit.value.date
        ? new Date(currentVisit.value.date).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

      const services = visitServices.value.map(vs => ({
        name: vs.service_name || 'Xizmat',
        price: Number(vs.price) || 0,
        tooth: vs.tooth_id || null
      }))

      await sendVisitCompleted({
        patientId: String(props.patient.id),
        doctorName: currentVisit.value.doctor_name || 'Shifokor',
        doctorPhone: currentVisit.value.doctor_phone || null,
        visitDate,
        services,
        discount: discountPercent,
        totalBeforeDiscount,
        totalAfterDiscount: totalPrice,
        paid: paidAmount,
        remaining: debtAmount
      })

      const followUpResult = await schedulePatientFollowUps({
        patientId: String(props.patient.id),
        patientName: props.patient?.full_name || props.patient?.name || null,
        phone: props.patient?.phone || null,
        notes: 'Visit completed from odontogram'
      })

      if (!followUpResult.ok) {
        console.warn('⚠️ Follow-up xabarlar rejalashtirilmadi:', followUpResult.error)
      } else {
        console.log(`✅ Follow-up xabarlar rejalashtirildi: ${followUpResult.scheduledCount || 0}`)
      }

      console.log('✅ Telegram habar yuborildi')
    } catch (telegramError) {
      console.warn('⚠️ Telegram habar yuborilmadi (asosiy jarayon davom etadi):', telegramError)
    }
  } catch (error) {
    console.error('Failed to complete visit:', error)
    toast.error(t('odontogram.errorCompleteVisit'))
  } finally {
    loading.value = false
  }
}

const openStatusMenu = ({ id, rect }) => {
  if (!canEdit.value) return
  selectedToothId.value = id
  menuOpen.value = true
  ignoreClose.value = true
  menuStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.bottom + 8}px`,
    transform: 'translate(-50%, 0)'
  }
  setTimeout(() => {
    ignoreClose.value = false
  }, 0)
}

const closeStatusMenu = () => {
  menuOpen.value = false
  selectedToothId.value = null
}

const autoSaveOdontogramTimer = ref(null)

const setToothStatus = (status, serviceId = null) => {
  if (!selectedToothId.value) return
  const tid = selectedToothId.value
  teeth.value = teeth.value.map((t) =>
    t.id === tid ? { ...t, status, service_id: serviceId } : t
  )

  if (currentOdontogram.value) {
    if (!currentOdontogram.value.data.teeth) {
      currentOdontogram.value.data.teeth = {}
    }
    const key = String(tid)
    const teethData = currentOdontogram.value.data.teeth

    if (status === 'healthy') {
      if (teethData[key] !== undefined) delete teethData[key]
      if (teethData[tid] !== undefined) delete teethData[tid]
    } else {
      const existing = teethData[key] || teethData[tid] || { note: '' }
      const update = { ...existing, state: status }
      if (serviceId != null) update.service_id = serviceId
      else if ('service_id' in update) delete update.service_id
      teethData[key] = update
    }

    // Har bir tish o'zgarishida Supabase'ga avto-save (ranglar o'chmasin)
    if (autoSaveOdontogramTimer.value) clearTimeout(autoSaveOdontogramTimer.value)
    autoSaveOdontogramTimer.value = setTimeout(() => {
      autoSaveOdontogramTimer.value = null
      if (currentOdontogram.value?.id) {
        odontogramApi.updateOdontogramSnapshot(currentOdontogram.value.id, currentOdontogram.value.data)
          .then(() => {
            originalOdontogramData.value = JSON.parse(JSON.stringify(currentOdontogram.value.data))
          })
          .catch(err => console.warn('Odontogramma avto-save xatosi:', err))
      }
    }, 400)
  }

  closeStatusMenu()
}

const applyMenuSelection = async (option) => {
  if (!selectedToothId.value) return

  if (option.type === 'status' || option.status) {
    const status = option.status || option.value
    // healthy yoki missing (olib tashlash) — visit_service o'chiriladi, to'lovlarda ham yo'q bo'ladi
    if ((status === 'healthy' || status === 'missing') && currentVisit.value?.id) {
      try {
        await visitServicesApi.deleteVisitServicesByVisitAndTooth(currentVisit.value.id, selectedToothId.value)
        // visitServices ni qayta yuklash - narx darhol yangilanishi uchun
        visitServices.value = await visitServicesApi.getVisitServicesByVisitId(currentVisit.value.id)
      } catch (err) {
        console.error('Failed to remove visit services:', err)
        // Xato bo'lsa ham, local state ni yangilaymiz
        visitServices.value = visitServices.value.filter(
          (e) => !(Number(e.visit_id) === Number(currentVisit.value.id) && Number(e.tooth_id) === Number(selectedToothId.value))
        )
      }
    }
    setToothStatus(status)
  }

  if (option.type === 'service') {
    const tid = selectedToothId.value
    if (currentVisit.value?.id) {
      try {
        await visitServicesApi.deleteVisitServicesByVisitAndTooth(currentVisit.value.id, tid)
        // Eski xizmatlarni o'chirib, yangisini qo'shamiz
      } catch (err) {
        console.error('Failed to remove old visit services:', err)
      }
    }
    const status = option.inferredStatus || 'filling'
    setToothStatus(status, option.value)
    await addHistoryEntry({
      toothId: tid,
      serviceName: option.labelKey ? t(option.labelKey) : option.label,
      price: option.price || 0
    })
    // visitServices ni qayta yuklash - narx yangilanishi uchun
    if (currentVisit.value?.id) {
      try {
        visitServices.value = await visitServicesApi.getVisitServicesByVisitId(currentVisit.value.id)
      } catch (err) {
        console.error('Failed to reload visit services:', err)
      }
    }
  }

  closeStatusMenu()
}

const saveOdontogram = async () => {
  if (!currentOdontogram.value) return

  saving.value = true
  try {
    await odontogramApi.updateOdontogramSnapshot(currentOdontogram.value.id, currentOdontogram.value.data)
    originalOdontogramData.value = JSON.parse(JSON.stringify(currentOdontogram.value.data))
    toast.success('Odontogramma saqlandi!')
  } catch (error) {
    console.error('Failed to save odontogram:', error)
    toast.error(t('odontogram.errorSaveOdontogram'))
  } finally {
    saving.value = false
  }
}

const handleDocumentClick = (event) => {
  if (ignoreClose.value) return
  if (menuRef.value && menuRef.value.contains(event.target)) return
  closeStatusMenu()
}

const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeStatusMenu()
  }
}

// Lifecycle
onMounted(async () => {
  await loadVisits()
  // Agar initialVisitId berilgan bo'lsa, uni tanlash
  if (props.initialVisitId) {
    const visitId = String(props.initialVisitId)
    if (visits.value.find(v => String(v.id) === visitId)) {
      selectedVisitId.value = visitId
      await onVisitChange()
    }
  }
  syncTeethFromOdontogram()
  await Promise.all([loadVisitServices(), loadServicesMenu(), loadInventoryItems()])
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('keydown', handleEscape)
})

// Watch for patient change
watch(() => props.patient.id, async () => {
  selectedVisitId.value = ''
  currentVisit.value = null
  currentOdontogram.value = null
  syncTeethFromOdontogram()
  visitServices.value = []
  loadVisits()
})
</script>
