<template>
  <div class="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Store Settings</h1>
      <p class="text-dark-400 mt-1 text-sm">Identity, ship-from, policies, and environment status.</p>
    </div>

    <div v-if="loadError" class="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
      {{ loadError }}
    </div>
    <div v-if="error" class="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
      {{ error }}
    </div>
    <div v-if="success" class="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300 text-sm">
      {{ success }}
    </div>
    <p v-if="!persisted && !pending" class="mb-4 text-amber-300/90 text-sm leading-relaxed">
      Settings are using defaults until Strapi is redeployed with the Store Settings type. You can still edit and save after that deploy.
    </p>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 6" :key="i" class="h-16 rounded-xl bg-dark-900 border border-dark-700 animate-pulse" />
    </div>

    <div v-else class="space-y-3 max-w-3xl">
      <section class="rounded-xl border border-dark-700 bg-dark-900 overflow-hidden">
        <button type="button" class="section-toggle" @click="toggle('identity')">
          <span>Store Identity</span>
          <span class="text-dark-500 text-xs">{{ open.identity ? 'Hide' : 'Edit' }}</span>
        </button>
        <div v-if="open.identity" class="section-body">
          <label class="field">
            <span>Store name</span>
            <input v-model="form.storeName" type="text" class="input" autocomplete="organization" />
          </label>
          <label class="field">
            <span>Legal business name</span>
            <input v-model="form.legalBusinessName" type="text" class="input" />
          </label>
          <label class="field">
            <span>DBA name</span>
            <input v-model="form.dbaName" type="text" class="input" />
          </label>
          <label class="field">
            <span>Website URL</span>
            <input v-model="form.websiteUrl" type="url" class="input" inputmode="url" placeholder="https://quantumbiopeptides.com" />
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="field">
              <span>Address line 1</span>
              <input v-model="form.businessAddressLine1" type="text" class="input" />
            </label>
            <label class="field">
              <span>Address line 2</span>
              <input v-model="form.businessAddressLine2" type="text" class="input" />
            </label>
            <label class="field">
              <span>City</span>
              <input v-model="form.businessCity" type="text" class="input" />
            </label>
            <label class="field sm:col-span-1">
              <span>State</span>
              <input v-model="form.businessState" type="text" class="input" />
            </label>
            <label class="field">
              <span>Postal code</span>
              <input v-model="form.businessPostalCode" type="text" class="input" inputmode="numeric" />
            </label>
            <label class="field">
              <span>Country</span>
              <input v-model="form.businessCountry" type="text" class="input" />
            </label>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-dark-700 bg-dark-900 overflow-hidden">
        <button type="button" class="section-toggle" @click="toggle('support')">
          <span>Support Contact</span>
          <span class="text-dark-500 text-xs">{{ open.support ? 'Hide' : 'Edit' }}</span>
        </button>
        <div v-if="open.support" class="section-body">
          <label class="field">
            <span>Support email</span>
            <input v-model="form.supportEmail" type="email" class="input" inputmode="email" autocomplete="email" />
          </label>
          <label class="field">
            <span>Support phone</span>
            <input v-model="form.supportPhone" type="tel" class="input" inputmode="tel" autocomplete="tel" />
          </label>
          <label class="field">
            <span>Order support message</span>
            <textarea v-model="form.orderSupportMessage" rows="3" class="input resize-none" placeholder="Shown on confirmation and contact pages when useful." />
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-dark-700 bg-dark-900 overflow-hidden">
        <button type="button" class="section-toggle" @click="toggle('shipFrom')">
          <span>Ship-From Address</span>
          <span class="text-dark-500 text-xs">{{ status?.shipFromSource === 'env' ? 'Env override' : open.shipFrom ? 'Hide' : 'Edit' }}</span>
        </button>
        <div v-if="open.shipFrom" class="section-body">
          <p class="text-dark-400 text-xs leading-relaxed">
            Used when shipping env vars are not set. Existing SHIPPING_FROM_* env values still win.
          </p>
          <label class="field">
            <span>Name</span>
            <input v-model="form.shipFromName" type="text" class="input" />
          </label>
          <label class="field">
            <span>Company</span>
            <input v-model="form.shipFromCompany" type="text" class="input" />
          </label>
          <label class="field">
            <span>Address line 1</span>
            <input v-model="form.shipFromAddressLine1" type="text" class="input" />
          </label>
          <label class="field">
            <span>Address line 2</span>
            <input v-model="form.shipFromAddressLine2" type="text" class="input" />
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="field col-span-2 sm:col-span-1">
              <span>City</span>
              <input v-model="form.shipFromCity" type="text" class="input" />
            </label>
            <label class="field">
              <span>State</span>
              <input v-model="form.shipFromState" type="text" class="input" />
            </label>
            <label class="field">
              <span>Postal code</span>
              <input v-model="form.shipFromPostalCode" type="text" class="input" inputmode="numeric" />
            </label>
            <label class="field">
              <span>Country</span>
              <input v-model="form.shipFromCountry" type="text" class="input" />
            </label>
          </div>
          <label class="field">
            <span>Phone</span>
            <input v-model="form.shipFromPhone" type="tel" class="input" inputmode="tel" />
          </label>
          <label class="field">
            <span>Email</span>
            <input v-model="form.shipFromEmail" type="email" class="input" inputmode="email" />
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-dark-700 bg-dark-900 overflow-hidden">
        <button type="button" class="section-toggle" @click="toggle('parcel')">
          <span>Shipping Defaults</span>
          <span class="text-dark-500 text-xs">{{ open.parcel ? 'Hide' : 'Edit' }}</span>
        </button>
        <div v-if="open.parcel" class="section-body">
          <div class="grid grid-cols-2 gap-3">
            <label class="field">
              <span>Length (in)</span>
              <input v-model="form.defaultPackageLengthIn" type="number" min="0" step="0.1" class="input" inputmode="decimal" />
            </label>
            <label class="field">
              <span>Width (in)</span>
              <input v-model="form.defaultPackageWidthIn" type="number" min="0" step="0.1" class="input" inputmode="decimal" />
            </label>
            <label class="field">
              <span>Height (in)</span>
              <input v-model="form.defaultPackageHeightIn" type="number" min="0" step="0.1" class="input" inputmode="decimal" />
            </label>
            <label class="field">
              <span>Weight (oz)</span>
              <input v-model="form.defaultPackageWeightOz" type="number" min="0" step="0.1" class="input" inputmode="decimal" />
            </label>
          </div>
          <label class="flex items-center gap-3 min-h-[48px]">
            <input v-model="form.freeShippingEnabled" type="checkbox" class="h-5 w-5 rounded border-dark-500 bg-dark-800 text-cyan-500" />
            <span class="text-sm text-dark-200">Free shipping enabled (display/setting only; checkout rates are unchanged)</span>
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-dark-700 bg-dark-900 overflow-hidden">
        <button type="button" class="section-toggle" @click="toggle('carriers')">
          <span>Carrier Settings</span>
          <span class="text-dark-500 text-xs">{{ status?.allowedCarriersSource === 'env' ? 'Env override' : open.carriers ? 'Hide' : 'Edit' }}</span>
        </button>
        <div v-if="open.carriers" class="section-body">
          <p class="text-dark-400 text-xs leading-relaxed">
            Comma-separated, for example <span class="font-mono text-dark-300">USPS,UPS</span>.
            SHIPPO_ALLOWED_CARRIERS env overrides this when set.
          </p>
          <label class="field">
            <span>Allowed carriers</span>
            <input v-model="form.allowedCarriers" type="text" class="input" placeholder="USPS" />
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-dark-700 bg-dark-900 overflow-hidden">
        <button type="button" class="section-toggle" @click="toggle('legal')">
          <span>Legal Pages / Policies</span>
          <span class="text-dark-500 text-xs">{{ open.legal ? 'Hide' : 'Edit' }}</span>
        </button>
        <div v-if="open.legal" class="section-body">
          <p class="text-dark-400 text-xs leading-relaxed">
            Leave a field blank to use starter copy on the public page. Have a qualified attorney review before live launch.
          </p>
          <label class="field">
            <span>Terms of Service</span>
            <textarea v-model="form.termsOfService" rows="8" class="input min-h-[8rem]" />
          </label>
          <label class="field">
            <span>Privacy Policy</span>
            <textarea v-model="form.privacyPolicy" rows="8" class="input min-h-[8rem]" />
          </label>
          <label class="field">
            <span>Shipping Policy</span>
            <textarea v-model="form.shippingPolicy" rows="8" class="input min-h-[8rem]" />
          </label>
          <label class="field">
            <span>Refund / Replacement Policy</span>
            <textarea v-model="form.refundPolicy" rows="8" class="input min-h-[8rem]" />
          </label>
          <label class="field">
            <span>Research Use Only</span>
            <textarea v-model="form.researchUseOnlyPolicy" rows="8" class="input min-h-[8rem]" />
          </label>
          <label class="field">
            <span>Contact page copy</span>
            <textarea v-model="form.contactPolicy" rows="6" class="input min-h-[6rem]" />
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-dark-700 bg-dark-900 overflow-hidden">
        <button type="button" class="section-toggle" @click="toggle('footer')">
          <span>Public Footer / Disclaimer</span>
          <span class="text-dark-500 text-xs">{{ open.footer ? 'Hide' : 'Edit' }}</span>
        </button>
        <div v-if="open.footer" class="section-body">
          <label class="field">
            <span>Footer disclaimer</span>
            <textarea v-model="form.footerDisclaimer" rows="3" class="input resize-none" />
          </label>
          <label class="field">
            <span>Short research-use disclaimer</span>
            <textarea v-model="form.researchUseOnlyShortDisclaimer" rows="3" class="input resize-none" />
          </label>
          <label class="flex items-center gap-3 min-h-[48px]">
            <input v-model="form.announcementBannerEnabled" type="checkbox" class="h-5 w-5 rounded border-dark-500 bg-dark-800 text-cyan-500" />
            <span class="text-sm text-dark-200">Show announcement banner</span>
          </label>
          <label class="field">
            <span>Announcement banner</span>
            <input v-model="form.announcementBanner" type="text" class="input" />
          </label>
          <label class="field">
            <span>Instagram URL</span>
            <input v-model="form.socialLinks.instagram" type="url" class="input" inputmode="url" />
          </label>
          <label class="field">
            <span>X / Twitter URL</span>
            <input v-model="form.socialLinks.twitter" type="url" class="input" inputmode="url" />
          </label>
          <label class="field">
            <span>Facebook URL</span>
            <input v-model="form.socialLinks.facebook" type="url" class="input" inputmode="url" />
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-dark-700 bg-dark-900 overflow-hidden">
        <button type="button" class="section-toggle" @click="toggle('status')">
          <span>Test / Live Status</span>
          <span class="text-dark-500 text-xs">{{ open.status ? 'Hide' : 'View' }}</span>
        </button>
        <div v-if="open.status && status" class="section-body text-sm">
          <div class="status-row"><span>Moov</span><span>{{ status.moovMode }}</span></div>
          <div class="status-row"><span>Shippo</span><span>{{ status.shippoMode }}</span></div>
          <div class="status-row"><span>Allowed carriers</span><span>{{ (status.allowedCarriers || []).join(', ') || '—' }}</span></div>
          <div class="status-row"><span>Carrier source</span><span>{{ status.allowedCarriersSource }}</span></div>
          <div class="status-row"><span>Support email</span><span>{{ status.supportEmailConfigured ? 'Configured' : 'Missing' }}</span></div>
          <div class="status-row"><span>Ship-from</span><span>{{ status.shipFromConfigured ? status.shipFromSource : 'Incomplete' }}</span></div>
          <div class="status-row"><span>SMTP</span><span>{{ status.smtpConfigured ? 'Configured' : 'Missing' }}</span></div>
          <div class="status-row"><span>Custom policies</span><span>{{ status.policies?.all ? 'All filled' : 'Using some starter copy' }}</span></div>
        </div>
      </section>

      <div class="hidden lg:flex gap-3 pt-2">
        <button type="button" class="min-h-[48px] px-6 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold" :disabled="saving" @click="saveSettings">
          {{ saving ? 'Saving…' : 'Save settings' }}
        </button>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-5">
        <h2 class="text-lg font-semibold text-white mb-2">Owner push notifications</h2>
        <p class="text-dark-400 text-sm mb-4 leading-relaxed">
          Get a phone alert when an order is paid, a payment fails, or stock runs low. Best on the installed QBP Owner app.
        </p>
        <p v-if="push.permission.value === 'unsupported'" class="text-amber-400 text-sm mb-3">This browser does not support web push.</p>
        <p v-else-if="!push.configured.value" class="text-amber-400 text-sm mb-3">Push is not configured on the server yet. Set VAPID keys, then deploy.</p>
        <p v-else-if="push.subscribed.value" class="text-emerald-400 text-sm mb-3">Notifications are on for this device.</p>
        <p v-else class="text-dark-400 text-sm mb-3">Notifications are off on this device.</p>
        <p v-if="push.error.value" class="text-red-400 text-sm mb-3">{{ push.error.value }}</p>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="!push.subscribed.value"
            type="button"
            :disabled="push.busy.value || !push.configured.value"
            class="min-h-[44px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-semibold"
            @click="push.enable()"
          >
            {{ push.busy.value ? 'Enabling…' : 'Enable notifications' }}
          </button>
          <button
            v-else
            type="button"
            :disabled="push.busy.value"
            class="min-h-[44px] px-4 rounded-xl bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium"
            @click="push.disable()"
          >
            Turn off
          </button>
          <button
            v-if="push.subscribed.value"
            type="button"
            :disabled="push.busy.value"
            class="min-h-[44px] px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white text-sm font-medium"
            @click="push.sendTest()"
          >
            Send test
          </button>
        </div>
      </div>

      <div class="bg-dark-900 rounded-xl border border-red-500/25 p-5">
        <h2 class="text-lg font-semibold text-white mb-2">Danger zone</h2>
        <p class="text-dark-400 text-sm mb-4">Clear all test/live orders from the admin. Products and stock are not changed.</p>
        <NuxtLink
          to="/admin/orders"
          class="inline-flex min-h-[48px] items-center px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-semibold text-sm"
        >
          Go to Clear all orders
        </NuxtLink>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 min-h-[48px] px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl"
        @click="logout"
      >
        Logout
      </button>
    </div>

    <div class="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-dark-950/95 backdrop-blur-xl px-4 pt-3 pb-[max(4.75rem,calc(env(safe-area-inset-bottom)+3.5rem))]">
      <button
        type="button"
        class="w-full min-h-[52px] rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold"
        :disabled="saving || pending"
        @click="saveSettings"
      >
        {{ saving ? 'Saving…' : 'Save settings' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdmin } from '~/composables/useAdmin'
import { DEFAULT_STORE_SETTINGS, type StoreSettings, type StoreSocialLinks } from '~/utils/storeSettings'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { logout: adminLogout } = useAdmin()
const push = useOwnerPush()

const pending = ref(true)
const saving = ref(false)
const loadError = ref('')
const error = ref('')
const success = ref('')
const persisted = ref(false)
const status = ref<any>(null)
const form = reactive<StoreSettings>({
  ...DEFAULT_STORE_SETTINGS,
  socialLinks: {},
})

const open = reactive({
  identity: true,
  support: false,
  shipFrom: false,
  parcel: false,
  carriers: false,
  legal: false,
  footer: false,
  status: true,
})

function toggle(key: keyof typeof open) {
  open[key] = !open[key]
}

function applySettings(next: StoreSettings) {
  Object.assign(form, next)
  form.socialLinks = { ...(next.socialLinks || {}) } as StoreSocialLinks
}

async function loadSettings() {
  pending.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ settings: StoreSettings; persisted: boolean; status: any }>('/api/admin/settings', {
      credentials: 'include',
    })
    applySettings(res.settings)
    persisted.value = res.persisted
    status.value = res.status
  } catch (err: any) {
    loadError.value = err.data?.message || err.message || 'Could not load settings.'
    applySettings(DEFAULT_STORE_SETTINGS)
  } finally {
    pending.value = false
  }
}

const saveSettings = async () => {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    const res = await $fetch<{ ok: boolean; settings: StoreSettings }>('/api/admin/settings', {
      method: 'PUT',
      credentials: 'include',
      body: { ...form, socialLinks: { ...form.socialLinks } },
    })
    applySettings(res.settings)
    persisted.value = true
    success.value = 'Settings saved.'
    await loadSettings()
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to save settings.'
  } finally {
    saving.value = false
  }
}

const logout = () => {
  adminLogout()
}

onMounted(() => {
  void loadSettings()
  void push.refresh()
})

useHead({ title: 'Store Settings' })
</script>

<style scoped>
.section-toggle {
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  color: #fff;
  font-weight: 600;
  text-align: left;
}
.section-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 1rem 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field span {
  font-size: 0.75rem;
  color: #9ca3af;
}
.input {
  width: 100%;
  min-height: 48px;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: #0f172a;
  border: 1px solid #334155;
  color: #fff;
  font-size: 16px;
}
.input:focus {
  outline: none;
  border-color: #06b6d4;
}
.status-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #1f2937;
  color: #d1d5db;
}
.status-row span:last-child {
  color: #fff;
  text-align: right;
  text-transform: capitalize;
}
</style>
