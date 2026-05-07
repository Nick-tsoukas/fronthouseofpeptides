<template>
  <section id="quality" class="relative py-24 bg-dark-950">
    <!-- Background -->
    <div class="absolute inset-0">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <span class="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium tracking-wide uppercase mb-4">
          Our Process
        </span>
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
          From Synthesis to Delivery
        </h2>
        <p class="text-dark-400 max-w-2xl mx-auto">
          A rigorous quality control process ensures every compound meets research-grade standards.
        </p>
      </div>

      <!-- Process Steps -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Step 1 -->
        <div class="relative group">
          <div class="p-6 rounded-xl bg-dark-900/50 border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                01
              </div>
              <div class="hidden lg:block flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
            </div>
            <h3 class="text-white font-semibold mb-2">Compound Preparation</h3>
            <p class="text-dark-400 text-sm leading-relaxed">
              Raw materials sourced from certified suppliers and prepared under controlled conditions.
            </p>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="relative group">
          <div class="p-6 rounded-xl bg-dark-900/50 border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                02
              </div>
              <div class="hidden lg:block flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
            </div>
            <h3 class="text-white font-semibold mb-2">Purification Process</h3>
            <p class="text-dark-400 text-sm leading-relaxed">
              Multi-stage purification to achieve 99%+ purity levels for research applications.
            </p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="relative group">
          <div class="p-6 rounded-xl bg-dark-900/50 border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                03
              </div>
              <div class="hidden lg:block flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
            </div>
            <h3 class="text-white font-semibold mb-2">Analytical Testing</h3>
            <p class="text-dark-400 text-sm leading-relaxed">
              HPLC and mass spectrometry verification with batch-specific certificates of analysis.
            </p>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="relative group">
          <div class="p-6 rounded-xl bg-dark-900/50 border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                04
              </div>
            </div>
            <h3 class="text-white font-semibold mb-2">Secure Delivery</h3>
            <p class="text-dark-400 text-sm leading-relaxed">
              Temperature-controlled packaging and discreet shipping within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
