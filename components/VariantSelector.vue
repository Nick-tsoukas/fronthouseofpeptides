<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-dark-300">Select Size</label>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <button
        v-for="variant in variants"
        :key="variant.id"
        type="button"
        @click="!isDisabled(variant) && $emit('select', variant)"
        :disabled="isDisabled(variant)"
        :class="[
          'min-h-[52px] w-full px-4 py-3 rounded-xl border text-left transition-all duration-200',
          selectedId === variant.id
            ? 'bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-500/20'
            : isDisabled(variant)
              ? 'bg-dark-900 border-dark-700 text-dark-500 cursor-not-allowed'
              : 'bg-dark-800 border-dark-600 text-white hover:border-primary-500/50'
        ]"
      >
        <span class="flex items-center justify-between gap-3">
          <span class="font-medium text-sm sm:text-base">{{ variant.attributes.name }}</span>
          <span class="text-sm opacity-90 tabular-nums shrink-0">
            {{ formatPrice(variant.attributes.price) }}
          </span>
        </span>
        <span
          v-if="isOutOfStock(variant)"
          class="mt-1 block text-xs text-red-400"
        >
          Out of stock
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

const formatPrice = (price: number) => `${CURRENCY.SYMBOL}${price.toFixed(2)}`

const isOutOfStock = (variant: Variant): boolean => {
  const inv = variant.attributes.inventory
  return inv !== null && inv !== undefined && inv <= 0
}

const isDisabled = (variant: Variant): boolean => {
  return !variant.attributes.active || isOutOfStock(variant)
}
</script>
