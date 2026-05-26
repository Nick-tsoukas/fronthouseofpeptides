<template>
  <span :class="['inline-flex items-center gap-1.5 font-medium rounded-full', sizeClass, colorClass]">
    <span :class="['rounded-full flex-shrink-0', dotSize, dotColor]"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: string
  size?: 'sm' | 'lg'
}>()

const sizeClass = computed(() => props.size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2.5 py-0.5')
const dotSize = computed(() => props.size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5')

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  approved:         { label: 'Approved',         color: 'bg-green-500/15 text-green-300',   dot: 'bg-green-400' },
  pending_review:   { label: 'Pending Review',   color: 'bg-yellow-500/15 text-yellow-300', dot: 'bg-yellow-400' },
  awaiting_payment: { label: 'Awaiting Payment', color: 'bg-blue-500/15 text-blue-300',     dot: 'bg-blue-400' },
  fulfilled:        { label: 'Fulfilled',         color: 'bg-primary-500/15 text-primary-300', dot: 'bg-primary-400' },
  cancelled:        { label: 'Cancelled',         color: 'bg-dark-700 text-dark-300',        dot: 'bg-dark-400' },
  rejected:         { label: 'Rejected',          color: 'bg-red-500/15 text-red-300',       dot: 'bg-red-400' },
}

const resolved = computed(() => STATUS_MAP[props.status] ?? { label: props.status, color: 'bg-dark-700 text-dark-300', dot: 'bg-dark-400' })
const colorClass = computed(() => resolved.value.color)
const dotColor = computed(() => resolved.value.dot)
const label = computed(() => resolved.value.label)
</script>
