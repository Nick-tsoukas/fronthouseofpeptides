<template>
  <div class="min-h-screen bg-dark-950">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <p class="text-[11px] uppercase tracking-[0.2em] text-cyan-400/80 font-semibold mb-2">{{ kicker }}</p>
      <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">{{ title }}</h1>
      <p v-if="updatedLabel" class="text-dark-400 text-sm mt-2">Last updated {{ updatedLabel }}</p>

      <div
        class="legal-prose mt-8 text-dark-200 text-sm sm:text-[15px] leading-relaxed"
        v-html="html"
      />

      <div
        v-if="supportEmail"
        class="mt-10 rounded-xl border border-white/10 bg-dark-900/70 px-4 py-4 text-sm text-dark-300"
      >
        Questions?
        <a :href="`mailto:${supportEmail}`" class="text-cyan-400 hover:text-cyan-300">{{ supportEmail }}</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

const props = defineProps<{
  kicker?: string
  title: string
  markdown: string
  updatedAt?: string | null
  supportEmail?: string
}>()

marked.setOptions({ gfm: true, breaks: true })

const html = computed(() => {
  const raw = props.markdown || ''
  const parsed = marked.parse(raw) as string
  return parsed.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
})

const updatedLabel = computed(() => {
  if (!props.updatedAt) return ''
  const d = new Date(props.updatedAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})
</script>

<style scoped>
.legal-prose :deep(h2) {
  color: #fff;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 1.75rem 0 0.75rem;
}
.legal-prose :deep(h3) {
  color: #e5e7eb;
  font-size: 1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
}
.legal-prose :deep(p) {
  margin: 0 0 0.85rem;
}
.legal-prose :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0 0 1rem;
}
.legal-prose :deep(li) {
  margin: 0.25rem 0;
}
.legal-prose :deep(a) {
  color: #22d3ee;
}
.legal-prose :deep(strong) {
  color: #fff;
}
</style>
