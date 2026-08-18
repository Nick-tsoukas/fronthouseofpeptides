/**
 * Admin route guard.
 * Client checks localStorage for UX; server APIs enforce httpOnly admin_session cookie.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  if (to.path === '/admin/install') return

  if (to.path === '/admin/login') {
    try {
      const session = await $fetch<{ authenticated?: boolean }>('/api/admin/session', {
        credentials: 'include',
      })
      if (session.authenticated) return navigateTo('/admin')
    } catch {
      // stay on login
    }
    return
  }

  try {
    const session = await $fetch<{ authenticated?: boolean }>('/api/admin/session', {
      credentials: 'include',
    })
    if (session.authenticated) {
      localStorage.setItem('adminAuthenticated', 'true')
      return
    }
  } catch {
    // fall through
  }

  localStorage.removeItem('adminAuthenticated')
  return navigateTo('/admin/login')
})
