/**
 * Admin API Composable
 * 
 * Provides authenticated API calls to Strapi for admin operations.
 * All requests go through Nuxt server routes to keep the Strapi token secure.
 */

export function useAdmin() {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl

  /**
   * Logout admin user
   */
  const logout = () => {
    if (import.meta.client) {
      localStorage.removeItem('adminAuthenticated')
      navigateTo('/admin/login')
    }
  }

  /**
   * Check if admin is authenticated
   */
  const isAuthenticated = () => {
    if (import.meta.client) {
      return localStorage.getItem('adminAuthenticated') === 'true'
    }
    return false
  }

  return {
    strapiUrl,
    logout,
    isAuthenticated,
  }
}
