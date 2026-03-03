/**
 * Patient Status Constants
 * Bemorlar uchun status konstantalari va konfiguratsiyasi
 */

export const PATIENT_STATUSES = {
  WAITING: 'waiting',
  IN_CONSULTATION: 'in_consultation',
  COMPLETED: 'completed',
  DEBT: 'debt'
}

const LEGACY_STATUS_MAP = {
  active: PATIENT_STATUSES.WAITING,
  inactive: PATIENT_STATUSES.WAITING,
  follow_up: PATIENT_STATUSES.WAITING,
  archived: PATIENT_STATUSES.COMPLETED,
  deceased: PATIENT_STATUSES.COMPLETED,
  blocked: PATIENT_STATUSES.COMPLETED
}

export const normalizePatientStatus = (status) => {
  if (!status) return PATIENT_STATUSES.WAITING
  if (Object.values(PATIENT_STATUSES).includes(status)) return status
  return LEGACY_STATUS_MAP[status] || PATIENT_STATUSES.WAITING
}

/**
 * Status konfiguratsiyasi
 * Har bir status uchun: matn, rang, tooltip, icon
 */
import i18n from '@/i18n'

export const PATIENT_STATUS_CONFIG = {
  [PATIENT_STATUSES.WAITING]: {
    labelKey: 'patients.statusWaiting',
    descriptionKey: 'patients.statusWaitingDesc',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
    icon: 'clock',
    order: 1
  },
  [PATIENT_STATUSES.IN_CONSULTATION]: {
    labelKey: 'patients.statusInConsultation',
    descriptionKey: 'patients.statusInConsultationDesc',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
    icon: 'user-circle',
    order: 2
  },
  [PATIENT_STATUSES.COMPLETED]: {
    labelKey: 'patients.statusCompleted',
    descriptionKey: 'patients.statusCompletedDesc',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    icon: 'check-circle',
    order: 3
  },
  [PATIENT_STATUSES.DEBT]: {
    labelKey: 'patients.statusDebt',
    descriptionKey: 'patients.statusDebtDesc',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    icon: 'exclamation-circle',
    order: 4
  }
}

/**
 * Status konfiguratsiyasini olish
 * @param {string} status - Status kodi
 * @returns {object} - Status konfiguratsiyasi
 */
export const getPatientStatusConfig = (status) => {
  const normalizedStatus = normalizePatientStatus(status)
  const config = PATIENT_STATUS_CONFIG[normalizedStatus]
  if (config) {
    return {
      ...config,
      label: i18n.global.t(config.labelKey),
      description: i18n.global.t(config.descriptionKey)
    }
  }

  return {
    label: status || i18n.global.t('patients.statusUnknown'),
    description: i18n.global.t('patients.statusUnknownDesc'),
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-300',
    icon: 'question-mark',
    order: 999
  }
}

/**
 * Status matnini olish
 * @param {string} status - Status kodi
 * @returns {string} - Status matni
 */
export const getPatientStatusLabel = (status) => {
  return getPatientStatusConfig(status).label
}

/**
 * Status ranglarini olish
 * @param {string} status - Status kodi
 * @returns {object} - { bgClass, textClass, borderClass }
 */
export const getPatientStatusColors = (status) => {
  const config = getPatientStatusConfig(status)
  return {
    bgClass: config.bgClass,
    textClass: config.textClass,
    borderClass: config.borderClass
  }
}
