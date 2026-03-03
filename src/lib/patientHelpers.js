/**
 * Patient helper utilities
 */
import i18n from '@/i18n'
import { normalizePatientStatus, PATIENT_STATUSES } from '@/constants/patientStatus'
import { getVisitStatusLabel, getVisitStatusColors } from '@/constants/visitStatus'

/**
 * Ismdan initiallar olish (2 ta harf)
 * @param {string} name - To'liq ism
 * @returns {string} - Initiallar
 */
export const getInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Jinsi kodini o'zbekchaga o'girish
 * @param {string} gender - male/female
 * @returns {string} - Erkak/Ayol/-
 */
export const formatGender = (gender) => {
  if (gender === 'male') return i18n.global.t('patients.genderMale')
  if (gender === 'female') return i18n.global.t('patients.genderFemale')
  return '-'
}

/**
 * Telefon raqamini formatlash
 * @param {string} phone - Telefon raqami
 * @returns {string} - Formatlangan telefon
 */
export const formatPhone = (phone) => {
  if (!phone) return '-'
  return phone.replace(/\s+/g, ' ').trim()
}

/**
 * MED-ID formatlash
 * @param {number|string} id - Bemor ID
 * @returns {string} - #12345 formatida
 */
export const formatMedId = (id) => {
  if (!id) return '-'
  return `#${String(id).padStart(5, '0')}`
}

/**
 * Status badge rangi va matni
 * @param {string} status - active/inactive
 * @returns {object} - { text, bgClass, textClass }
 */
export const getStatusBadge = (status) => {
  const normalized = normalizePatientStatus(status)

  if (normalized === PATIENT_STATUSES.WAITING) {
    return {
      text: i18n.global.t('patients.statusWaiting'),
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-700'
    }
  }

  if (normalized === PATIENT_STATUSES.IN_CONSULTATION) {
    return {
      text: i18n.global.t('patients.statusInConsultation'),
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-700'
    }
  }

  return {
    text: i18n.global.t('patients.statusCompleted'),
    bgClass: 'bg-green-100',
    textClass: 'text-green-700'
  }
}

/**
 * Visit status badge (DEPRECATED - use VisitStatusBadge component instead)
 * @deprecated Use VisitStatusBadge component from @/components/ui/VisitStatusBadge.vue
 * @param {string} status - Visit status
 * @returns {object}
 */
export const getVisitStatusBadge = (status) => {
  const colors = getVisitStatusColors(status)
  return {
    text: getVisitStatusLabel(status),
    bgClass: colors.bgClass,
    textClass: colors.textClass
  }
}
