<template>
  <section class="relative py-24 bg-dark-950">
    <!-- Background -->
    <div class="absolute inset-0">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <span class="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium tracking-wide uppercase mb-4">
          Compound Categories
        </span>
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
          Browse by Compound Class
        </h2>
        <p class="text-dark-400 max-w-2xl mx-auto">
          High-purity research peptides organized by molecular classification. Each compound verified for identity and purity.
        </p>
      </div>

      <!-- Categories Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Category 1: Synthetic Peptides -->
        <a 
          href="#products" 
          class="group relative overflow-hidden rounded-xl bg-dark-900/50 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 p-8 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/5"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="relative z-10">
            <div class="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 transition-all duration-200 group-hover:bg-cyan-500/15 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-200">Synthetic Peptides</h3>
            <p class="text-dark-400 text-sm leading-relaxed mb-4">High-purity synthetic peptide sequences for in-vitro laboratory research applications.</p>
            <div class="flex items-center text-cyan-400 text-sm font-medium">
              <span>BPC-157, TB-500, Epithalon</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>

        <!-- Category 2: Secretagogue Analogs -->
        <a 
          href="#products" 
          class="group relative overflow-hidden rounded-xl bg-dark-900/50 border border-white/5 hover:border-teal-500/30 transition-all duration-300 p-8 hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/5"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="relative z-10">
            <div class="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-5 transition-all duration-200 group-hover:bg-teal-500/15 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-teal-300 transition-colors duration-200">Secretagogue Analogs</h3>
            <p class="text-dark-400 text-sm leading-relaxed mb-4">GHRH and GHRP analog compounds for laboratory study and biochemical analysis.</p>
            <div class="flex items-center text-teal-400 text-sm font-medium">
              <span>Ipamorelin, CJC-1295, Sermorelin</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>

        <!-- Category 3: Copper Peptides -->
        <a 
          href="#products" 
          class="group relative overflow-hidden rounded-xl bg-dark-900/50 border border-white/5 hover:border-sky-500/30 transition-all duration-300 p-8 hover:scale-[1.02] hover:shadow-xl hover:shadow-sky-500/5"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="relative z-10">
            <div class="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-5 transition-all duration-200 group-hover:bg-sky-500/15 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-sky-300 transition-colors duration-200">Copper Peptide Complexes</h3>
            <p class="text-dark-400 text-sm leading-relaxed mb-4">Metal-coordinated peptide compounds for biochemical and structural research.</p>
            <div class="flex items-center text-sky-400 text-sm font-medium">
              <span>GHK-Cu, AHK-Cu</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
