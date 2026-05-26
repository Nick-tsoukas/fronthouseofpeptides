<template>
  <section class="relative overflow-hidden bg-dark-950 min-h-[90vh] flex items-center">
    <!-- Background Image with Overlay -->
    <div class="absolute inset-0">
      <img 
        src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1920&q=80" 
        alt="" 
        class="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-dark-950/40 via-dark-950/50 to-dark-950"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-dark-950/60 via-transparent to-dark-950/60"></div>
    </div>

    <!-- Molecular Grid Overlay -->
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <!-- Subtle glow accents -->
      <div class="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[150px]"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-teal-500/15 rounded-full blur-[120px]"></div>
    </div>

    <!-- Noise texture -->
    <div class="absolute inset-0 opacity-[0.02]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E');"></div>

    <div class="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
      <div class="text-center">
        <!-- Research Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
          <div class="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
          <span class="text-cyan-300 text-sm font-medium tracking-wider uppercase">Research Grade Compounds</span>
        </div>

        <!-- Main Headline -->
        <h1 class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.15] tracking-tight">
          Research-Grade Peptides for
          <span class="block mt-2 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 bg-clip-text text-transparent">
            Advanced Scientific Study
          </span>
        </h1>

        <!-- Subheadline -->
        <p class="text-lg md:text-xl text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          High-purity compounds, rigorously tested and supplied for qualified researchers and laboratory use.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <a
            href="#products"
            class="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02]"
          >
            <span class="flex items-center justify-center gap-2">
              Browse Research Compounds
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </a>
          <a
            href="#products"
            class="group w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            <span class="flex items-center justify-center gap-2">
              View Catalog
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </a>
        </div>

        <!-- Trust Strip -->
        <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
          <div class="flex items-center gap-2 text-dark-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>99%+ Purity Verified</span>
          </div>
          <div class="flex items-center gap-2 text-dark-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Fast US Fulfillment</span>
          </div>
          <div class="flex items-center gap-2 text-dark-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure Checkout</span>
          </div>
          <div class="flex items-center gap-2 text-dark-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Research Use Only</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom fade -->
    <div class="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-dark-950 to-transparent"></div>
  </section>
</template>

<script setup lang="ts">
</script>
