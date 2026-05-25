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
      <h1 class="text-2xl font-bold text-white">Add New Product</h1>
      <p class="text-dark-400 mt-1">Create a new product with variants</p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-3xl">
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
              Slug <span class="text-dark-500">(auto-generated)</span>
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
          No variants added. Click "Add Variant" to create one.
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="(variant, index) in form.variants" 
            :key="index"
            class="bg-dark-800 rounded-lg p-4 border border-dark-600"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-dark-400 text-sm">Variant {{ index + 1 }}</span>
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

      <!-- Submit -->
      <div class="flex gap-4">
        <button
          type="submit"
          :disabled="isLoading"
          class="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-dark-700 disabled:text-dark-500 text-white font-semibold rounded-lg transition-colors"
        >
          {{ isLoading ? 'Creating...' : 'Create Product' }}
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
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const router = useRouter()

interface VariantForm {
  name: string
  sku: string
  price: number | null
  inventory: number | null
  active: boolean
}

const form = ref({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  badgeText: 'Research Use Only',
  active: true,
  requiresConfirmation: true,
  variants: [] as VariantForm[],
})

const isLoading = ref(false)
const error = ref('')

// Auto-generate slug from name
watch(() => form.value.name, (name) => {
  if (!form.value.slug || form.value.slug === slugify(form.value.name.slice(0, -1))) {
    form.value.slug = slugify(name)
  }
})

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  form.value.variants.splice(index, 1)
}

const handleSubmit = async () => {
  error.value = ''

  // Validate
  if (!form.value.name.trim()) {
    error.value = 'Product name is required'
    return
  }

  if (form.value.variants.length === 0) {
    error.value = 'At least one variant is required'
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
    const response = await $fetch<{ data: { id: number } }>('/api/admin/products', {
      method: 'POST',
      body: {
        name: form.value.name,
        slug: form.value.slug || slugify(form.value.name),
        shortDescription: form.value.shortDescription,
        description: form.value.description,
        badgeText: form.value.badgeText,
        active: form.value.active,
        requiresConfirmation: form.value.requiresConfirmation,
        variants: form.value.variants,
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
