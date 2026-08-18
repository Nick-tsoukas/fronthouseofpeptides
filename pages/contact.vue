<template>
  <div class="min-h-screen bg-dark-950">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <p class="text-[11px] uppercase tracking-[0.2em] text-cyan-400/80 font-semibold mb-2">Support</p>
      <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">Contact</h1>
      <p class="text-dark-400 mt-2 text-sm sm:text-base leading-relaxed">
        For order, shipping, or policy questions, reach us using the details below.
      </p>

      <div class="mt-8 space-y-3">
        <a
          v-if="settings.supportEmail"
          :href="`mailto:${settings.supportEmail}`"
          class="flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-dark-900 px-4 py-3"
        >
          <span class="text-dark-400 text-sm">Email</span>
          <span class="text-cyan-400 text-sm font-medium truncate">{{ settings.supportEmail }}</span>
        </a>
        <a
          v-if="settings.supportPhone"
          :href="`tel:${settings.supportPhone}`"
          class="flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-dark-900 px-4 py-3"
        >
          <span class="text-dark-400 text-sm">Phone</span>
          <span class="text-white text-sm font-medium">{{ settings.supportPhone }}</span>
        </a>
        <div
          v-if="addressLine"
          class="rounded-xl border border-white/10 bg-dark-900 px-4 py-3 text-sm"
        >
          <p class="text-dark-400 mb-1">Address</p>
          <p class="text-white whitespace-pre-line leading-relaxed">{{ addressLine }}</p>
        </div>
      </div>

      <div
        class="legal-prose mt-10 text-dark-200 text-sm sm:text-[15px] leading-relaxed"
        v-html="html"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

const { data } = await usePublicStoreSettings()
const settings = computed(() => data.value)

marked.setOptions({ gfm: true, breaks: true })
const html = computed(() => {
  const parsed = marked.parse(settings.value.contactPolicy || '') as string
  return parsed.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
})

const addressLine = computed(() => {
  const s = settings.value
  const lines = [
    s.legalBusinessName || s.storeName,
    s.businessAddressLine1,
    s.businessAddressLine2,
    [s.businessCity, s.businessState, s.businessPostalCode].filter(Boolean).join(', '),
    s.businessCountry,
  ].filter((line) => String(line || '').trim())
  return lines.join('\n')
})

useHead({ title: 'Contact — Quantum Bio Peptides' })
</script>

<style scoped>
.legal-prose :deep(h2) {
  color: #fff;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 1.75rem 0 0.75rem;
}
.legal-prose :deep(p) {
  margin: 0 0 0.85rem;
}
.legal-prose :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0 0 1rem;
}
.legal-prose :deep(a) {
  color: #22d3ee;
}
</style>
