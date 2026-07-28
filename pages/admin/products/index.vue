<template>
  <div class="p-6 lg:p-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Products</h1>
        <p class="text-dark-400 mt-1">Catalog, stock, and in-person sales</p>
      </div>
      <NuxtLink
        to="/admin/products/new"
        class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
      >
        Add Product
      </NuxtLink>
    </div>

    <div
      v-if="toast"
      class="mb-4 rounded-lg px-4 py-3 text-sm"
      :class="toast.type === 'success'
        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
        : 'bg-red-500/10 border border-red-500/30 text-red-400'"
    >
      {{ toast.message }}
    </div>

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-dark-800 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
      <p class="text-red-400 mb-3">{{ error }}</p>
      <NuxtLink to="/admin/login" class="text-cyan-400 text-sm underline">Sign in again</NuxtLink>
    </div>

    <div v-else-if="products.length === 0" class="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center">
      <h2 class="text-xl font-semibold text-white mb-2">No products yet</h2>
      <NuxtLink to="/admin/products/new" class="text-cyan-400">Add Product</NuxtLink>
    </div>

    <div v-else class="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-dark-700">
              <th class="text-left px-6 py-4 text-dark-400 font-medium">Product</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium">Variants</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium">Price Range</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium">Inventory</th>
              <th class="text-left px-6 py-4 text-dark-400 font-medium">Status</th>
              <th class="text-right px-6 py-4 text-dark-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="product in products" :key="product.id">
              <tr class="border-b border-dark-700 hover:bg-dark-800/50 transition-colors">
                <td class="px-6 py-4">
                  <button
                    v-if="isMultiVariant(product)"
                    type="button"
                    class="text-left"
                    @click="toggleExpand(product.id)"
                  >
                    <p class="text-white font-medium">{{ product.name }}</p>
                    <p class="text-dark-400 text-xs">{{ product.slug }}</p>
                  </button>
                  <div v-else>
                    <p class="text-white font-medium">{{ product.name }}</p>
                    <p class="text-dark-400 text-xs">{{ product.slug }}</p>
                  </div>
                </td>
                <td class="px-6 py-4 text-white">{{ product.variantCount }}</td>
                <td class="px-6 py-4 text-white">{{ priceRange(product) }}</td>
                <td class="px-6 py-4">
                  <span :class="inventorySummaryClass(product)">{{ inventorySummary(product) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="product.active ? 'bg-green-500/10 text-green-400' : 'bg-dark-600 text-dark-400'"
                    class="px-2 py-1 text-xs font-medium rounded"
                  >
                    {{ product.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2 flex-wrap">
                    <!-- Single-variant: Quick Sale on the row -->
                    <template v-if="!isMultiVariant(product) && product.variants?.[0]">
                      <button
                        type="button"
                        class="px-2.5 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium"
                        :disabled="!canSell(product.variants[0])"
                        @click="openQuickSale(product, product.variants[0])"
                      >
                        Quick Sale
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                        @click="openStockAdjust(product, product.variants[0], 'add')"
                      >
                        + Add
                      </button>
                      <button
                        type="button"
                        class="px-2 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                        :disabled="!canSell(product.variants[0])"
                        @click="openStockAdjust(product, product.variants[0], 'remove')"
                      >
                        − Remove
                      </button>
                    </template>
                    <button
                      v-if="isMultiVariant(product)"
                      type="button"
                      class="px-2.5 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                      @click="toggleExpand(product.id)"
                    >
                      {{ expanded[product.id] ? 'Hide' : 'Expand' }}
                    </button>
                    <NuxtLink
                      :to="`/admin/products/${product.id}`"
                      class="px-2.5 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                    >
                      Edit
                    </NuxtLink>
                  </div>
                </td>
              </tr>

              <!-- Multi-variant expanded rows -->
              <tr v-if="isMultiVariant(product) && expanded[product.id]" class="bg-dark-950/60 border-b border-dark-700">
                <td colspan="6" class="px-6 py-4">
                  <div class="space-y-2">
                    <div
                      v-for="variant in product.variants"
                      :key="variant.id"
                      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dark-700 bg-dark-900 px-4 py-3"
                    >
                      <div>
                        <p class="text-white font-medium">{{ variant.name }}</p>
                        <p class="text-dark-400 text-xs">
                          <span v-if="variant.sku">SKU {{ variant.sku }} · </span>
                          ${{ Number(variant.price).toFixed(2) }}
                          · Stock: {{ variant.inventory ?? '—' }}
                        </p>
                      </div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span :class="stockClass(variant.inventory)">{{ stockLabel(variant.inventory) }}</span>
                        <button
                          type="button"
                          class="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium"
                          :disabled="!canSell(variant)"
                          @click="openQuickSale(product, variant)"
                        >
                          Quick Sale
                        </button>
                        <button
                          type="button"
                          class="px-2.5 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                          @click="openStockAdjust(product, variant, 'add')"
                        >
                          + Add
                        </button>
                        <button
                          type="button"
                          class="px-2.5 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                          :disabled="!canSell(variant)"
                          @click="openStockAdjust(product, variant, 'remove')"
                        >
                          − Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Quick Sale modal -->
    <div
      v-if="saleModal.show"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="saleModal.show = false"
    >
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-6 w-full max-w-sm">
        <h3 class="text-lg font-semibold text-white mb-4">Quick Sale</h3>

        <div class="space-y-3 text-sm mb-4">
          <div>
            <p class="text-dark-500 text-xs mb-0.5">Product</p>
            <p class="text-white">{{ saleModal.productName }}</p>
          </div>
          <div>
            <p class="text-dark-500 text-xs mb-0.5">Variant</p>
            <p class="text-white">{{ saleModal.variantName }}</p>
          </div>
          <div>
            <p class="text-dark-500 text-xs mb-0.5">Current stock</p>
            <p class="text-white font-medium">{{ saleModal.currentStock }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <label class="block text-sm text-dark-300">
            Quantity sold
            <input
              v-model.number="saleModal.quantity"
              type="number"
              min="1"
              :max="saleModal.currentStock"
              class="mt-1 w-full px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </label>
          <label class="block text-sm text-dark-300">
            Payment method
            <select
              v-model="saleModal.paymentMethod"
              class="mt-1 w-full px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="cash">Cash</option>
              <option value="external">External</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label class="block text-sm text-dark-300">
            Note <span class="text-dark-500">(optional)</span>
            <input
              v-model="saleModal.note"
              type="text"
              class="mt-1 w-full px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Optional"
            />
          </label>
        </div>

        <p v-if="saleModal.error" class="mt-3 text-red-400 text-sm">{{ saleModal.error }}</p>

        <div class="mt-5 flex gap-3">
          <button
            type="button"
            class="flex-1 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
            @click="saleModal.show = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg"
            :disabled="saleModal.loading"
            @click="confirmQuickSale"
          >
            {{ saleModal.loading ? 'Saving…' : 'Confirm Sale' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tiny +Add / −Remove modal -->
    <div
      v-if="stockModal.show"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="stockModal.show = false"
    >
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-6 w-full max-w-sm">
        <h3 class="text-lg font-semibold text-white mb-1">
          {{ stockModal.type === 'add' ? 'Add stock' : 'Remove stock' }}
        </h3>
        <p class="text-dark-400 text-sm mb-4">
          {{ stockModal.productName }} — {{ stockModal.variantName }}
          (current: {{ stockModal.currentStock }})
        </p>

        <label class="block text-sm text-dark-300 mb-4">
          Quantity
          <input
            v-model.number="stockModal.quantity"
            type="number"
            min="1"
            class="mt-1 w-full px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          />
        </label>

        <p v-if="stockModal.error" class="mb-3 text-red-400 text-sm">{{ stockModal.error }}</p>

        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 px-4 py-2.5 bg-dark-700 text-white rounded-lg"
            @click="stockModal.show = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-lg"
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
const expanded = ref<Record<number, boolean>>({})
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

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

function canSell(variant: any) {
  return variant?.inventory != null && Number(variant.inventory) > 0
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

function stockLabel(inventory: number | null) {
  if (inventory === null || inventory === undefined) return 'Not tracked'
  if (inventory <= 0) return 'Out of stock'
  if (inventory <= 5) return `Low stock (${inventory})`
  return `${inventory} in stock`
}

function stockClass(inventory: number | null) {
  if (inventory === null || inventory === undefined) return 'text-dark-400 text-xs'
  if (inventory <= 0) return 'text-red-400 text-xs font-medium'
  if (inventory <= 5) return 'text-amber-400 text-xs font-medium'
  return 'text-green-400 text-xs font-medium'
}

function inventorySummary(product: any) {
  if (product.hasUntracked && !(product.variants || []).some((v: any) => v.inventory !== null)) {
    return 'Not tracked'
  }
  const count = product.variantCount || 0
  const total = product.totalStock || 0
  if (count <= 1) {
    const inv = product.variants?.[0]?.inventory
    if (inv === null || inv === undefined) return 'Not tracked'
    if (inv <= 0) return 'Out of stock'
    return `${inv} in stock`
  }
  if (total <= 0 && !product.hasUntracked) return 'Out of stock'
  return `${total} total`
}

function inventorySummaryClass(product: any) {
  const text = inventorySummary(product)
  if (text === 'Out of stock') return 'text-red-400 font-medium'
  if (text.includes('Low') || (product.totalStock > 0 && product.totalStock <= 5 && !isMultiVariant(product))) {
    return 'text-amber-400 font-medium'
  }
  if (text === 'Not tracked') return 'text-dark-400'
  return 'text-green-400 font-medium'
}

function toggleExpand(id: number) {
  expanded.value[id] = !expanded.value[id]
}

function openQuickSale(product: any, variant: any) {
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
      `Quick sale recorded. Inventory updated from ${res.previousInventory} to ${res.newInventory}.`
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
