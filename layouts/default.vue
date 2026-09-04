<template>
  <div class="min-h-screen bg-dark-950 text-white">
    <div
      v-if="banner"
      class="bg-cyan-500/15 border-b border-cyan-500/20 text-cyan-100 text-sm text-center px-4 py-2.5 leading-snug"
    >
      {{ banner }}
    </div>
    <TheNavbar />
    <main>
      <slot />
    </main>
    <TheFooter />
    <CartDrawer />
    <ComplianceModal />
  </div>
</template>

<script setup lang="ts">
const { data } = await usePublicStoreSettings()
const banner = computed(() => {
  const s = data.value
  if (!s?.announcementBannerEnabled) return ''
  return (s.announcementBanner || '').trim()
})

useHead({
  meta: [
    { name: 'apple-mobile-web-app-title', content: 'Quantum Bio Peptides' },
    { name: 'application-name', content: 'Quantum Bio Peptides' },
  ],
})
</script>
