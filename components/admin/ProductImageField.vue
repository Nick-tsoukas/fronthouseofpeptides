<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-dark-300">
      Product Image
    </label>

    <div class="flex flex-col sm:flex-row gap-4 items-start">
      <div
        class="relative w-full sm:w-44 aspect-[4/3] rounded-xl overflow-hidden border border-dark-600 bg-dark-800 flex items-center justify-center shrink-0"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Product preview"
          class="absolute inset-0 w-full h-full object-cover"
          @error="onPreviewError"
        />
        <div v-else class="text-center px-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-dark-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-dark-500 text-xs">Placeholder</p>
        </div>
      </div>

      <div class="flex-1 space-y-3 w-full">
        <p class="text-xs font-medium uppercase tracking-wide" :class="sourceLabelClass">
          {{ sourceLabel }}
        </p>
        <p class="text-dark-400 text-sm leading-relaxed">
          Upload a photo, or generate a branded Quantum Bio Peptides card. Uploaded photos always show on the storefront first.
        </p>

        <div class="flex flex-wrap gap-2.5">
          <label
            class="inline-flex min-h-[44px] items-center justify-center px-4 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white text-sm font-medium cursor-pointer transition-colors"
            :class="{ 'opacity-60 pointer-events-none': uploading || generating }"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="sr-only"
              :disabled="uploading || generating"
              @change="onFileChange"
            />
            {{ uploading ? 'Uploading…' : imageId ? 'Replace Image' : 'Upload Image' }}
          </label>

          <button
            v-if="productId"
            type="button"
            class="inline-flex min-h-[44px] items-center justify-center px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            :disabled="uploading || generating"
            @click="generateImage"
          >
            {{ generating ? 'Generating…' : generatedImageUrl ? 'Regenerate Image' : 'Generate Image' }}
          </button>

          <button
            v-if="imageId"
            type="button"
            class="inline-flex min-h-[44px] items-center justify-center px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-300 text-sm font-medium transition-colors"
            :disabled="uploading || generating"
            @click="clearUploaded"
          >
            Remove upload
          </button>
        </div>

        <p v-if="!productId" class="text-dark-500 text-xs">
          A branded image is created automatically when you save if no photo is uploaded.
        </p>

        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  imageId: number | null
  imageUrl: string | null
  generatedImageUrl?: string | null
  imageSource?: 'uploaded' | 'generated' | 'placeholder' | null
  productId?: number | null
}>()

const emit = defineEmits<{
  'update:imageId': [value: number | null]
  'update:imageUrl': [value: string | null]
  'update:generatedImageUrl': [value: string | null]
  'update:imageSource': [value: 'uploaded' | 'generated' | 'placeholder']
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const generating = ref(false)
const error = ref('')
const localPreview = ref<string | null>(null)
const previewBroken = ref(false)

const previewUrl = computed(() => {
  if (previewBroken.value) return null
  return localPreview.value || props.imageUrl || props.generatedImageUrl || null
})

const sourceLabel = computed(() => {
  if (props.imageId || (props.imageUrl && props.imageSource === 'uploaded')) return 'Uploaded image'
  if (props.generatedImageUrl || props.imageSource === 'generated') return 'Generated image'
  if (previewUrl.value) return 'Generated image'
  return 'Placeholder'
})

const sourceLabelClass = computed(() => {
  if (sourceLabel.value.startsWith('Uploaded')) return 'text-emerald-400'
  if (sourceLabel.value.startsWith('Generated')) return 'text-cyan-400'
  return 'text-dark-500'
})

function onPreviewError() {
  previewBroken.value = true
}

async function onFileChange(event: Event) {
  error.value = ''
  previewBroken.value = false
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
    emit('update:imageSource', 'uploaded')
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

async function generateImage() {
  if (!props.productId) return
  error.value = ''
  generating.value = true
  try {
    const res = await $fetch<{ ok: boolean; generatedImageUrl: string; imageSource: 'uploaded' | 'generated' }>(
      `/api/admin/products/${props.productId}/generate-image`,
      {
        method: 'POST',
        credentials: 'include',
        body: { force: true },
      }
    )
    const url = `${String(res.generatedImageUrl).split('?')[0]}?v=${Date.now()}`
    emit('update:generatedImageUrl', url)
    emit('update:imageSource', res.imageSource)
    previewBroken.value = false
    if (!props.imageId) {
      emit('update:imageUrl', null)
      localPreview.value = url
    }
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Could not generate image.'
  } finally {
    generating.value = false
  }
}

function clearUploaded() {
  error.value = ''
  previewBroken.value = false
  if (localPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localPreview.value)
  }
  localPreview.value = props.generatedImageUrl || null
  emit('update:imageId', null)
  emit('update:imageUrl', null)
  emit('update:imageSource', props.generatedImageUrl ? 'generated' : 'placeholder')
  if (fileInput.value) fileInput.value.value = ''
}

onBeforeUnmount(() => {
  if (localPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localPreview.value)
  }
})
</script>
