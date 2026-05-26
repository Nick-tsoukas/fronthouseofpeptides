/**
 * Admin Route Protection Middleware
 * 
 * MVP Implementation: Uses a simple localStorage flag for demo purposes.
 * 
 * TODO: For production, implement proper authentication:
 * 1. Add Strapi users-permissions plugin authentication
 * 2. Check user role (admin/owner) from JWT token
 * 3. Validate session server-side
 * 
 * Current behavior:
 * - Checks for 'adminAuthenticated' in localStorage
 * - If not authenticated, redirects to /admin/login
 * - For MVP testing, set localStorage.setItem('adminAuthenticated', 'true') in console
 */
export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server-side
  if (import.meta.server) return

  // Check if user is authenticated as admin
  const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true'

  // If not authenticated and not already on login page, redirect to login
  if (!isAuthenticated && to.path !== '/admin/login') {
    return navigateTo('/admin/login')
  }

  // If authenticated and on login page, redirect to admin dashboard
  if (isAuthenticated && to.path === '/admin/login') {
    return navigateTo('/admin')
  }
})
