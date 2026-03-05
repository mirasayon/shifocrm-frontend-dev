/**
 * @tanstack/vue-query hooks for appointments
 * Handles data fetching, caching, and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'
import {
  getVisitsByDateRange,
  createVisit,
  updateVisit,
  deleteVisit
} from './visitsApi.js'

/**
 * Fetch appointments for date range
 * @param {string} startUtc - UTC ISO string
 * @param {string} endUtc - UTC ISO string
 * @returns Query object with data, isLoading, error
 */
export const useAppointmentsQuery = (startUtc, endUtc) => {
  return useQuery({
    queryKey: ['appointments', startUtc, endUtc],
    queryFn: () => getVisitsByDateRange(startUtc, endUtc),
    enabled: !!startUtc && !!endUtc,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
    retry: 2,
    networkMode: 'online',
  })
}

/**
 * Fetch appointments for specific doctor
 * @param {string} doctorId
 * @param {string} startUtc
 * @param {string} endUtc
 * @returns Query object
 */
export const useDoctorAppointmentsQuery = (doctorId, startUtc, endUtc) => {
  return useQuery({
    queryKey: ['appointments', doctorId, startUtc, endUtc],
    queryFn: () => getVisitsByDateRange(startUtc, endUtc, doctorId),
    enabled: !!doctorId && !!startUtc && !!endUtc,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
    networkMode: 'online',
  })
}

/**
 * Create new appointment
 * @returns Mutation object with mutate, isLoading, error
 */
export const useCreateAppointmentMutation = () => {
  const queryClient = useQueryClient()
  const isLoading = ref(false)
  const error = ref(null)

  const mutation = useMutation({
    mutationFn: async (payload) => {
      isLoading.value = true
      error.value = null
      try {
        return await createVisit(payload)
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to create appointment'
        throw err
      } finally {
        isLoading.value = false
      }
    },
    onSuccess: () => {
      // Invalidate all appointments queries to refetch
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    retry: 1,
  })

  return {
    ...mutation,
    isLoading,
    error,
  }
}

/**
 * Update appointment
 * @param {string} appointmentId
 * @returns Mutation object
 */
export const useUpdateAppointmentMutation = (appointmentId) => {
  const queryClient = useQueryClient()
  const isLoading = ref(false)
  const error = ref(null)

  const mutation = useMutation({
    mutationFn: async (payload) => {
      isLoading.value = true
      error.value = null
      try {
        return await updateVisit(appointmentId, payload)
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to update appointment'
        throw err
      } finally {
        isLoading.value = false
      }
    },
    onSuccess: () => {
      // Invalidate appointments queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    retry: 1,
  })

  return {
    ...mutation,
    isLoading,
    error,
  }
}

/**
 * Delete appointment
 * @param {string} appointmentId
 * @returns Mutation object
 */
export const useDeleteAppointmentMutation = (appointmentId) => {
  const queryClient = useQueryClient()
  const isLoading = ref(false)
  const error = ref(null)

  const mutation = useMutation({
    mutationFn: async () => {
      isLoading.value = true
      error.value = null
      try {
        return await deleteVisit(appointmentId)
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to delete appointment'
        throw err
      } finally {
        isLoading.value = false
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    retry: 1,
  })

  return {
    ...mutation,
    isLoading,
    error,
  }
}

/**
 * Get prefetched appointments data
 * Use before rendering calendar to avoid loading state
 * @param {Object} queryClient
 * @param {string} startUtc
 * @param {string} endUtc
 */
export const usePrefetchAppointments = async (queryClient, startUtc, endUtc) => {
  await queryClient.prefetchQuery({
    queryKey: ['appointments', startUtc, endUtc],
    queryFn: () => getVisitsByDateRange(startUtc, endUtc),
  })
}
