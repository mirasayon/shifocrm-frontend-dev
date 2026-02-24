<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />

      <!-- Panel -->
      <div
        class="relative w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right"
        :class="{ 'rounded-l-2xl': !isMobile }"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <SparklesIcon class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-900">{{ t('shifoAI.title') }}</h2>
              <p class="text-xs text-gray-500">{{ t('shifoAI.subtitle') }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="$emit('close')"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Intro -->
        <div class="px-4 py-3 bg-slate-50 border-b border-gray-100">
          <p class="text-sm text-gray-600">
            {{ t('shifoAI.intro') }}
          </p>
        </div>

        <!-- Messages -->
        <div ref="messagesRef" class="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[calc(100vh-320px)]">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              :class="[
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              ]"
            >
              <p class="whitespace-pre-wrap">{{ msg.text }}</p>
            </div>
          </div>
          <div v-if="thinking" class="flex justify-start">
            <div class="bg-gray-100 text-gray-600 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-2">
              <span class="animate-pulse">...</span>
              <span>{{ t('shifoAI.thinking') }}</span>
            </div>
          </div>
        </div>

        <!-- Suggested questions (only when no messages) -->
        <div v-if="messages.length === 0" class="px-4 pb-2 flex flex-wrap gap-2">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
            @click="ask(s)"
          >
            {{ s }}
          </button>
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-gray-100 bg-white">
          <form @submit.prevent="submit" class="flex gap-2">
            <input
              v-model="inputText"
              type="text"
              :placeholder="placeholder"
              class="flex-1 min-w-0 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              :disabled="!inputText.trim() || thinking"
              class="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <PaperAirplaneIcon class="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  open: { type: Boolean, default: false }
})

defineEmits(['close'])

const { t } = useI18n()

const messagesRef = ref(null)
const inputText = ref('')
const thinking = ref(false)
const messages = ref([])

const placeholder = computed(() => t('shifoAI.placeholder'))
const suggestions = computed(() => t('shifoAI.suggestions'))

// Javob kalitini qaytaradi — til t('shifoAI.answers.' + key) orqali tanlanadi (uz/ru)
function getAnswerKey(question) {
  const q = (question || '').toLowerCase().trim()
  if (!q) return 'empty'
  if (/salom|hello|yordam|nima qilish|qanday ishlatish|boshlash|привет|помощь|помоги|как пользоваться|как начать/.test(q)) return 'welcome'
  if (/bemor|patient|пациент|добавить пациента|как добавить|как создать пациента|qo'shish|qanday qo'shiladi|yangi bemor/.test(q)) return 'bemor'
  if (/tashrif|visit|визит|приём|прием|yakunlash|complete|davolanish|davolash|завершить|лечение/.test(q)) return 'tashrif'
  if (/material|sarf|ombor|kirim|chiqim|inventory|harajat|материал|склад|расход|приход|уход/.test(q)) return 'material'
  if (/qarz|debt|qarzdor|qoldiq|долг|задолженность|кредит/.test(q)) return 'qarz'
  if (/hisobot|report|statistika|daromad|filtr|отчет|отчёт|статистика|доход|фильтр/.test(q)) return 'hisobot'
  if (/to'lov|payment|tolov|naqd|karta|o'tkazma|платеж|оплата|наличн|карта|перевод/.test(q)) return 'tolov'
  if (/uchrashuv|qabul|appointment|jadval|taqvim|встреча|приём|прием|запись|расписание|календар/.test(q)) return 'uchrashuv'
  if (/odontogramma|tish|plomba|karies|tish holati|одонтограмм|зуб|пломба|кариес/.test(q)) return 'odontogramma'
  if (/sozlamalar|settings|logo|til|klinika nomi|настройки|настройка|логотип|язык|клиник/.test(q)) return 'sozlamalar'
  if (/doktor|shifokor|doctor|yangi doktor|врач|доктор|добавить врача|как добавить врача/.test(q)) return 'doktor'
  if (/telegram|bot|xabar|register|телеграм|бот|сообщен|регистрац/.test(q)) return 'telegram'
  if (/xizmat|service|narx|narxlari|услуг|цена|прайс/.test(q)) return 'xizmat'
  return 'default'
}

function ask(text) {
  const question = (text || inputText.value || '').trim()
  if (!question) return
  messages.value.push({ role: 'user', text: question })
  inputText.value = ''
  thinking.value = true
  setTimeout(() => {
    const key = getAnswerKey(question)
    const answer = t('shifoAI.answers.' + key)
    messages.value.push({ role: 'assistant', text: answer })
    thinking.value = false
    nextTick(() => {
      if (messagesRef.value) {
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight
      }
    })
  }, 400)
}

function submit() {
  ask(inputText.value)
}

const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 768)
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
}

watch(() => props.open, (isOpen) => {
  if (isOpen && messages.value.length === 0) {
    nextTick(() => {
      if (messagesRef.value) messagesRef.value.scrollTop = 0
    })
  }
})
</script>

<style scoped>
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.animate-slide-in-right {
  animation: slide-in-right 0.2s ease-out;
}
</style>
