<template>
  <LegalDocument
    kicker="Orders"
    title="Refund & Replacement Policy"
    :markdown="settings.refundPolicy"
    :updated-at="settings.updatedAt"
    :support-email="settings.supportEmail"
  />
</template>

<script setup lang="ts">
const { data } = await usePublicStoreSettings()
const settings = computed(() => data.value)
useHead({ title: 'Refund Policy — Quantum Bio Peptides' })
</script>
