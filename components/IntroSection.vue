<template>
  <section class="relative py-24 bg-dark-950 overflow-hidden">
    <!-- Background Elements -->
    <div class="absolute inset-0">
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid lg:grid-cols-2 gap-16 items-center">
        <!-- Left Content -->
        <div>
          <span class="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium tracking-wide uppercase mb-6">
            Why Choose Us
          </span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Uncompromising Quality for 
            <span class="bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">Serious Research</span>
          </h2>
          <p class="text-lg text-dark-300 mb-8 leading-relaxed">
            At House of Peptides, we understand that your research demands the highest standards. Every compound in our catalog undergoes rigorous third-party testing, ensuring consistent purity levels of 99% or higher.
          </p>
          <p class="text-dark-400 mb-10 leading-relaxed">
            We partner exclusively with ISO-certified laboratories and maintain strict cold-chain protocols from synthesis to delivery. Your research deserves nothing less than excellence.
          </p>

          <!-- Features List -->
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-emerald-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 class="text-white font-semibold mb-1">Third-Party Verified</h4>
                <p class="text-dark-400 text-sm">Every batch tested by independent laboratories with COA available</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-emerald-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h4 class="text-white font-semibold mb-1">Cold-Chain Shipping</h4>
                <p class="text-dark-400 text-sm">Temperature-controlled packaging ensures compound integrity</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-emerald-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 class="text-white font-semibold mb-1">Discreet & Secure</h4>
                <p class="text-dark-400 text-sm">Plain packaging with encrypted checkout and data protection</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Stats/Visual -->
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-emerald-500/10 rounded-3xl blur-2xl"></div>
          <div class="relative bg-gradient-to-br from-dark-900 to-dark-950 rounded-3xl border border-white/5 p-10">
            <!-- Large Stat -->
            <div class="text-center mb-10">
              <div class="text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary-400 via-emerald-400 to-primary-300 bg-clip-text text-transparent mb-4">
                99.1%
              </div>
              <div class="text-dark-300 text-lg">Average Purity Across All Products</div>
            </div>

            <!-- Divider -->
            <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10"></div>

            <!-- Mini Stats Grid -->
            <div class="grid grid-cols-2 gap-8">
              <div class="text-center">
                <div class="text-3xl font-bold text-white mb-2">50+</div>
                <div class="text-dark-400 text-sm">Research Compounds</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-white mb-2">10K+</div>
                <div class="text-dark-400 text-sm">Orders Fulfilled</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-white mb-2">48hr</div>
                <div class="text-dark-400 text-sm">Avg. Delivery</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-white mb-2">100%</div>
                <div class="text-dark-400 text-sm">US-Based</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>
