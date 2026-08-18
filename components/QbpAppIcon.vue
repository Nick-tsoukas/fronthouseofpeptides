<template>
  <svg
    viewBox="0 0 512 512"
    role="img"
    :aria-label="label"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="512" height="512" rx="112" fill="#020617" />
    <rect x="28" y="28" width="456" height="456" rx="96" fill="#06b6d4" />
    <text
      x="256"
      y="328"
      text-anchor="middle"
      fill="#ffffff"
      font-size="148"
      font-weight="800"
      font-family="Arial, Helvetica, sans-serif"
      letter-spacing="6"
    >QBP</text>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), {
  label: 'QBP',
})
</script>
