<template>
  <div class="flex items-center gap-3">
    <label v-if="showLabel" class="text-sm font-medium text-dark-300">Quantity</label>
    <div class="inline-flex items-center bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
      <button
        type="button"
        @click="decrement"
        :disabled="modelValue <= min"
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>
      <span class="min-w-[2.75rem] px-2 text-center text-white font-semibold tabular-nums">
        {{ modelValue }}
      </span>
      <button
        type="button"
        @click="increment"
        :disabled="modelValue >= max"
        class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CART } from '~/constants'

const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  showLabel?: boolean
}>(), {
  min: CART.MIN_QUANTITY,
  max: CART.MAX_QUANTITY,
  showLabel: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const increment = () => {
  if (props.modelValue < props.max) {
    emit('update:modelValue', props.modelValue + 1)
  }
}

const decrement = () => {
  if (props.modelValue > props.min) {
    emit('update:modelValue', props.modelValue - 1)
  }
}
</script>
