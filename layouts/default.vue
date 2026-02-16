<template>
  <div class="min-h-screen bg-dark-950 text-white">
    <TheNavbar />
    <main>
      <slot />
    </main>
    <TheFooter />
    <CartDrawer />
    <ComplianceModal />
  </div>
</template>

<script setup lang="ts">
</script>
