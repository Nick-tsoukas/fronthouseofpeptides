<template>
  <div class="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
    <div class="mb-6">
      <NuxtLink to="/admin/products" class="inline-flex items-center min-h-[44px] text-dark-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Products
      </NuxtLink>
      <h1 class="text-2xl font-bold text-white">Add New Product</h1>
      <p class="text-dark-400 mt-1 text-sm">Name, price, stock, and image.</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-5 max-w-3xl">
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6 space-y-4">
        <h2 class="text-lg font-semibold text-white">Basic Information</h2>

        <div>
          <label for="name" class="block text-sm font-medium text-dark-300 mb-2">
            Product Name <span class="text-red-400">*</span>
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            placeholder="e.g., BPC-157"
            class="field-input"
          />
        </div>

        <div>
          <label for="slug" class="block text-sm font-medium text-dark-300 mb-2">
            Slug <span class="text-dark-500">(auto-generated)</span>
          </label>
          <input
            id="slug"
            v-model="form.slug"
            type="text"
            placeholder="bpc-157"
            class="field-input"
          />
        </div>

        <div>
          <label for="shortDescription" class="block text-sm font-medium text-dark-300 mb-2">
            Short Description
          </label>
          <input
            id="shortDescription"
            v-model="form.shortDescription"
            type="text"
            placeholder="Brief product summary"
            class="field-input"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-dark-300 mb-2">
            Full Description
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="4"
            placeholder="Detailed product description for research purposes"
            class="field-input resize-none"
          />
        </div>

        <div>
          <label for="badgeText" class="block text-sm font-medium text-dark-300 mb-2">
            Badge Text
          </label>
          <input
            id="badgeText"
            v-model="form.badgeText"
            type="text"
            placeholder="Research Use Only"
            class="field-input"
          />
        </div>

        <AdminProductImageField
          v-model:image-id="form.imageId"
          v-model:image-url="form.imageUrl"
          v-model:generated-image-url="form.generatedImageUrl"
          v-model:image-source="form.imageSource"
        />

        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <label class="flex items-center gap-2 min-h-[44px] cursor-pointer">
            <input
              v-model="form.active"
              type="checkbox"
              class="w-5 h-5 rounded border-dark-600 bg-dark-800 text-cyan-500"
            />
            <span class="text-dark-300">Active (visible in store)</span>
          </label>

          <label class="flex items-center gap-2 min-h-[44px] cursor-pointer">
            <input
              v-model="form.requiresConfirmation"
              type="checkbox"
              class="w-5 h-5 rounded border-dark-600 bg-dark-800 text-cyan-500"
            />
            <span class="text-dark-300">Requires research confirmation</span>
          </label>
        </div>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-semibold text-white">Price &amp; variants</h2>
            <p class="text-dark-400 text-xs mt-0.5">Set price on each size/variant. At least one is required.</p>
          </div>
          <button
            type="button"
            class="shrink-0 inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg"
            @click="addVariant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="(variant, index) in form.variants"
            :key="index"
            class="bg-dark-800 rounded-xl p-4 border border-dark-600 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-dark-400 text-sm">Variant {{ index + 1 }}</span>
              <button
                v-if="form.variants.length > 1"
                type="button"
                class="min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-dark-400 hover:text-red-400"
                @click="removeVariant(index)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-dark-400 mb-1">Size / name *</label>
                <input
                  v-model="variant.name"
                  type="text"
                  required
                  placeholder="5mg"
                  class="field-input"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-dark-400 mb-1">SKU *</label>
                <input
                  v-model="variant.sku"
                  type="text"
                  required
                  placeholder="BPC157-5MG"
                  class="field-input"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-cyan-300/90 mb-1">Price (USD) *</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">$</span>
                  <input
                    v-model="variant.price"
                    type="text"
                    inputmode="decimal"
                    required
                    placeholder="39.99"
                    autocomplete="off"
                    class="field-input pl-7 border-cyan-500/30 focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-dark-400 mb-1">Inventory</label>
                <input
                  v-model="variant.inventory"
                  type="text"
                  inputmode="numeric"
                  placeholder="100"
                  autocomplete="off"
                  class="field-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p class="text-red-400 text-sm">{{ error }}</p>
      </div>

      <div class="flex flex-col-reverse sm:flex-row gap-3">
        <NuxtLink
          to="/admin/products"
          class="inline-flex min-h-[48px] items-center justify-center px-6 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-medium"
        >
          Cancel
        </NuxtLink>
        <button
          type="submit"
          :disabled="isLoading"
          class="min-h-[48px] px-6 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold"
        >
          {{ isLoading ? 'Creating…' : 'Create Product' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const router = useRouter()

interface VariantForm {
  name: string
  sku: string
  price: string
  inventory: string
  active: boolean
}

function blankVariant(): VariantForm {
  return {
    name: '',
    sku: '',
    price: '',
    inventory: '',
    active: true,
  }
}

const form = ref({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  badgeText: 'Research Use Only',
  active: true,
  requiresConfirmation: true,
  imageId: null as number | null,
  imageUrl: null as string | null,
  generatedImageUrl: null as string | null,
  imageSource: 'placeholder' as 'uploaded' | 'generated' | 'placeholder',
  // Always start with one variant so price is visible immediately.
  variants: [blankVariant()] as VariantForm[],
})

const isLoading = ref(false)
const error = ref('')

watch(() => form.value.name, (name) => {
  if (!form.value.slug || form.value.slug === slugify(form.value.name.slice(0, -1))) {
    form.value.slug = slugify(name)
  }
})

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function addVariant() {
  form.value.variants.push(blankVariant())
}

function removeVariant(index: number) {
  if (form.value.variants.length <= 1) return
  form.value.variants.splice(index, 1)
}

function parsePrice(raw: string): number | null {
  const cleaned = String(raw ?? '').trim().replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}

function parseInventory(raw: string): number | null {
  const cleaned = String(raw ?? '').trim()
  if (!cleaned) return null
  const n = Number.parseInt(cleaned, 10)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

async function handleSubmit() {
  error.value = ''

  if (!form.value.name.trim()) {
    error.value = 'Product name is required'
    return
  }

  if (form.value.variants.length === 0) {
    error.value = 'At least one variant is required'
    return
  }

  const variants = []
  for (const variant of form.value.variants) {
    const price = parsePrice(variant.price)
    if (!variant.name.trim() || !variant.sku.trim()) {
      error.value = 'Each variant needs a name and SKU.'
      return
    }
    if (price === null) {
      error.value = 'Each variant needs a valid price (example: 39.99).'
      return
    }
    variants.push({
      name: variant.name.trim(),
      sku: variant.sku.trim(),
      price,
      inventory: parseInventory(variant.inventory),
      active: variant.active,
    })
  }

  isLoading.value = true

  try {
    const response = await $fetch<{ data: { id: number } }>('/api/admin/products', {
      method: 'POST',
      credentials: 'include',
      body: {
        name: form.value.name,
        slug: form.value.slug || slugify(form.value.name),
        shortDescription: form.value.shortDescription,
        description: form.value.description,
        badgeText: form.value.badgeText,
        active: form.value.active,
        requiresConfirmation: form.value.requiresConfirmation,
        imageId: form.value.imageId,
        variants,
      },
    })

    router.push(`/admin/products/${response.data.id}`)
  } catch (err: any) {
    console.error('Error creating product:', err)
    error.value = err.data?.message || err.message || 'Failed to create product'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.field-input {
  @apply w-full min-h-[48px] px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white text-base placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors;
}
</style>
