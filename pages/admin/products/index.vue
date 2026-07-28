<template>
  <div class="p-6 lg:p-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Products</h1>
        <p class="text-dark-400 mt-1">Manage catalog and inventory</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium rounded-lg transition-colors"
          @click="openManualSale()"
        >
          Record manual sale
        </button>
        <NuxtLink
          to="/admin/products/new"
          class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
        >
          Add Product
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="toast"
      class="mb-4 rounded-lg px-4 py-3 text-sm"
      :class="toast.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'"
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
                  <button type="button" class="text-left" @click="toggleExpand(product.id)">
                    <p class="text-white font-medium">{{ product.name }}</p>
                    <p class="text-dark-400 text-xs">{{ product.slug }}</p>
                  </button>
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
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="px-2.5 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                      @click="toggleExpand(product.id)"
                    >
                      {{ expanded[product.id] ? 'Hide' : 'Stock' }}
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
              <tr v-if="expanded[product.id]" class="bg-dark-950/60 border-b border-dark-700">
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
                        </p>
                      </div>
                      <div class="flex items-center gap-3">
                        <span :class="stockClass(variant.inventory)">{{ stockLabel(variant.inventory) }}</span>
                        <button
                          type="button"
                          class="px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg"
                          @click="openAdjust(product, variant)"
                        >
                          Adjust stock
                        </button>
                        <button
                          type="button"
                          class="px-3 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                          @click="openManualSale(product, variant)"
                        >
                          Manual sale
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

    <!-- Adjust stock modal -->
    <div
      v-if="adjustModal.show"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="adjustModal.show = false"
    >
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-1">Adjust stock</h3>
        <p class="text-dark-400 text-sm mb-4">
          {{ adjustModal.productName }} — {{ adjustModal.variantName }}
        </p>
        <p class="text-sm text-dark-300 mb-4">Current stock: <strong class="text-white">{{ adjustModal.currentStock }}</strong></p>

        <div class="space-y-3">
          <label class="block text-sm text-dark-300">
            Adjustment type
            <select v-model="adjustModal.adjustmentType" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white">
              <option value="add">Add stock</option>
              <option value="remove">Remove stock</option>
              <option value="set">Set exact stock</option>
            </select>
          </label>
          <label class="block text-sm text-dark-300">
            Quantity
            <input v-model.number="adjustModal.quantity" type="number" min="0" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white" />
          </label>
          <label class="block text-sm text-dark-300">
            Reason
            <select v-model="adjustModal.reason" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white">
              <option v-for="r in reasons" :key="r" :value="r">{{ r }}</option>
            </select>
          </label>
          <label class="block text-sm text-dark-300">
            Note (optional)
            <textarea v-model="adjustModal.note" rows="2" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white resize-none" />
          </label>
        </div>

        <p v-if="adjustModal.error" class="mt-3 text-red-400 text-sm">{{ adjustModal.error }}</p>

        <div class="mt-5 flex gap-3">
          <button type="button" class="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg" @click="adjustModal.show = false">Cancel</button>
          <button
            type="button"
            class="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg"
            :disabled="adjustModal.loading"
            @click="confirmAdjust"
          >
            {{ adjustModal.loading ? 'Saving…' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Manual sale modal -->
    <div
      v-if="saleModal.show"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="saleModal.show = false"
    >
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-white mb-4">Record manual sale</h3>

        <div class="space-y-3">
          <label class="block text-sm text-dark-300">
            Product / variant
            <select v-model="saleModal.variantId" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white">
              <option disabled :value="0">Select variant</option>
              <optgroup v-for="p in products" :key="p.id" :label="p.name">
                <option v-for="v in p.variants" :key="v.id" :value="v.id">
                  {{ v.name }} ({{ stockLabel(v.inventory) }})
                </option>
              </optgroup>
            </select>
          </label>
          <label class="block text-sm text-dark-300">
            Quantity
            <input v-model.number="saleModal.quantity" type="number" min="1" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white" />
          </label>
          <label class="block text-sm text-dark-300">
            Customer name (optional)
            <input v-model="saleModal.customerName" type="text" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white" />
          </label>
          <label class="block text-sm text-dark-300">
            Customer email (optional)
            <input v-model="saleModal.customerEmail" type="email" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white" />
          </label>
          <label class="block text-sm text-dark-300">
            Payment method
            <select v-model="saleModal.paymentMethod" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white">
              <option value="cash">Cash</option>
              <option value="external">External</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label class="block text-sm text-dark-300">
            Note
            <textarea v-model="saleModal.note" rows="2" class="mt-1 w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white resize-none" />
          </label>
        </div>

        <p v-if="saleModal.error" class="mt-3 text-red-400 text-sm">{{ saleModal.error }}</p>

        <div class="mt-5 flex gap-3">
          <button type="button" class="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg" @click="saleModal.show = false">Cancel</button>
          <button
            type="button"
            class="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg"
            :disabled="saleModal.loading"
            @click="confirmManualSale"
          >
            {{ saleModal.loading ? 'Saving…' : 'Confirm sale' }}
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

const reasons = [
  'New inventory',
  'Manual/offline sale',
  'Damaged/lost',
  'Correction',
  'Return/restock',
  'Other',
]

const products = ref<any[]>([])
const pending = ref(true)
const error = ref('')
const expanded = ref<Record<number, boolean>>({})
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const adjustModal = reactive({
  show: false,
  loading: false,
  error: '',
  variantId: 0,
  productName: '',
  variantName: '',
  currentStock: 0,
  adjustmentType: 'add' as 'add' | 'remove' | 'set',
  quantity: 1,
  reason: 'New inventory',
  note: '',
})

const saleModal = reactive({
  show: false,
  loading: false,
  error: '',
  variantId: 0,
  quantity: 1,
  customerName: '',
  customerEmail: '',
  paymentMethod: 'cash' as 'cash' | 'external' | 'other',
  note: '',
})

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => {
    toast.value = null
  }, 4000)
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
  if (text.startsWith('Low') || (product.totalStock > 0 && product.totalStock <= 5)) return 'text-amber-400 font-medium'
  if (text === 'Not tracked') return 'text-dark-400'
  return 'text-green-400 font-medium'
}

function toggleExpand(id: number) {
  expanded.value[id] = !expanded.value[id]
}

function openAdjust(product: any, variant: any) {
  adjustModal.show = true
  adjustModal.error = ''
  adjustModal.variantId = variant.id
  adjustModal.productName = product.name
  adjustModal.variantName = variant.name
  adjustModal.currentStock = variant.inventory ?? 0
  adjustModal.adjustmentType = 'add'
  adjustModal.quantity = 1
  adjustModal.reason = 'New inventory'
  adjustModal.note = ''
}

function openManualSale(product?: any, variant?: any) {
  saleModal.show = true
  saleModal.error = ''
  saleModal.variantId = variant?.id || 0
  saleModal.quantity = 1
  saleModal.customerName = ''
  saleModal.customerEmail = ''
  saleModal.paymentMethod = 'cash'
  saleModal.note = ''
  if (product?.id) expanded.value[product.id] = true
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

async function confirmAdjust() {
  adjustModal.error = ''
  const qty = Number(adjustModal.quantity)
  if (!Number.isInteger(qty) || qty < 0 || (adjustModal.adjustmentType !== 'set' && qty <= 0)) {
    adjustModal.error = 'Enter a valid quantity.'
    return
  }
  if (adjustModal.adjustmentType === 'remove' && qty > adjustModal.currentStock) {
    adjustModal.error = `Cannot remove more than current stock (${adjustModal.currentStock}).`
    return
  }

  const preview =
    adjustModal.adjustmentType === 'add'
      ? adjustModal.currentStock + qty
      : adjustModal.adjustmentType === 'remove'
        ? adjustModal.currentStock - qty
        : qty

  if (!confirm(`Update stock from ${adjustModal.currentStock} to ${preview}?`)) return

  adjustModal.loading = true
  try {
    await $fetch('/api/admin/inventory/adjust', {
      method: 'POST',
      credentials: 'include',
      body: {
        variantId: adjustModal.variantId,
        adjustmentType: adjustModal.adjustmentType,
        quantity: qty,
        reason: adjustModal.reason,
        note: adjustModal.note || undefined,
      },
    })
    adjustModal.show = false
    showToast('success', 'Inventory updated.')
    await fetchProducts()
  } catch (err: any) {
    adjustModal.error = err.data?.message || err.message || 'Could not update inventory.'
    showToast('error', adjustModal.error)
  } finally {
    adjustModal.loading = false
  }
}

async function confirmManualSale() {
  saleModal.error = ''
  if (!saleModal.variantId) {
    saleModal.error = 'Select a variant.'
    return
  }
  if (!Number.isInteger(saleModal.quantity) || saleModal.quantity <= 0) {
    saleModal.error = 'Quantity must be a positive integer.'
    return
  }
  if (!confirm(`Record manual sale of ${saleModal.quantity} unit(s)? This decreases inventory.`)) return

  saleModal.loading = true
  try {
    await $fetch('/api/admin/manual-sale', {
      method: 'POST',
      credentials: 'include',
      body: {
        variantId: saleModal.variantId,
        quantity: saleModal.quantity,
        customerName: saleModal.customerName || undefined,
        customerEmail: saleModal.customerEmail || undefined,
        paymentMethod: saleModal.paymentMethod,
        note: saleModal.note || undefined,
      },
    })
    saleModal.show = false
    showToast('success', 'Manual sale recorded. Inventory updated.')
    await fetchProducts()
  } catch (err: any) {
    saleModal.error = err.data?.message || err.message || 'Could not record sale.'
    showToast('error', saleModal.error)
  } finally {
    saleModal.loading = false
  }
}

onMounted(fetchProducts)
</script>
