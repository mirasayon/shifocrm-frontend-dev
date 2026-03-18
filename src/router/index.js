import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/patients',
      name: 'patients',
      component: () => import('@/views/PatientsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/patients/:id',
      name: 'patient-detail',
      component: () => import('@/views/PatientDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-patients',
      name: 'my-patients',
      component: () => import('@/views/PatientsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/doctors',
      name: 'doctors',
      component: () => import('@/views/DoctorsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/appointments',
      name: 'appointments',
      component: () => import('@/views/AppointmentsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/my-appointments',
      name: 'my-appointments',
      component: () => import('@/views/AppointmentsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/payments',
      name: 'payments',
      component: () => import('@/views/PaymentsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/services',
      name: 'services',
      component: () => import('@/views/ServicesView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/leads',
      name: 'leads',
      component: () => import('@/views/LeadsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/my-leads',
      name: 'my-leads',
      component: () => import('@/views/LeadsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('@/views/InventoryView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/treatment-plans',
      name: 'treatment-plans',
      component: () => import('@/views/TreatmentPlansView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/doctor/profile',
      name: 'doctor-profile',
      component: () => import('@/views/DoctorProfileView.vue'),
      meta: { requiresAuth: true, requiresRole: 'doctor' },
    },
    {
      path: '/admin',
      redirect: { name: 'admin-clinics' },
    },
    {
      path: '/admin/clinics',
      name: 'admin-clinics',
      component: () => import('@/views/superadmin/AdminClinicsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'super_admin' },
    },
    {
      path: '/admin/clinics/new',
      name: 'admin-clinics-new',
      component: () => import('@/views/superadmin/AdminClinicFormView.vue'),
      meta: { requiresAuth: true, requiresRole: 'super_admin' },
    },
    {
      path: '/admin/clinics/:id/edit',
      name: 'admin-clinics-edit',
      component: () => import('@/views/superadmin/AdminClinicFormView.vue'),
      meta: { requiresAuth: true, requiresRole: 'super_admin' },
    },
    {
      path: '/admin/solo-doctor/new',
      name: 'admin-solo-doctor-new',
      component: () => import('@/views/superadmin/AdminSoloDoctorFormView.vue'),
      meta: { requiresAuth: true, requiresRole: 'super_admin' },
    },
    {
      path: '/d/:slug',
      name: 'doctor-public-profile',
      component: () => import('@/views/DoctorPublicProfileView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const impersonatorRole = localStorage.getItem('impersonatorRole')

  // Redirect authenticated users away from login page
  if (to.name === 'login' && authStore.isAuthenticated) {
    const defaultRoute = authStore.userRole === 'super_admin'
      ? 'admin-clinics'
      : authStore.userRole === 'doctor'
        ? 'dashboard'
        : 'dashboard'
    next({ name: defaultRoute })
    return
  }

  // Check authentication requirement
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Super admin always uses /admin; redirect dashboard to clinics
  // (except when super admin is impersonating a clinic as admin)
  if (to.name === 'dashboard' && authStore.userRole === 'super_admin' && impersonatorRole !== 'super_admin') {
    next({ name: 'admin-clinics' })
    return
  }

  // Solo doktor /doctors ga kirmasa — o'zi bitta, profilga yo'naltirish
  if (to.name === 'doctors' && authStore.userRole === 'solo') {
    next({ name: 'doctor-profile' })
    return
  }

  // Check role requirement
  if (to.meta.requiresRole) {
    // Allow super admin pages even during impersonation
    if (to.meta.requiresRole === 'super_admin' && authStore.userRole !== 'super_admin' && impersonatorRole !== 'super_admin') {
      next({ name: 'dashboard' })
      return
    }
    // Admin: admin yoki solo (yakka doktor) kirishi mumkin
    if (to.meta.requiresRole === 'admin' && authStore.userRole !== 'admin' && authStore.userRole !== 'solo') {
      const defaultRoute = authStore.userRole === 'super_admin' ? 'admin-clinics' : 'dashboard'
      next({ name: defaultRoute })
      return
    }
    // Doctor: doctor yoki solo kirishi mumkin
    if (to.meta.requiresRole === 'doctor' && authStore.userRole !== 'doctor' && authStore.userRole !== 'solo') {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router
