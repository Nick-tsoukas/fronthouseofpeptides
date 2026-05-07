<template>
  <section class="relative py-32 overflow-hidden">
    <!-- Background Image -->
    <div class="absolute inset-0">
      <img 
        src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1920&q=80" 
        alt="" 
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/80 to-dark-950/70"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/50"></div>
    </div>

    <!-- Content -->
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl">
        <span class="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium tracking-wide uppercase mb-6">
          Quality Assurance
        </span>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          Built for Serious Research Environments
        </h2>
        <p class="text-lg text-dark-300 leading-relaxed mb-8">
          Every compound is handled, verified, and prepared with strict quality standards to ensure consistency, purity, and reliability for your research applications.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <a 
            href="#products" 
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            View Products
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a 
            href="#quality" 
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            Our Process
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
