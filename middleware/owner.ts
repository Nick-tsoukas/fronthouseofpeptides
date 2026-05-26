export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/owner/login') return

  try {
    const headers = useRequestHeaders(['cookie'])
    const { authenticated } = await $fetch<{ authenticated: boolean }>('/api/owner/session', { headers })
    if (!authenticated) {
      return navigateTo('/owner/login')
    }
  } catch {
    return navigateTo('/owner/login')
  }
})
