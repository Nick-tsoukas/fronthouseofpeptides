<template>
  <LegalDocument
    kicker="Shipping"
    title="Shipping Policy"
    :markdown="settings.shippingPolicy"
    :updated-at="settings.updatedAt"
    :support-email="settings.supportEmail"
  />
</template>

<script setup lang="ts">
const { data } = await usePublicStoreSettings()
const settings = computed(() => data.value)
useHead({ title: 'Shipping Policy — Quantum Bio Peptides' })
</script>
