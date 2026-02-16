<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-dark-300">Select Size</label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="variant in variants"
        :key="variant.id"
        @click="$emit('select', variant)"
        :disabled="!variant.attributes.active"
        :class="[
          'px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
          selectedId === variant.id
            ? 'bg-primary-500 border-primary-500 text-white'
            : variant.attributes.active
              ? 'bg-dark-800 border-dark-600 text-white hover:border-primary-500/50'
              : 'bg-dark-900 border-dark-700 text-dark-500 cursor-not-allowed'
        ]"
      >
        <span>{{ variant.attributes.name }}</span>
        <span class="ml-2 text-xs opacity-75">
          {{ formatPrice(variant.attributes.price) }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Variant } from '~/types'
import { CURRENCY } from '~/constants'

defineProps<{
  variants: Variant[]
  selectedId: number | null
}>()

defineEmits<{
  select: [variant: Variant]
}>()

const formatPrice = (price: number) => {
  return `${CURRENCY.SYMBOL}${price.toFixed(2)}`
}
</script>
