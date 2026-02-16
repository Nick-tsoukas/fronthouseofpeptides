<template>
  <section class="relative py-24 bg-dark-950">
    <!-- Background -->
    <div class="absolute inset-0">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary-500/5 rounded-full blur-[150px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <span class="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium tracking-wide uppercase mb-4">
          Browse by Category
        </span>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          Explore Our <span class="bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">Collection</span>
        </h2>
        <p class="text-lg text-dark-400 max-w-2xl mx-auto">
          Discover research-grade peptides organized by function. Each compound is rigorously tested for purity and potency.
        </p>
      </div>

      <!-- Categories Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Category 1: Recovery -->
        <a 
          href="#products" 
          class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 to-dark-950 border border-white/5 hover:border-primary-500/30 transition-all duration-500 p-8"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-3 group-hover:text-primary-300 transition-colors">Recovery & Repair</h3>
            <p class="text-dark-400 text-sm leading-relaxed mb-4">Peptides studied for tissue regeneration and cellular repair mechanisms.</p>
            <div class="flex items-center text-primary-400 text-sm font-medium">
              <span>BPC-157, TB-500</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>

        <!-- Category 2: Growth -->
        <a 
          href="#products" 
          class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 to-dark-950 border border-white/5 hover:border-emerald-500/30 transition-all duration-500 p-8"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-3 group-hover:text-emerald-300 transition-colors">Growth Factors</h3>
            <p class="text-dark-400 text-sm leading-relaxed mb-4">Secretagogues and GHRH analogs for growth hormone research.</p>
            <div class="flex items-center text-emerald-400 text-sm font-medium">
              <span>Ipamorelin, CJC-1295, Sermorelin</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>

        <!-- Category 3: Longevity -->
        <a 
          href="#products" 
          class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 to-dark-950 border border-white/5 hover:border-violet-500/30 transition-all duration-500 p-8"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-3 group-hover:text-violet-300 transition-colors">Longevity & Aging</h3>
            <p class="text-dark-400 text-sm leading-relaxed mb-4">Compounds studied for telomere and cellular senescence research.</p>
            <div class="flex items-center text-violet-400 text-sm font-medium">
              <span>Epithalon, GHK-Cu</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
