<template>
  <LegalDocument
    kicker="Legal"
    title="Terms of Service"
    :markdown="settings.termsOfService"
    :updated-at="settings.updatedAt"
    :support-email="settings.supportEmail"
  />
</template>

<script setup lang="ts">
const { data } = await usePublicStoreSettings()
const settings = computed(() => data.value)
useHead({ title: 'Terms of Service — Quantum Bio Peptides' })
</script>
