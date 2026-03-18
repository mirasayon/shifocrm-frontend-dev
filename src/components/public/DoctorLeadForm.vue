<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-2">Qabulga yozilish</h2>
    <p class="text-gray-600 mb-6">Ma'lumotlarni kiriting, keyin avtomatik Telegram botga o'tasiz.</p>

    <div class="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900">
      Tanlangan vaqt: <span class="font-semibold">{{ form.preferred_date }} {{ form.preferred_time }}</span>
    </div>

    <form @submit.prevent="submitForm" class="space-y-4">
      <!-- Patient Name -->
      <div>
        <label for="patient_name" class="block text-sm font-medium text-gray-700 mb-1">
          Ism familiya <span class="text-red-500">*</span>
        </label>
        <input
          id="patient_name"
          v-model="form.patient_name"
          type="text"
          placeholder="Masalan: Aliyev Aziz"
          required
          minlength="2"
          maxlength="100"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          :disabled="submitting"
          @blur="validateName"
        />
        <p v-if="errors.patient_name" class="text-red-500 text-sm mt-1">
          {{ errors.patient_name }}
        </p>
      </div>

      <!-- Phone Number -->
      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
          Telefon raqam <span class="text-red-500">*</span>
        </label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          placeholder="+998 XX XXX XX XX"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          :disabled="submitting"
          @blur="validatePhone"
        />
        <p v-if="errors.phone" class="text-red-500 text-sm mt-1">
          {{ errors.phone }}
        </p>
      </div>

      <!-- Preferred visit date/time -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="preferred_date" class="block text-sm font-medium text-gray-700 mb-1">
            Qachon kelasiz? (Sana) <span class="text-red-500">*</span>
          </label>
          <input
            id="preferred_date"
            v-model="form.preferred_date"
            type="date"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            :disabled="submitting"
          />
          <p v-if="errors.preferred_date" class="text-red-500 text-sm mt-1">
            {{ errors.preferred_date }}
          </p>
        </div>
        <div>
          <label for="preferred_time" class="block text-sm font-medium text-gray-700 mb-1">
            Qachon kelasiz? (Vaqt) <span class="text-red-500">*</span>
          </label>
          <input
            id="preferred_time"
            v-model="form.preferred_time"
            type="time"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            :disabled="submitting"
          />
          <p v-if="errors.preferred_time" class="text-red-500 text-sm mt-1">
            {{ errors.preferred_time }}
          </p>
        </div>
      </div>

      <!-- Quick slot chooser -->
      <div v-if="availableSlots.length > 0" class="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
        <p class="text-sm font-medium text-indigo-900 mb-2">Tez tanlash (bo'sh vaqtlar)</p>
        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
          <div v-for="day in availableSlots" :key="day.date">
            <p class="text-xs text-indigo-800 mb-1">{{ day.label }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="slot in day.slots"
                :key="`${day.date}-${slot.start}`"
                type="button"
                @click="selectQuickSlot(day.date, slot.start)"
                class="px-2.5 py-1 text-xs rounded-full border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100"
              >
                {{ slot.start }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Service Selection -->
      <div v-if="services.length > 0">
        <label for="selected_service" class="block text-sm font-medium text-gray-700 mb-1">
          Xizmat (ixtiyoriy)
        </label>
        <select
          id="selected_service"
          v-model="form.selected_service"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          :disabled="submitting"
        >
          <option value="">Xizmatni tanlang...</option>
          <option v-for="service in services" :key="service.id" :value="service.name">
            {{ service.name }}
            <span v-if="service.price">({{ formatPrice(service.price) }})</span>
          </option>
        </select>
      </div>

      <!-- Additional Info -->
      <div>
        <label for="note" class="block text-sm font-medium text-gray-700 mb-1">
          Qo'shimcha izoh (ixtiyoriy)
        </label>
        <textarea
          id="note"
          v-model="form.note"
          placeholder="Qisqacha izoh qoldirishingiz mumkin"
          maxlength="500"
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          :disabled="submitting"
        ></textarea>
        <p class="text-gray-500 text-xs mt-1">
          {{ form.note.length }}/500 belgi
        </p>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="submitting"
        class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
      >
        <span v-if="submitting" class="animate-spin">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </span>
        {{ submitting ? 'Yuborilmoqda...' : 'Davom etish (Telegram bot)' }}
      </button>
    </form>

    <!-- Success Message -->
    <div v-if="successMessage" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
      <p class="text-green-900 text-center">
        ✓ {{ successMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { createLead } from '@/api/leadsApi'

const TELEGRAM_BOT_URL = 'https://t.me/shifocrm_bot'

const props = defineProps({
  doctorId: {
    type: Number,
    required: true
  },
  clinicId: {
    type: Number,
    required: true
  },
  services: {
    type: Array,
    default: () => []
  },
  availableSlots: {
    type: Array,
    default: () => []
  },
  initialDate: {
    type: String,
    default: ''
  },
  initialTime: {
    type: String,
    default: ''
  }
})

const toast = useToast()

const form = ref({
  patient_name: '',
  phone: '',
  preferred_date: props.initialDate || '',
  preferred_time: props.initialTime || '',
  selected_service: '',
  note: ''
})

const errors = ref({
  patient_name: '',
  phone: '',
  preferred_date: '',
  preferred_time: ''
})

const submitting = ref(false)
const successMessage = ref('')

watch(() => props.initialDate, (value) => {
  if (value) form.value.preferred_date = value
})

watch(() => props.initialTime, (value) => {
  if (value) form.value.preferred_time = value
})

const validateName = () => {
  errors.value.patient_name = ''
  const name = form.value.patient_name.trim()
  if (!name) {
    errors.value.patient_name = 'Ism talab qilinadi'
  } else if (name.length < 2) {
    errors.value.patient_name = 'Ism kamida 2 belgidan iborat bo\'lsin'
  }
}

const validatePhone = () => {
  errors.value.phone = ''
  const phone = form.value.phone.trim()
  if (!phone) {
    errors.value.phone = 'Telefon talab qilinadi'
  } else if (!/[0-9]/.test(phone)) {
    errors.value.phone = 'Telefon raqamda son bo\'lishi kerak'
  }
}

const validatePreferredDateTime = () => {
  errors.value.preferred_date = ''
  errors.value.preferred_time = ''
  if (!form.value.preferred_date) {
    errors.value.preferred_date = 'Sana talab qilinadi'
  }
  if (!form.value.preferred_time) {
    errors.value.preferred_time = 'Vaqt talab qilinadi'
  }
}

const selectQuickSlot = (date, time) => {
  form.value.preferred_date = String(date || '')
  form.value.preferred_time = String(time || '')
  errors.value.preferred_date = ''
  errors.value.preferred_time = ''
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'UZS'
  }).format(price)
}

const submitForm = async () => {
  // Validate
  validateName()
  validatePhone()
  validatePreferredDateTime()

  if (errors.value.patient_name || errors.value.phone || errors.value.preferred_date || errors.value.preferred_time) {
    return
  }

  submitting.value = true
  try {
    await createLead({
      doctor_id: props.doctorId,
      clinic_id: props.clinicId,
      patient_name: form.value.patient_name.trim(),
      phone: form.value.phone.trim(),
      preferred_date: form.value.preferred_date,
      preferred_time: form.value.preferred_time,
      selected_service: form.value.selected_service || null,
      note: form.value.note.trim() || null
    })

    successMessage.value = 'So\'rov qabul qilindi. Telegram botga yo\'naltirilmoqda...'
    toast.success('So\'rov yuborildi. Botga o\'tilmoqda...')

    // Reset form
    form.value = {
      patient_name: '',
      phone: '',
      preferred_date: '',
      preferred_time: '',
      selected_service: '',
      note: ''
    }
    errors.value = {
      patient_name: '',
      phone: '',
      preferred_date: '',
      preferred_time: ''
    }

    // Hide success message after 5 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
  } catch (error) {
    console.error('Error submitting form:', error)
    toast.error('So\'rovni saqlashda xatolik. Telegram botga o\'tasiz...')
  } finally {
    window.location.href = TELEGRAM_BOT_URL
    submitting.value = false
  }
}
</script>
