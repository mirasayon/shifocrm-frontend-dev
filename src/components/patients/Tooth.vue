<template>
  <div class="relative flex flex-col items-center gap-0.5 sm:gap-1 tooth-cell">
    <span class="text-[9px] sm:text-[10px] text-slate-500 leading-none">{{ id }}</span>
    <button
      ref="buttonRef"
      type="button"
      :disabled="disabled"
      class="transition-transform duration-150 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-60 touch-manipulation min-w-[40px] min-h-[48px] sm:min-w-0 sm:min-h-0 overflow-hidden"
      :class="statusContainerClass"
      :style="toothStyle"
      @click="handleSelect"
    >
      <img
        v-if="svgLoaded"
        :src="toothSrc"
        :alt="`Tooth ${id}`"
        class="tooth-svg tooth-svg-responsive object-contain"
        :class="[{ 'tooth-svg--service': !!serviceColor }, statusSvgClass]"
        @error="onImgError"
      />
      <div
        v-else
        class="tooth-fallback flex items-center justify-center w-full h-full min-h-[48px] sm:min-h-[64px] text-white text-xs font-bold"
        :class="fallbackClass"
      >
        {{ id }}
      </div>

      <div class="absolute inset-0 pointer-events-none z-10">
        <div v-if="status === 'caries'" class="caries-overlay">
          <span class="caries-dot dot-1"></span>
          <span class="caries-dot dot-2"></span>
          <span class="caries-dot dot-3"></span>
        </div>

        <div v-else-if="status === 'filled' || status === 'filling'" class="absolute inset-0 flex items-center justify-center">
          <span class="filled-mark"></span>
        </div>

        <div v-else-if="status === 'crown'" class="absolute inset-0 flex items-center justify-center">
          <div class="crown-mark-wrapper">
            <span class="crown-mark"></span>
            <span class="crown-text">I</span>
          </div>
        </div>

        <div v-else-if="status === 'root_canal'" class="absolute inset-0 flex items-center justify-center">
          <span class="root-mark"></span>
        </div>

        <div v-else-if="status === 'missing'" class="missing-overlay">
          <span class="missing-line line-1"></span>
          <span class="missing-line line-2"></span>
        </div>
      </div>

      <span
        v-if="status !== 'healthy' && status !== 'missing'"
        class="absolute top-0.5 right-0.5 h-3 w-3 rounded-full ring-1 ring-white shadow-md z-20"
        :class="statusDotClass"
      ></span>
    </button>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'healthy'
  },
  /** Xizmatlar bo'limida sozlangan rang (hex) — mavjud bo'lsa status rangini almashtiradi */
  serviceColor: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
})

const emit = defineEmits(['select'])

const buttonRef = ref(null)
const svgLoaded = ref(true)

const toothSrc = computed(() => `/teeth/${props.id}.svg`)

const statusSvgClass = computed(() => {
  if (props.status === 'missing') return 'opacity-25 grayscale'
  return ''
})

const statusDotClass = computed(() => {
  switch (props.status) {
    case 'caries':
      return 'bg-slate-900'
    case 'filled':
    case 'filling':
      return 'bg-blue-500'
    case 'crown':
      return 'bg-amber-500'
    case 'root_canal':
      return 'bg-violet-500'
    case 'missing':
      return 'bg-slate-400'
    default:
      return 'bg-emerald-500'
  }
})

// Xizmat rangi — SVG va/yoki fon uchun (tanlangan tish aniq ko'rinsin)
const toothStyle = computed(() => {
  if (props.serviceColor) {
    return {
      '--tooth-service-color': props.serviceColor,
      backgroundColor: `${props.serviceColor}25`,
      borderColor: props.serviceColor,
      borderWidth: '2px'
    }
  }
  return null
})

const statusContainerClass = computed(() => {
  if (props.serviceColor) {
    return '' // toothStyle background va border beradi
  }
  switch (props.status) {
    case 'caries':
      return 'bg-red-50'
    case 'filling':
    case 'filled':
      return 'bg-blue-50'
    case 'missing':
      return 'bg-slate-50'
    case 'crown':
      return 'bg-amber-50'
    case 'root_canal':
      return 'bg-violet-50'
    default:
      return 'bg-white'
  }
})

// SVG yo'q bo'lganda tanlangan tish uchun rangli fallback
const fallbackClass = computed(() => {
  if (props.serviceColor) return 'tooth-fallback--service'
  switch (props.status) {
    case 'caries':
      return 'bg-red-500'
    case 'filling':
    case 'filled':
      return 'bg-blue-500'
    case 'missing':
      return 'bg-slate-400'
    case 'crown':
      return 'bg-amber-500'
    case 'root_canal':
      return 'bg-violet-500'
    default:
      return 'bg-slate-200 text-slate-500'
  }
})

const onImgError = () => {
  svgLoaded.value = false
}

const handleSelect = () => {
  if (!buttonRef.value) return
  const rect = buttonRef.value.getBoundingClientRect()
  emit('select', { id: props.id, rect })
}

watch(() => props.id, () => {
  svgLoaded.value = true
})
</script>

<style scoped>
.tooth-svg {
  width: 56px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
}

@media (max-width: 768px) {
  .tooth-svg-responsive {
    width: 40px;
    height: 52px;
    padding: 4px 3px;
  }
}

.tooth-svg :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

/* Xizmatlar bo'limida sozlangan rang — status rangini almashtiradi */
.tooth-svg--service {
  filter: drop-shadow(0 0 1px color-mix(in oklab, var(--tooth-service-color), #000 12%));
}

.tooth-fallback--service {
  background: var(--tooth-service-color) !important;
}

.caries-overlay {
  position: absolute;
  inset: 0;
}

.caries-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #1f2937;
  box-shadow: 0 0 0 1px #ffffff, 0 2px 4px rgba(0, 0, 0, 0.3);
}

.dot-1 {
  top: 32%;
  left: 42%;
}

.dot-2 {
  top: 48%;
  left: 52%;
}

.dot-3 {
  top: 42%;
  left: 33%;
}

.filled-mark {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border: 2px solid #ffffff;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.5);
}

.crown-mark-wrapper {
  position: relative;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crown-mark {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid #f59e0b;
  border-radius: 9999px;
  background: color-mix(in srgb, #f59e0b 15%, transparent);
  box-shadow: 0 0 0 2px #fef3c7, 0 2px 8px rgba(245, 158, 11, 0.5);
}

.crown-text {
  position: relative;
  z-index: 1;
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 255, 255, 0.8);
}

.root-mark {
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: #a855f7;
  box-shadow: 0 0 0 2px #ffffff, 0 2px 6px rgba(168, 85, 247, 0.5);
  border: 1px solid #9333ea;
}

.missing-overlay {
  position: absolute;
  inset: 0;
}

.missing-line {
  position: absolute;
  top: 50%;
  left: 20%;
  width: 60%;
  height: 3px;
  background: #dc2626;
  transform-origin: center;
  box-shadow: 0 0 0 1px #ffffff, 0 2px 4px rgba(220, 38, 38, 0.4);
}

.line-1 {
  transform: rotate(35deg);
}

.line-2 {
  transform: rotate(-35deg);
}
</style>
