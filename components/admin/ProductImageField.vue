<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-dark-300">
      Product Image
    </label>

    <div class="flex flex-col sm:flex-row gap-4 items-start">
      <div
        class="relative w-full sm:w-40 aspect-square rounded-xl overflow-hidden border border-dark-600 bg-dark-800 flex items-center justify-center shrink-0"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Product preview"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div v-else class="text-center px-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-dark-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-dark-500 text-xs">No image</p>
        </div>
      </div>

      <div class="flex-1 space-y-3 w-full">
        <p class="text-dark-400 text-sm leading-relaxed">
          Upload a JPG, PNG, WEBP, or GIF (max 8MB). This image shows on the storefront product card and detail page.
        </p>

        <div class="flex flex-wrap gap-2.5">
          <label
            class="inline-flex min-h-[44px] items-center justify-center px-4 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white text-sm font-medium cursor-pointer transition-colors"
            :class="{ 'opacity-60 pointer-events-none': uploading }"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="sr-only"
              :disabled="uploading"
              @change="onFileChange"
            />
            {{ uploading ? 'Uploading…' : previewUrl ? 'Replace Image' : 'Upload Image' }}
          </label>

          <button
            v-if="previewUrl || imageId"
            type="button"
            class="inline-flex min-h-[44px] items-center justify-center px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-300 text-sm font-medium transition-colors"
            :disabled="uploading"
            @click="clearImage"
          >
            Remove
          </button>
        </div>

        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  imageId: number | null
  imageUrl: string | null
  productId?: number | null
}>()

const emit = defineEmits<{
  'update:imageId': [value: number | null]
  'update:imageUrl': [value: string | null]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref('')
const localPreview = ref<string | null>(null)

const previewUrl = computed(() => localPreview.value || props.imageUrl)

async function onFileChange(event: Event) {
  error.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    error.value = 'Please choose an image file.'
    input.value = ''
    return
  }

  if (file.size > 8 * 1024 * 1024) {
    error.value = 'Image must be 8MB or smaller.'
    input.value = ''
    return
  }

  if (localPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localPreview.value)
  }
  localPreview.value = URL.createObjectURL(file)

  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    if (props.productId) {
      body.append('productId', String(props.productId))
    }

    const res = await $fetch<{ ok: boolean; id: number; url: string | null }>(
      '/api/admin/upload',
      {
        method: 'POST',
        credentials: 'include',
        body,
      }
    )

    emit('update:imageId', res.id)
    emit('update:imageUrl', res.url)
    if (localPreview.value?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview.value)
    }
    localPreview.value = res.url
  } catch (err: any) {
    console.error('Product image upload failed:', err)
    error.value = err.data?.message || err.message || 'Upload failed.'
    if (localPreview.value?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview.value)
    }
    localPreview.value = null
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function clearImage() {
  error.value = ''
  if (localPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localPreview.value)
  }
  localPreview.value = null
  emit('update:imageId', null)
  emit('update:imageUrl', null)
  if (fileInput.value) fileInput.value.value = ''
}

onBeforeUnmount(() => {
  if (localPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localPreview.value)
  }
})
</script>
