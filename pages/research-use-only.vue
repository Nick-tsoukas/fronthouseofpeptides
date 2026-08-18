<template>
  <LegalDocument
    kicker="Compliance"
    title="Research Use Only"
    :markdown="settings.researchUseOnlyPolicy"
    :updated-at="settings.updatedAt"
    :support-email="settings.supportEmail"
  />
</template>

<script setup lang="ts">
const { data } = await usePublicStoreSettings()
const settings = computed(() => data.value)
useHead({ title: 'Research Use Only — Quantum Bio Peptides' })
</script>
