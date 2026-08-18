<template>
  <LegalDocument
    kicker="Legal"
    title="Privacy Policy"
    :markdown="settings.privacyPolicy"
    :updated-at="settings.updatedAt"
    :support-email="settings.supportEmail"
  />
</template>

<script setup lang="ts">
const { data } = await usePublicStoreSettings()
const settings = computed(() => data.value)
useHead({ title: 'Privacy Policy — Quantum Bio Peptides' })
</script>
