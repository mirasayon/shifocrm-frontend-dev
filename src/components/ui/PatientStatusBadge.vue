<template>
  <div class="relative inline-block">
    <span
      :class="[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.bgClass,
        config.textClass,
        config.borderClass,
        { 'cursor-pointer hover:opacity-80': showTooltip }
      ]"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <!-- Icon -->
      <component
        :is="iconComponent"
        v-if="showIcon"
        :class="['w-3.5 h-3.5', config.textClass]"
      />

      <!-- Label -->
      <span>{{ config.label }}</span>
    </span>

    <!-- Tooltip -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showTooltip && config.description"
        class="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
      >
        {{ config.description }}
        <!-- Arrow -->
        <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div class="w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  CheckCircleIcon,
  ClockIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'
import { getPatientStatusConfig } from '@/constants/patientStatus'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => typeof value === 'string' && value.length > 0
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  showTooltip: {
    type: Boolean,
    default: true
  }
})

const showTooltip = ref(false)

const config = computed(() => getPatientStatusConfig(props.status))

const iconComponent = computed(() => {
  const iconMap = {
    'check-circle': CheckCircleIcon,
    clock: ClockIcon,
    'user-circle': UserCircleIcon,
    'exclamation-circle': ExclamationCircleIcon,
    'question-mark': QuestionMarkCircleIcon
  }
  return iconMap[config.value.icon] || QuestionMarkCircleIcon
})
</script>
