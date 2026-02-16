<template>
  <section class="relative overflow-hidden bg-dark-950 min-h-[90vh] flex items-center">
    <!-- Animated Background -->
    <div class="absolute inset-0">
      <!-- Gradient orbs -->
      <div class="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[100px] animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-400/10 rounded-full blur-[150px]"></div>
      
      <!-- Grid pattern -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      
      <!-- Noise texture overlay -->
      <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E');"></div>
    </div>

    <div class="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div class="text-center">
        <!-- Premium Badge -->
        <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-500/10 to-emerald-500/10 border border-primary-500/20 mb-8 backdrop-blur-sm">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          <span class="text-primary-300 text-sm font-medium tracking-wide uppercase">Research Grade Compounds</span>
        </div>

        <!-- Main Headline -->
        <h1 class="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
          <span class="block">The Future of</span>
          <span class="block mt-2 bg-gradient-to-r from-primary-400 via-emerald-400 to-primary-300 bg-clip-text text-transparent">
            Peptide Research
          </span>
        </h1>

        <!-- Subheadline -->
        <p class="text-xl md:text-2xl text-dark-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
          Ultra-pure, laboratory-verified peptides for qualified researchers. 
          <span class="text-white font-normal">99%+ purity guaranteed.</span>
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#products"
            class="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-primary-500 to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-2xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] overflow-hidden"
          >
            <span class="relative z-10 flex items-center justify-center gap-2">
              Browse Collection
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
            <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
          <a
            href="#products"
            class="group w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
          >
            <span class="flex items-center justify-center gap-2">
              View Catalog
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </a>
        </div>

        <!-- Stats/Trust Section -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
          <div class="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
            <div class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent mb-2">99%+</div>
            <div class="text-sm text-dark-400 font-medium">Purity Verified</div>
          </div>
          <div class="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
            <div class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent mb-2">24h</div>
            <div class="text-sm text-dark-400 font-medium">Fast Shipping</div>
          </div>
          <div class="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
            <div class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent mb-2">SSL</div>
            <div class="text-sm text-dark-400 font-medium">Secure Checkout</div>
          </div>
          <div class="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
            <div class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent mb-2">USA</div>
            <div class="text-sm text-dark-400 font-medium">Domestic Only</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom fade -->
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-950 to-transparent"></div>
  </section>
</template>

<script setup lang="ts">
</script>
