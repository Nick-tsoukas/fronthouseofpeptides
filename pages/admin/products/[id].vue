<template>
  <div class="p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/admin/products" class="inline-flex items-center text-dark-400 hover:text-white mb-4 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Products
      </NuxtLink>
      <h1 class="text-2xl font-bold text-white">Edit Product</h1>
      <p class="text-dark-400 mt-1">Update product details and variants</p>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-6 max-w-3xl">
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-4"></div>
        <div class="space-y-4">
          <div class="h-12 bg-dark-800 rounded"></div>
          <div class="h-12 bg-dark-800 rounded"></div>
          <div class="h-24 bg-dark-800 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else-if="!product" class="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center max-w-3xl">
      <h2 class="text-xl font-semibold text-white mb-2">Product Not Found</h2>
      <p class="text-dark-400 mb-6">The product you're looking for doesn't exist.</p>
      <NuxtLink 
        to="/admin/products"
        class="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
      >
        Back to Products
      </NuxtLink>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6 max-w-3xl">
      <!-- Basic Info -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Basic Information</h2>
        
        <div class="space-y-4">
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
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label for="slug" class="block text-sm font-medium text-dark-300 mb-2">
              Slug
            </label>
            <input
              id="slug"
              v-model="form.slug"
              type="text"
              placeholder="bpc-157"
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
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
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
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
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            ></textarea>
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
              class="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="form.active"
                class="w-5 h-5 rounded border-dark-600 bg-dark-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-dark-900"
              />
              <span class="text-dark-300">Active (visible in store)</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="form.requiresConfirmation"
                class="w-5 h-5 rounded border-dark-600 bg-dark-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-dark-900"
              />
              <span class="text-dark-300">Requires research confirmation</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Variants -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Variants</h2>
          <button
            type="button"
            @click="addVariant"
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Variant
          </button>
        </div>

        <div v-if="form.variants.length === 0" class="text-dark-400 text-sm py-8 text-center border border-dashed border-dark-600 rounded-lg">
          No variants. Click "Add Variant" to create one.
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="(variant, index) in form.variants" 
            :key="variant.id || `new-${index}`"
            class="bg-dark-800 rounded-lg p-4 border border-dark-600"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-dark-400 text-sm">
                {{ variant.id ? `Variant #${variant.id}` : 'New Variant' }}
              </span>
              <button
                type="button"
                @click="removeVariant(index)"
                class="text-dark-400 hover:text-red-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs font-medium text-dark-400 mb-1">Name *</label>
                <input
                  v-model="variant.name"
                  type="text"
                  required
                  placeholder="5mg"
                  class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-dark-400 mb-1">SKU *</label>
                <input
                  v-model="variant.sku"
                  type="text"
                  required
                  placeholder="BPC157-5MG"
                  class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-dark-400 mb-1">Price ($) *</label>
                <input
                  v-model.number="variant.price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="39.99"
                  class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-dark-400 mb-1">Inventory</label>
                <input
                  v-model.number="variant.inventory"
                  type="number"
                  min="0"
                  placeholder="100"
                  class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p class="text-red-400">{{ error }}</p>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <p class="text-green-400">{{ success }}</p>
      </div>

      <!-- Submit -->
      <div class="flex gap-4">
        <button
          type="submit"
          :disabled="isLoading"
          class="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-colors"
        >
          {{ isLoading ? 'Saving...' : 'Save Changes' }}
        </button>
        <NuxtLink
          to="/admin/products"
          class="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-lg transition-colors"
        >
          Cancel
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Product, Variant, StrapiResponse } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const config = useRuntimeConfig()
const productId = computed(() => route.params.id as string)

interface VariantForm {
  id?: number
  name: string
  sku: string
  price: number | null
  inventory: number | null
  active: boolean
  _delete?: boolean
}

const product = ref<Product | null>(null)
const pending = ref(true)
const isLoading = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  badgeText: '',
  active: true,
  requiresConfirmation: true,
  variants: [] as VariantForm[],
})

// Track original variants for comparison
const originalVariantIds = ref<number[]>([])

const fetchProduct = async () => {
  pending.value = true
  try {
    const response = await $fetch<StrapiResponse<Product>>(
      `${config.public.strapiUrl}/api/products/${productId.value}?populate=variants`
    )
    product.value = response.data

    if (product.value) {
      const attrs = product.value.attributes
      form.value = {
        name: attrs.name,
        slug: attrs.slug,
        shortDescription: attrs.shortDescription || '',
        description: attrs.description || '',
        badgeText: attrs.badgeText || '',
        active: attrs.active,
        requiresConfirmation: attrs.requiresConfirmation,
        variants: (attrs.variants?.data || []).map(v => ({
          id: v.id,
          name: v.attributes.name,
          sku: v.attributes.sku,
          price: v.attributes.price,
          inventory: v.attributes.inventory,
          active: v.attributes.active,
        })),
      }
      originalVariantIds.value = form.value.variants.map(v => v.id!).filter(Boolean)
    }
  } catch (err) {
    console.error('Error fetching product:', err)
  } finally {
    pending.value = false
  }
}

const addVariant = () => {
  form.value.variants.push({
    name: '',
    sku: '',
    price: null,
    inventory: null,
    active: true,
  })
}

const removeVariant = (index: number) => {
  const variant = form.value.variants[index]
  if (variant.id) {
    // Mark for deletion instead of removing
    variant._delete = true
  }
  form.value.variants.splice(index, 1)
}

const handleSubmit = async () => {
  error.value = ''
  success.value = ''

  // Validate
  if (!form.value.name.trim()) {
    error.value = 'Product name is required'
    return
  }

  for (const variant of form.value.variants) {
    if (!variant.name.trim() || !variant.sku.trim() || variant.price === null) {
      error.value = 'All variant fields (name, SKU, price) are required'
      return
    }
  }

  isLoading.value = true

  try {
    // Determine which variants to delete
    const currentVariantIds = form.value.variants.map(v => v.id).filter(Boolean)
    const variantsToDelete = originalVariantIds.value.filter(id => !currentVariantIds.includes(id))

    await $fetch(`/api/admin/products/${productId.value}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
        slug: form.value.slug,
        shortDescription: form.value.shortDescription,
        description: form.value.description,
        badgeText: form.value.badgeText,
        active: form.value.active,
        requiresConfirmation: form.value.requiresConfirmation,
        variants: form.value.variants,
        variantsToDelete,
      },
    })

    success.value = 'Product updated successfully!'
    
    // Refresh data
    await fetchProduct()
  } catch (err: any) {
    console.error('Error updating product:', err)
    error.value = err.data?.message || err.message || 'Failed to update product'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchProduct)
</script>
