<template>
  <div class="flex items-center space-x-3">
    <label v-if="showLabel" class="text-sm font-medium text-dark-300">Quantity</label>
    <div class="flex items-center bg-dark-800 rounded-lg border border-dark-600">
      <button
        @click="decrement"
        :disabled="modelValue <= min"
        class="px-3 py-2 text-dark-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>
      <span class="px-4 py-2 text-white font-medium min-w-[3rem] text-center">
        {{ modelValue }}
      </span>
      <button
        @click="increment"
        :disabled="modelValue >= max"
        class="px-3 py-2 text-dark-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
