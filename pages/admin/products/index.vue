<template>
  <div class="px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 lg:mb-8">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-white tracking-tight">Products</h1>
        <p class="text-dark-400 mt-1 text-sm">Inventory &amp; in-person sales</p>
      </div>
      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm transition-colors"
      >
        Add Product
      </NuxtLink>
    </div>

    <!-- Toast -->
    <div
      v-if="toast"
      class="mb-4 rounded-xl px-4 py-3 text-sm sticky top-2 z-30 shadow-lg"
      :class="toast.type === 'success'
        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
        : 'bg-red-500/15 border border-red-500/40 text-red-300'"
    >
      {{ toast.message }}
    </div>

    <!-- Toolbar -->
    <div v-if="!pending && !error && products.length" class="mb-5 space-y-3">
      <input
        v-model="search"
        type="search"
        placeholder="Search products, variants, SKU…"
        class="w-full min-h-[44px] px-4 rounded-xl bg-dark-900 border border-dark-700 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-cyan-500"
      />

      <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          class="shrink-0 min-h-[40px] px-3.5 rounded-full text-sm font-medium border transition-colors"
          :class="activeFilter === f.value
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            : 'bg-dark-900 text-dark-400 border-dark-700 hover:text-white'"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2 text-xs">
        <span class="px-2.5 py-1 rounded-full bg-dark-900 border border-dark-700 text-dark-300">
          {{ summary.products }} products
        </span>
        <span class="px-2.5 py-1 rounded-full bg-dark-900 border border-dark-700 text-dark-300">
          {{ summary.variants }} variants
        </span>
        <span class="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300">
          {{ summary.lowStock }} low
        </span>
        <span class="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-300">
          {{ summary.outOfStock }} out
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 4" :key="i" class="rounded-2xl border border-dark-700 bg-dark-900 p-5 animate-pulse">
        <div class="h-5 bg-dark-800 rounded w-1/3 mb-3"></div>
        <div class="h-4 bg-dark-800 rounded w-2/3 mb-4"></div>
        <div class="h-16 bg-dark-800/60 rounded-xl"></div>
      </div>
    </div>

    <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
      <p class="text-red-400 mb-3">{{ error }}</p>
      <NuxtLink to="/admin/login" class="text-cyan-400 text-sm underline">Sign in again</NuxtLink>
    </div>

    <div v-else-if="products.length === 0" class="rounded-2xl border border-dark-700 bg-dark-900 p-12 text-center">
      <h2 class="text-xl font-semibold text-white mb-2">No products yet</h2>
      <NuxtLink to="/admin/products/new" class="text-cyan-400">Add Product</NuxtLink>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="rounded-2xl border border-dark-700 bg-dark-900 p-10 text-center">
      <p class="text-dark-400">No products match this filter.</p>
    </div>

    <!-- Product groups -->
    <div v-else class="space-y-5 lg:space-y-6">
      <article
        v-for="product in filteredProducts"
        :key="product.id"
        class="rounded-2xl border border-dark-700/90 bg-dark-900/95 overflow-hidden shadow-sm shadow-black/20"
      >
        <!-- Parent header -->
        <div class="px-4 py-4 sm:px-5 border-b border-dark-800/80 bg-dark-900">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <h2 class="text-base sm:text-lg font-semibold text-white truncate">{{ product.name }}</h2>
                <span
                  class="text-[11px] px-2 py-0.5 rounded-full border"
                  :class="product.active
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                    : 'bg-dark-800 text-dark-400 border-dark-600'"
                >
                  {{ product.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-dark-500 text-xs truncate">{{ product.slug }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span class="text-dark-300">{{ product.variantCount }} variant{{ product.variantCount === 1 ? '' : 's' }}</span>
                <span class="text-dark-600">·</span>
                <span class="text-white font-medium">{{ priceRange(product) }}</span>
                <span class="text-dark-600">·</span>
                <span :class="stockTextClass(productTotalInventory(product))">{{ inventorySummary(product) }}</span>
              </div>
            </div>
            <NuxtLink
              :to="`/admin/products/${product.id}`"
              class="shrink-0 inline-flex items-center justify-center min-h-[44px] px-3.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-200 text-sm font-medium transition-colors"
            >
              Edit
            </NuxtLink>
          </div>
        </div>

        <!-- Single variant -->
        <div
          v-if="!isMultiVariant(product) && product.variants?.[0]"
          class="p-4 sm:p-5"
        >
          <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-dark-300 text-sm">
                {{ product.variants[0].name }}
                <span v-if="product.variants[0].sku"> · SKU {{ product.variants[0].sku }}</span>
                · ${{ Number(product.variants[0].price).toFixed(2) }}
              </p>
              <span :class="stockPillClass(product.variants[0].inventory)">
                {{ stockLabel(product.variants[0].inventory) }}
              </span>
            </div>
            <div class="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                class="w-full sm:flex-1 min-h-[48px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold text-sm"
                :disabled="!canSell(product.variants[0])"
                @click="openQuickSale(product, product.variants[0])"
              >
                Quick Sale
              </button>
              <div class="grid grid-cols-2 gap-2.5 sm:contents">
                <button
                  type="button"
                  class="min-h-[48px] sm:min-w-[88px] px-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium text-sm"
                  @click="openStockAdjust(product, product.variants[0], 'add')"
                >
                  + Add
                </button>
                <button
                  type="button"
                  class="min-h-[48px] sm:min-w-[88px] px-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium text-sm disabled:opacity-40"
                  :disabled="!canSell(product.variants[0])"
                  @click="openStockAdjust(product, product.variants[0], 'remove')"
                >
                  − Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Multi variant — always visible -->
        <div v-else class="p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-dark-950/40">
          <div
            v-for="variant in product.variants"
            :key="variant.id"
            class="rounded-xl border border-dark-700/80 bg-dark-900/90 sm:ml-2 lg:ml-4 p-3.5 sm:p-4 space-y-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-white font-semibold text-sm sm:text-base">{{ variant.name }}</p>
                <p class="text-dark-400 text-xs mt-0.5">
                  <span v-if="variant.sku">SKU {{ variant.sku }} · </span>
                  ${{ Number(variant.price).toFixed(2) }}
                </p>
              </div>
              <span :class="stockPillClass(variant.inventory)">
                {{ stockLabel(variant.inventory) }}
              </span>
            </div>
            <div class="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                class="w-full sm:flex-1 min-h-[48px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold text-sm shadow-sm shadow-emerald-500/10"
                :disabled="!canSell(variant)"
                @click="openQuickSale(product, variant)"
              >
                Quick Sale
              </button>
              <div class="grid grid-cols-2 gap-2.5 sm:contents">
                <button
                  type="button"
                  class="min-h-[48px] sm:min-w-[88px] px-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium text-sm"
                  @click="openStockAdjust(product, variant, 'add')"
                >
                  + Add
                </button>
                <button
                  type="button"
                  class="min-h-[48px] sm:min-w-[88px] px-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium text-sm disabled:opacity-40"
                  :disabled="!canSell(variant)"
                  @click="openStockAdjust(product, variant, 'remove')"
                >
                  − Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Quick Sale modal -->
    <div
      v-if="saleModal.show"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4"
      @click.self="saleModal.show = false"
    >
      <div
        class="w-full sm:max-w-md bg-dark-900 border border-dark-700 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-dark-600 sm:hidden" />
        <h3 class="text-xl font-semibold text-white mb-4">Quick Sale</h3>

        <div class="rounded-xl border border-dark-700 bg-dark-950/50 px-4 py-3 mb-5 space-y-1.5 text-sm">
          <p class="text-white font-medium">{{ saleModal.productName }}</p>
          <p class="text-dark-300">{{ saleModal.variantName }}</p>
          <p class="text-sm pt-1">
            <span class="text-dark-500">Current stock: </span>
            <span :class="stockTextClass(saleModal.currentStock)">{{ saleModal.currentStock }}</span>
          </p>
        </div>

        <div class="space-y-5">
          <div>
            <p class="text-sm text-dark-300 mb-2">Quantity sold</p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="min-h-[48px] min-w-[48px] rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-xl font-semibold disabled:opacity-40"
                :disabled="saleModal.quantity <= 1"
                @click="saleModal.quantity = Math.max(1, saleModal.quantity - 1)"
              >
                −
              </button>
              <input
                v-model.number="saleModal.quantity"
                type="number"
                min="1"
                :max="saleModal.currentStock"
                class="flex-1 min-h-[48px] text-center text-lg font-semibold bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                class="min-h-[48px] min-w-[48px] rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-xl font-semibold disabled:opacity-40"
                :disabled="saleModal.quantity >= saleModal.currentStock"
                @click="saleModal.quantity = Math.min(saleModal.currentStock, saleModal.quantity + 1)"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p class="text-sm text-dark-300 mb-2">Payment method</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                type="button"
                class="min-h-[44px] rounded-xl text-sm font-semibold border transition-colors"
                :class="saleModal.paymentMethod === method.value
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-dark-800 text-dark-300 border-dark-600'"
                @click="saleModal.paymentMethod = method.value"
              >
                {{ method.label }}
              </button>
            </div>
          </div>

          <label class="block text-sm text-dark-300">
            Note <span class="text-dark-500">(optional)</span>
            <input
              v-model="saleModal.note"
              type="text"
              class="mt-1.5 w-full min-h-[44px] px-3 rounded-xl bg-dark-800 border border-dark-600 text-white focus:outline-none focus:border-cyan-500"
              placeholder="Optional"
            />
          </label>
        </div>

        <p v-if="saleModal.error" class="mt-4 text-red-400 text-sm">{{ saleModal.error }}</p>

        <div class="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 min-h-[48px] px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium"
            @click="saleModal.show = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold"
            :disabled="saleModal.loading"
            @click="confirmQuickSale"
          >
            {{ saleModal.loading ? 'Saving…' : 'Confirm Sale' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stock adjust modal -->
    <div
      v-if="stockModal.show"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4"
      @click.self="stockModal.show = false"
    >
      <div class="w-full sm:max-w-sm bg-dark-900 border border-dark-700 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-dark-600 sm:hidden" />
        <h3 class="text-lg font-semibold text-white mb-1">
          {{ stockModal.type === 'add' ? 'Add stock' : 'Remove stock' }}
        </h3>
        <p class="text-dark-400 text-sm mb-4">
          {{ stockModal.productName }} — {{ stockModal.variantName }}
          (current: {{ stockModal.currentStock }})
        </p>

        <div class="flex items-center gap-3 mb-4">
          <button
            type="button"
            class="min-h-[48px] min-w-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white text-xl disabled:opacity-40"
            :disabled="stockModal.quantity <= 1"
            @click="stockModal.quantity = Math.max(1, stockModal.quantity - 1)"
          >
            −
          </button>
          <input
            v-model.number="stockModal.quantity"
            type="number"
            min="1"
            class="flex-1 min-h-[48px] text-center text-lg font-semibold bg-dark-800 border border-dark-600 rounded-xl text-white"
          />
          <button
            type="button"
            class="min-h-[48px] min-w-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white text-xl"
            @click="stockModal.quantity += 1"
          >
            +
          </button>
        </div>

        <p v-if="stockModal.error" class="mb-3 text-red-400 text-sm">{{ stockModal.error }}</p>

        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white"
            @click="stockModal.show = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold"
            :disabled="stockModal.loading"
            @click="confirmStockAdjust"
          >
            {{ stockModal.loading ? 'Saving…' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const products = ref<any[]>([])
const pending = ref(true)
const error = ref('')
const search = ref('')
const activeFilter = ref('all')
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const paymentMethods = [
  { value: 'cash' as const, label: 'Cash' },
  { value: 'external' as const, label: 'External' },
  { value: 'other' as const, label: 'Other' },
]

const filters = [
  { value: 'all', label: 'All' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'not_tracked', label: 'Not tracked' },
]

const saleModal = reactive({
  show: false,
  loading: false,
  error: '',
  variantId: 0,
  productName: '',
  variantName: '',
  currentStock: 0,
  quantity: 1,
  paymentMethod: 'cash' as 'cash' | 'external' | 'other',
  note: '',
})

const stockModal = reactive({
  show: false,
  loading: false,
  error: '',
  type: 'add' as 'add' | 'remove',
  variantId: 0,
  productName: '',
  variantName: '',
  currentStock: 0,
  quantity: 1,
})

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => {
    toast.value = null
  }, 4500)
}

function isMultiVariant(product: any) {
  return (product.variantCount || product.variants?.length || 0) > 1
}

function isTracked(variant: any) {
  return variant?.inventory !== null && variant?.inventory !== undefined
}

function canSell(variant: any) {
  return isTracked(variant) && Number(variant.inventory) > 0
}

function priceRange(product: any) {
  const variants = product.variants || []
  if (!variants.length) return 'N/A'
  const prices = variants.map((v: any) => Number(v.price) || 0)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `$${min.toFixed(2)}`
  return `$${min.toFixed(2)} - $${max.toFixed(2)}`
}

function productTotalInventory(product: any): number | null {
  const variants = product.variants || []
  if (!variants.length) return null
  if (variants.every((v: any) => !isTracked(v))) return null
  return variants.reduce((sum: number, v: any) => sum + (isTracked(v) ? Number(v.inventory) || 0 : 0), 0)
}

function stockLabel(inventory: number | null | undefined) {
  if (inventory === null || inventory === undefined) return 'Not tracked'
  if (inventory <= 0) return 'Out of stock'
  if (inventory <= 5) return `Low stock · ${inventory}`
  return `${inventory} in stock`
}

function stockTextClass(inventory: number | null) {
  if (inventory === null || inventory === undefined) return 'text-dark-400 font-medium'
  if (inventory <= 0) return 'text-red-400 font-semibold'
  if (inventory <= 5) return 'text-amber-400 font-semibold'
  return 'text-emerald-400 font-semibold'
}

function stockPillClass(inventory: number | null | undefined) {
  const base = 'text-xs font-semibold px-2.5 py-1 rounded-full border '
  if (inventory === null || inventory === undefined) return base + 'bg-dark-800 text-dark-400 border-dark-600'
  if (inventory <= 0) return base + 'bg-red-500/15 text-red-300 border-red-500/30'
  if (inventory <= 5) return base + 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  return base + 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
}

function inventorySummary(product: any) {
  if (product.hasUntracked && !(product.variants || []).some((v: any) => isTracked(v))) {
    return 'Not tracked'
  }
  const total = productTotalInventory(product)
  if (total === null) return 'Not tracked'
  if (!isMultiVariant(product)) return stockLabel(total)
  if (total <= 0) return 'Out of stock'
  return `${total} total`
}

function productHasLowStock(product: any) {
  return (product.variants || []).some((v: any) => isTracked(v) && Number(v.inventory) > 0 && Number(v.inventory) <= 5)
}

function productIsOut(product: any) {
  const tracked = (product.variants || []).filter((v: any) => isTracked(v))
  if (!tracked.length) return false
  return tracked.every((v: any) => Number(v.inventory) <= 0)
}

function productNotTracked(product: any) {
  return !(product.variants || []).some((v: any) => isTracked(v))
}

const summary = computed(() => {
  const list = products.value
  let variants = 0
  let lowStock = 0
  let outOfStock = 0
  for (const p of list) {
    for (const v of p.variants || []) {
      variants += 1
      if (!isTracked(v)) continue
      const inv = Number(v.inventory)
      if (inv <= 0) outOfStock += 1
      else if (inv <= 5) lowStock += 1
    }
  }
  return { products: list.length, variants, lowStock, outOfStock }
})

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return products.value.filter((p) => {
    if (activeFilter.value === 'low_stock' && !productHasLowStock(p)) return false
    if (activeFilter.value === 'out_of_stock' && !productIsOut(p)) return false
    if (activeFilter.value === 'not_tracked' && !productNotTracked(p)) return false

    if (!q) return true
    const inProduct = p.name?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q)
    const inVariant = (p.variants || []).some(
      (v: any) =>
        v.name?.toLowerCase().includes(q) ||
        v.sku?.toLowerCase().includes(q)
    )
    return inProduct || inVariant
  })
})

function openQuickSale(product: any, variant: any) {
  if (!isTracked(variant)) {
    showToast('error', 'Inventory is not tracked for this item.')
    return
  }
  if (!canSell(variant)) {
    showToast('error', 'Not enough inventory for this sale.')
    return
  }
  saleModal.show = true
  saleModal.error = ''
  saleModal.variantId = variant.id
  saleModal.productName = product.name
  saleModal.variantName = variant.name
  saleModal.currentStock = Number(variant.inventory) || 0
  saleModal.quantity = 1
  saleModal.paymentMethod = 'cash'
  saleModal.note = ''
}

function openStockAdjust(product: any, variant: any, type: 'add' | 'remove') {
  if (!isTracked(variant) && type === 'remove') {
    showToast('error', 'Inventory is not tracked for this item.')
    return
  }
  if (type === 'remove' && !canSell(variant)) {
    showToast('error', 'Not enough inventory for this sale.')
    return
  }
  stockModal.show = true
  stockModal.error = ''
  stockModal.type = type
  stockModal.variantId = variant.id
  stockModal.productName = product.name
  stockModal.variantName = variant.name
  stockModal.currentStock = Number(variant.inventory ?? 0)
  stockModal.quantity = 1
}

async function fetchProducts() {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ products: any[] }>('/api/admin/products', { credentials: 'include' })
    products.value = res.products || []
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Could not load products.'
    products.value = []
  } finally {
    pending.value = false
  }
}

async function confirmQuickSale() {
  saleModal.error = ''
  const qty = Number(saleModal.quantity)
  if (!Number.isInteger(qty) || qty <= 0) {
    saleModal.error = 'Quantity must be a positive integer.'
    return
  }
  if (qty > saleModal.currentStock) {
    saleModal.error = 'Not enough inventory for this sale.'
    return
  }

  saleModal.loading = true
  try {
    const res = await $fetch<{
      ok: boolean
      previousInventory: number
      newInventory: number
    }>('/api/admin/manual-sales/quick', {
      method: 'POST',
      credentials: 'include',
      body: {
        variantId: saleModal.variantId,
        quantity: qty,
        paymentMethod: saleModal.paymentMethod,
        note: saleModal.note || undefined,
      },
    })
    saleModal.show = false
    showToast(
      'success',
      `Quick sale recorded. Stock updated from ${res.previousInventory} to ${res.newInventory}.`
    )
    await fetchProducts()
  } catch (err: any) {
    const msg =
      err.data?.message ||
      err.message ||
      'Could not record quick sale. Please try again.'
    saleModal.error = msg
    showToast('error', msg)
  } finally {
    saleModal.loading = false
  }
}

async function confirmStockAdjust() {
  stockModal.error = ''
  const qty = Number(stockModal.quantity)
  if (!Number.isInteger(qty) || qty <= 0) {
    stockModal.error = 'Quantity must be a positive integer.'
    return
  }
  if (stockModal.type === 'remove' && qty > stockModal.currentStock) {
    stockModal.error = 'Not enough inventory for this sale.'
    return
  }

  stockModal.loading = true
  try {
    await $fetch('/api/admin/inventory/adjust', {
      method: 'POST',
      credentials: 'include',
      body: {
        variantId: stockModal.variantId,
        adjustmentType: stockModal.type,
        quantity: qty,
        reason: stockModal.type === 'add' ? 'New inventory' : 'Correction',
      },
    })
    stockModal.show = false
    showToast(
      'success',
      stockModal.type === 'add'
        ? `Added ${qty} to stock.`
        : `Removed ${qty} from stock.`
    )
    await fetchProducts()
  } catch (err: any) {
    const msg = err.data?.message || err.message || 'Could not update stock.'
    stockModal.error = msg
    showToast('error', msg)
  } finally {
    stockModal.loading = false
  }
}

onMounted(fetchProducts)
</script>
