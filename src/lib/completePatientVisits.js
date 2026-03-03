/**
 * Umumiy funksiya: bemorning barcha tashriflarini yakunlash
 * Xizmatlar va materiallar bo'yicha hisoblab, to'lov yozadi va tashriflarni yakunlaydi
 */

import { createPayment, getPaymentsByVisitId } from '@/api/paymentsApi'
import { getVisitServicesByVisitId, getVisitServicesByPatientId } from '@/api/visitServicesApi'
import { updateVisit, getVisitsByPatientId } from '@/api/visitsApi'
import { listInventoryConsumptionsByVisitId, listInventoryItems } from '@/api/inventoryApi'
import { updatePatient } from '@/api/patientsApi'

const parsePrice = (v) => {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(String(v).replace(/\s|,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : 0
}

const getItemPrice = (itemId, inventoryItems) => {
  const match = inventoryItems.find(item => Number(item.id) === Number(itemId))
  return match ? (Number(match.cost_price) || 0) : 0
}

const getVisitServicesTotal = (visitId, services) => {
  const byVisit = services.filter(s => Number(s.visit_id) === Number(visitId))
  if (!byVisit.length) return 0

  const seen = new Set()
  let sum = 0
  const sorted = [...byVisit].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  for (const entry of sorted) {
    const toothId = entry.tooth_id
    if (toothId == null) continue
    const key = `t${toothId}`
    if (seen.has(key)) continue
    seen.add(key)
    sum += parsePrice(entry.price)
  }
  return sum
}

const getVisitConsumptionsTotal = async (visitId, inventoryItems) => {
  try {
    const consumptions = await listInventoryConsumptionsByVisitId(visitId)
    return consumptions.reduce((sum, entry) => {
      const qty = Number(entry.quantity) || 0
      const price = getItemPrice(entry.item_id, inventoryItems)
      return sum + qty * price
    }, 0)
  } catch (error) {
    console.error('Failed to load consumptions for visit:', error)
    return 0
  }
}

/**
 * Bemorning barcha tashriflarini yakunlash
 * @param {number} patientId
 * @param {number|null} doctorId
 * @returns {Promise<{success: boolean, completed: number, error?: string, message?: string}>}
 */
export const completeAllPatientVisits = async (patientId, doctorId = null) => {
  try {
    const [visits, services, inventoryItems] = await Promise.all([
      getVisitsByPatientId(patientId),
      getVisitServicesByPatientId(patientId),
      listInventoryItems('order=created_at.desc')
    ])

    let visitsToComplete = visits.filter(v =>
      v.status === 'in_progress' ||
      v.status === 'completed_debt' ||
      (v.status === 'completed_paid' && (Number(v.debt_amount) || 0) > 0)
    )

    if (visitsToComplete.length === 0) {
      const visitIdsWithServices = [...new Set(services.map(s => Number(s.visit_id)).filter(Boolean))]
      visitsToComplete = visits.filter(v => visitIdsWithServices.includes(Number(v.id)))
    }

    if (visitsToComplete.length === 0) {
      return { success: true, completed: 0, message: 'Yakunlash kerak bo\'lgan tashriflar topilmadi' }
    }

    let completedCount = 0

    for (const visit of visitsToComplete) {
      const visitId = visit.id

      let servicesTotal = getVisitServicesTotal(visitId, services)
      if (!servicesTotal) {
        try {
          const freshServices = await getVisitServicesByVisitId(visitId)
          services.push(...freshServices)
          servicesTotal = getVisitServicesTotal(visitId, services)
        } catch (error) {
          console.warn('Failed to refresh visit services for visit', visitId, error)
        }
      }

      const consumptionsTotal = await getVisitConsumptionsTotal(visitId, inventoryItems)
      const totalPrice = servicesTotal + consumptionsTotal
      const targetPrice = totalPrice > 0 ? totalPrice : (Number(visit.price) || 0)

      let netPaid = 0
      try {
        const existingPayments = await getPaymentsByVisitId(visitId)
        netPaid = existingPayments.reduce((sum, entry) => {
          const amount = Number(entry.amount) || 0
          return sum + (entry.payment_type === 'refund' ? -amount : amount)
        }, 0)
      } catch (error) {
        console.warn('Failed to load payments for visit', visitId, error)
      }

      if (targetPrice > 0 && netPaid < targetPrice) {
        try {
          await createPayment({
            visit_id: visitId,
            patient_id: Number(patientId),
            doctor_id: doctorId || visit.doctor_id || null,
            amount: targetPrice - netPaid,
            payment_type: 'payment',
            method: 'cash',
            note: 'Yakunlash orqali avtomatik to\'lov'
          })
          netPaid = targetPrice
        } catch (error) {
          console.error('Failed to create auto payment for visit', visitId, error)
        }
      }

      await updateVisit(visitId, {
        status: 'completed_paid',
        price: targetPrice || null,
        paid_amount: netPaid || targetPrice || null,
        debt_amount: null
      })

      completedCount++
    }

    try {
      await updatePatient(patientId, { status: 'completed' })
    } catch (error) {
      console.warn('Failed to update patient status:', error)
    }

    return { success: true, completed: completedCount }
  } catch (error) {
    console.error('Failed to complete patient visits:', error)
    return { success: false, completed: 0, error: error.message || 'Xatolik yuz berdi' }
  }
}
