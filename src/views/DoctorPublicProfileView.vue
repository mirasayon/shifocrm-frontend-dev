<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Error State -->
    <div v-if="error" class="max-w-2xl mx-auto px-4 py-12">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h1 class="text-2xl font-bold text-red-900 mb-2">Doktor topilmadi</h1>
        <p class="text-red-700">{{ error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="max-w-2xl mx-auto px-4 py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Doktor ma'lumotlari yuklanmoqda...</p>
      </div>
    </div>

    <!-- Doctor Profile -->
    <div v-else-if="doctor" class="max-w-2xl mx-auto px-4 py-8">
      <!-- Doctor Card -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-32"></div>

        <div class="px-6 pb-6">
          <!-- Avatar and Name -->
          <div class="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-6">
            <img
              v-if="doctor.public_avatar_url"
              :src="doctor.public_avatar_url"
              :alt="doctor.full_name"
              class="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
            />
            <div v-else class="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-3xl text-gray-400">
              👨‍⚕️
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900">{{ doctor.full_name }}</h1>
              <p class="text-indigo-600 font-semibold">{{ doctor.specialization || 'Shifokor' }}</p>
              <p v-if="clinic" class="text-gray-600 text-sm">{{ clinic.name }}</p>
            </div>
          </div>

          <!-- Bio -->
          <p v-if="doctor.public_bio" class="text-gray-700 mb-6 leading-relaxed">
            {{ doctor.public_bio }}
          </p>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-3 mb-8">
            <!-- Call Button -->
            <a
              :href="`tel:${doctor.public_phone || doctor.public_whatsapp}`"
              class="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.058.3.102.605.102.924v1.902c0 .876.669 1.755 1.577 2.113C7.839 10.93 9.287 11 11 11c1.713 0 3.161-.07 4.684-.512.908-.358 1.577-1.237 1.577-2.113V8.038c0-.32.044-.625.102-.924l-1.548-.773a1 1 0 01-.54-1.06l.74-4.435A1 1 0 0116.847 2H19a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
              </svg>
              Qo'ng'iroq
            </a>

            <!-- Telegram Button -->
            <a
              v-if="doctor.public_telegram"
              :href="`https://t.me/${doctor.public_telegram.replace('@', '')}`"
              target="_blank"
              class="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295-.042 0-.084 0-.127-.01l.214-3.053 5.56-5.023c.242-.213-.054-.328-.373-.115l-6.869 4.332-2.96-.924c-.644-.203-.658-.644.135-.954l11.566-4.458c.538-.197 1.006.128.832 1.584z" />
              </svg>
              Telegram
            </a>

            <!-- WhatsApp Button -->
            <a
              v-if="doctor.public_whatsapp"
              :href="`https://wa.me/${doctor.public_whatsapp.replace(/[^0-9]/g, '')}`"
              target="_blank"
              class="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.96 0-3.87.735-5.285 2.066-.722.671-1.301 1.494-1.726 2.438-.424.944-.648 1.95-.648 3.01 0 1.06.224 2.066.648 3.01.425.944 1.004 1.767 1.726 2.438 1.415 1.331 3.325 2.066 5.285 2.066 1.96 0 3.87-.735 5.285-2.066.722-.671 1.301-1.494 1.726-2.438.424-.944.648-1.95.648-3.01 0-1.06-.224-2.066-.648-3.01-.425-.944-1.004-1.767-1.726-2.438-1.415-1.331-3.325-2.066-5.285-2.066" />
              </svg>
              WhatsApp
            </a>

            <!-- Share Button -->
            <button
              @click="shareProfile"
              class="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C9.769 15.169 11.676 16.5 14 16.5c1.502 0 2.927-.585 3.978-1.594m-6.14-9.270A9.956 9.956 0 0112 3c4.478 0 8.268 2.943 9.542 7m-9.542 0a48.255 48.255 0 00-4.404-9.745m0 0a48.392 48.392 0 014.595 9.75" />
              </svg>
              Ulashish
            </button>
          </div>
        </div>
      </div>

      <!-- Available slots -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Bo'sh vaqtlar</h2>
        <div v-if="availableSlots.length === 0" class="text-sm text-gray-500">
          Hozircha bo'sh vaqtlar topilmadi. Formani to'ldiring, operator siz bilan bog'lanadi.
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="day in availableSlots"
            :key="day.date"
            class="border border-gray-200 rounded-lg p-3"
          >
            <div class="text-sm font-semibold text-gray-800 mb-2">{{ day.label }}</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="slot in day.slots"
                :key="`${day.date}-${slot.start}`"
                type="button"
                @click="pickSlot(day.date, slot.start)"
                class="px-3 py-1.5 text-xs rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                {{ slot.start }} - {{ slot.end }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!hasSelectedSlot" class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-indigo-900 mb-8">
        Bo'sh vaqtni tanlang — shundan keyin qisqa forma chiqadi.
      </div>

      <!-- Lead Form -->
      <DoctorLeadForm
        v-if="hasSelectedSlot"
        :doctor-id="doctor.id"
        :clinic-id="doctor.clinic_id"
        :services="services"
        :available-slots="availableSlots"
        :initial-date="selectedDate"
        :initial-time="selectedTime"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import DoctorLeadForm from '@/components/public/DoctorLeadForm.vue'
import {
  getDoctorByPublicSlug,
  getDoctorServices,
  getDoctorClinicInfo,
  getDoctorAvailableSlots
} from '@/api/doctorsPublicApi'

const route = useRoute()
const toast = useToast()

const doctor = ref(null)
const clinic = ref(null)
const services = ref([])
const availableSlots = ref([])
const selectedDate = ref('')
const selectedTime = ref('')
const loading = ref(true)
const error = ref(null)
const hasSelectedSlot = computed(() => Boolean(selectedDate.value && selectedTime.value))

const shareProfile = async () => {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({
        title: doctor.value.full_name,
        text: `Doktor profili: ${url}`,
        url
      })
    } catch {
      console.log('Share cancelled')
    }
  } else {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Profil havolasi nusxalandi!')
    } catch {
      toast.error('Havolani nusxalab bo\'lmadi')
    }
  }
}

const pickSlot = (date, time) => {
  selectedDate.value = String(date || '')
  selectedTime.value = String(time || '')
  toast.success(`Tanlandi: ${date} ${time}`)
}

onMounted(async () => {
  try {
    loading.value = true
    const slug = route.params.slug

    // Fetch doctor
    const doctorData = await getDoctorByPublicSlug(slug)
    if (!doctorData) {
      error.value = 'Doktor profili topilmadi.'
      return
    }

    doctor.value = doctorData

    // Fetch clinic info
    const clinicData = await getDoctorClinicInfo(doctorData.clinic_id)
    clinic.value = clinicData

    // Fetch services (optional)
    services.value = await getDoctorServices(doctorData.clinic_id)

    // Build dynamic available slots
    availableSlots.value = await getDoctorAvailableSlots({
      doctorId: doctorData.id,
      workSchedule: doctorData.work_schedule,
      daysAhead: 14,
      slotMinutes: 30
    })
  } catch (err) {
    console.error('Error loading doctor profile:', err)
    error.value = 'Profilni yuklashda xatolik. Qayta urinib ko\'ring.'
  } finally {
    loading.value = false
  }
})
</script>
