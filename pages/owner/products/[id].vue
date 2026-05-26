<template>
  <div>
    <!-- Back -->
    <NuxtLink to="/owner/products" class="inline-flex items-center gap-1 text-dark-400 hover:text-white text-sm mb-6 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Products
    </NuxtLink>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-dark-900 border border-dark-700 rounded-xl p-5 animate-pulse">
        <div class="h-4 bg-dark-700 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-dark-700 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError || !product" class="text-center py-16">
      <p class="text-red-400 mb-2">{{ fetchError ? 'Could not load product.' : 'Product not found.' }}</p>
      <NuxtLink to="/owner/products" class="text-primary-400 text-sm">← Back to products</NuxtLink>
    </div>

    <div v-else class="space-y-5">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div class="flex gap-4 items-start">
          <!-- Image -->
          <div class="w-20 h-20 rounded-lg bg-dark-800 flex-shrink-0 overflow-hidden border border-dark-700">
            <img
              v-if="product.imageUrl"
              :src="imageUrl(product.imageUrl)"
              :alt="product.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-dark-600 text-xs">No img</div>
          </div>
          <!-- Name + status -->
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-white mb-1">{{ product.name }}</h1>
            <p v-if="product.shortDescription" class="text-dark-400 text-sm mb-2">{{ product.shortDescription }}</p>
            <div class="flex flex-wrap gap-2">
              <span
                :class="product.active
                  ? 'bg-green-500/15 text-green-300 border-green-500/20'
                  : 'bg-dark-700 text-dark-400 border-dark-600'"
                class="text-xs px-2.5 py-1 rounded-full border"
              >
                {{ product.active ? 'Active on storefront' : 'Hidden from storefront' }}
              </span>
              <span v-if="product.badgeText" class="text-xs bg-primary-500/15 text-primary-300 border border-primary-500/20 px-2.5 py-1 rounded-full">
                {{ product.badgeText }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Product Settings ───────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">Product Settings</h2>

        <div class="space-y-4">
          <!-- Active toggle -->
          <div class="flex items-center justify-between gap-4 py-3 border-b border-dark-800">
            <div>
              <p class="text-white text-sm font-medium">Visible on storefront</p>
              <p class="text-dark-500 text-xs mt-0.5">Inactive products are hidden from customers</p>
            </div>
            <button
              :class="productDraft.active
                ? 'bg-primary-500 border-primary-500'
                : 'bg-dark-700 border-dark-600'"
              class="relative w-12 h-6 rounded-full border-2 transition-colors flex-shrink-0"
              @click="productDraft.active = !productDraft.active"
            >
              <span
                :class="productDraft.active ? 'translate-x-6' : 'translate-x-0'"
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              ></span>
            </button>
          </div>

          <!-- Badge text -->
          <div class="py-3 border-b border-dark-800">
            <label class="block text-sm text-dark-300 mb-1.5">Badge Text</label>
            <input
              v-model="productDraft.badgeText"
              type="text"
              maxlength="100"
              placeholder="e.g. Research Use Only"
              class="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors text-sm"
            />
          </div>

          <!-- Short description -->
          <div class="py-3">
            <label class="block text-sm text-dark-300 mb-1.5">Short Description</label>
            <textarea
              v-model="productDraft.shortDescription"
              rows="2"
              maxlength="500"
              placeholder="Brief product description shown on cards…"
              class="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors text-sm resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-2">
          <button
            :disabled="!productChanged || isSavingProduct"
            class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            @click="saveProduct"
          >
            {{ isSavingProduct ? 'Saving…' : 'Save Product' }}
          </button>
          <span v-if="productSaved" class="text-green-400 text-sm">Saved ✓</span>
          <span v-if="productError" class="text-red-400 text-sm">{{ productError }}</span>
        </div>
      </div>

      <!-- ── Variants ───────────────────────────────────────────── -->
      <div class="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <h2 class="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">
          Variants ({{ product.variants.length }})
        </h2>

        <div class="space-y-4">
          <div
            v-for="(v, i) in variantDrafts"
            :key="v.id"
            class="border border-dark-700 rounded-xl p-4"
            :class="!v.active ? 'opacity-60' : ''"
          >
            <!-- Variant header -->
            <div class="flex items-center justify-between gap-3 mb-3">
              <div>
                <p class="text-white font-semibold text-sm">{{ v.name }}</p>
                <p class="text-dark-500 text-xs font-mono">{{ v.sku }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  :class="v.active
                    ? 'bg-green-500/15 text-green-300 border-green-500/20'
                    : 'bg-dark-700 text-dark-400 border-dark-600'"
                  class="text-xs px-2 py-0.5 rounded-full border"
                >
                  {{ v.active ? 'Active' : 'Inactive' }}
                </span>
                <!-- Active toggle -->
                <button
                  :class="v.active ? 'bg-primary-500 border-primary-500' : 'bg-dark-700 border-dark-600'"
                  class="relative w-10 h-5 rounded-full border-2 transition-colors"
                  @click="v.active = !v.active"
                >
                  <span
                    :class="v.active ? 'translate-x-5' : 'translate-x-0'"
                    class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Inventory + price row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-dark-500 mb-1">Inventory</label>
                <div class="relative">
                  <input
                    v-model.number="v.inventoryInput"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="null = unlimited"
                    class="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-white placeholder-dark-600 focus:outline-none focus:border-primary-500 transition-colors text-sm"
                    :class="inventoryError(v) ? 'border-red-500' : ''"
                  />
                </div>
                <p v-if="inventoryError(v)" class="text-red-400 text-xs mt-1">{{ inventoryError(v) }}</p>
                <p v-else class="text-dark-600 text-xs mt-1">Leave blank = unlimited / not tracked</p>
              </div>
              <div>
                <label class="block text-xs text-dark-500 mb-1">Price (USD)</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">$</span>
                  <input
                    v-model.number="v.priceInput"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full bg-dark-800 border border-dark-600 rounded-lg pl-7 pr-3 py-2.5 text-white focus:outline-none focus:border-primary-500 transition-colors text-sm"
                    :class="priceError(v) ? 'border-red-500' : ''"
                  />
                </div>
                <p v-if="priceError(v)" class="text-red-400 text-xs mt-1">{{ priceError(v) }}</p>
              </div>
            </div>

            <!-- Low stock warning -->
            <div
              v-if="v.inventoryInput !== null && v.inventoryInput !== '' && Number(v.inventoryInput) <= 10 && Number(v.inventoryInput) >= 0"
              class="flex items-center gap-2 mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p class="text-yellow-300 text-xs">
                {{ Number(v.inventoryInput) === 0 ? 'Out of stock — customers cannot order this variant.' : `Low stock: ${v.inventoryInput} units remaining.` }}
              </p>
            </div>

            <!-- Save variant button -->
            <div class="flex items-center gap-3 mt-3 pt-3 border-t border-dark-800">
              <button
                :disabled="!variantChanged(i) || !!inventoryError(v) || !!priceError(v) || savingVariantId === v.id"
                class="px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                @click="saveVariant(i)"
              >
                {{ savingVariantId === v.id ? 'Saving…' : 'Save Variant' }}
              </button>
              <span v-if="savedVariantId === v.id" class="text-green-400 text-sm">Saved ✓</span>
              <span v-if="variantErrors[v.id]" class="text-red-400 text-sm">{{ variantErrors[v.id] }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'owner', middleware: 'owner' })

const route = useRoute()
const config = useRuntimeConfig()
const id = route.params.id as string

const { data: product, pending, error: fetchError, refresh } = await useFetch<any>(
  `/api/owner/products/${id}`,
  { headers: useRequestHeaders(['cookie']) }
)

// ── Product draft ──────────────────────────────────────────────────
const productDraft = reactive({
  active: product.value?.active ?? true,
  badgeText: product.value?.badgeText || '',
  shortDescription: product.value?.shortDescription || '',
})

watch(product, (p) => {
  if (!p) return
  productDraft.active = p.active ?? true
  productDraft.badgeText = p.badgeText || ''
  productDraft.shortDescription = p.shortDescription || ''
})

const productChanged = computed(() => {
  if (!product.value) return false
  return (
    productDraft.active !== product.value.active ||
    productDraft.badgeText !== (product.value.badgeText || '') ||
    productDraft.shortDescription !== (product.value.shortDescription || '')
  )
})

const isSavingProduct = ref(false)
const productSaved = ref(false)
const productError = ref('')

async function saveProduct() {
  isSavingProduct.value = true
  productSaved.value = false
  productError.value = ''
  try {
    await $fetch(`/api/owner/products/${id}`, {
      method: 'PATCH',
      headers: useRequestHeaders(['cookie']),
      body: {
        active: productDraft.active,
        badgeText: productDraft.badgeText,
        shortDescription: productDraft.shortDescription,
      },
    })
    productSaved.value = true
    await refresh()
    setTimeout(() => { productSaved.value = false }, 3000)
  } catch (err: any) {
    productError.value = err.data?.message || 'Failed to save product.'
  } finally {
    isSavingProduct.value = false
  }
}

// ── Variant drafts ─────────────────────────────────────────────────
type VariantDraft = {
  id: number
  name: string
  sku: string
  active: boolean
  inventoryInput: number | string | null
  priceInput: number
}

const variantDrafts = ref<VariantDraft[]>([])

function buildDrafts() {
  variantDrafts.value = (product.value?.variants || []).map((v: any) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    active: v.active,
    inventoryInput: v.inventory === null ? '' : v.inventory,
    priceInput: v.price,
  }))
}
buildDrafts()
watch(product, buildDrafts)

function inventoryError(v: VariantDraft): string {
  if (v.inventoryInput === '' || v.inventoryInput === null) return ''
  const n = Number(v.inventoryInput)
  if (!Number.isInteger(n) || n < 0) return 'Must be 0 or a positive whole number'
  return ''
}

function priceError(v: VariantDraft): string {
  const n = Number(v.priceInput)
  if (isNaN(n) || n < 0) return 'Must be a non-negative number'
  return ''
}

function variantChanged(i: number): boolean {
  const orig = product.value?.variants?.[i]
  const draft = variantDrafts.value[i]
  if (!orig || !draft) return false
  const origInv = orig.inventory === null ? '' : orig.inventory
  return (
    draft.active !== orig.active ||
    draft.inventoryInput !== origInv ||
    Number(draft.priceInput) !== orig.price
  )
}

const savingVariantId = ref<number | null>(null)
const savedVariantId = ref<number | null>(null)
const variantErrors = ref<Record<number, string>>({})

async function saveVariant(i: number) {
  const draft = variantDrafts.value[i]
  if (!draft) return
  savingVariantId.value = draft.id
  savedVariantId.value = null
  variantErrors.value[draft.id] = ''

  const body: Record<string, any> = {
    active: draft.active,
    price: Number(draft.priceInput),
  }
  if (draft.inventoryInput === '' || draft.inventoryInput === null) {
    body.inventory = null
  } else {
    body.inventory = Number(draft.inventoryInput)
  }

  try {
    await $fetch(`/api/owner/variants/${draft.id}`, {
      method: 'PATCH',
      headers: useRequestHeaders(['cookie']),
      body,
    })
    savedVariantId.value = draft.id
    await refresh()
    setTimeout(() => { savedVariantId.value = null }, 3000)
  } catch (err: any) {
    variantErrors.value[draft.id] = err.data?.message || 'Failed to save variant.'
  } finally {
    savingVariantId.value = null
  }
}

function imageUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${config.public.strapiUrl}${url}`
}
</script>
