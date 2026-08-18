<script setup lang="ts">
const route = useRoute()
const orderId = computed(() => {
  const raw = route.query.orderId
  return raw ? String(raw) : ''
})

await navigateTo(orderId.value ? `/checkout/payment?orderId=${orderId.value}` : '/checkout', {
  replace: true,
})
</script>
