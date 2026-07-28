/**
 * Admin helpers — all data calls go through Nuxt server routes.
 */
export function useAdmin() {
  const logout = async () => {
    try {
      await $fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // ignore
    }
    if (import.meta.client) {
      localStorage.removeItem('adminAuthenticated')
      navigateTo('/admin/login')
    }
  }

  const isAuthenticated = () => {
    if (import.meta.client) {
      return localStorage.getItem('adminAuthenticated') === 'true'
    }
    return false
  }

  return {
    logout,
    isAuthenticated,
  }
}
