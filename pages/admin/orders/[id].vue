<template>
  <div class="pt-2 pb-8">
    <div class="mx-auto w-full max-w-4xl mb-5">
      <NuxtLink
        to="/admin/orders"
        class="inline-flex items-center min-h-[44px] text-dark-400 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Orders
      </NuxtLink>
    </div>

    <div
      v-if="actionToast"
      class="mx-auto w-full max-w-4xl mb-4 rounded-xl px-4 py-3 text-sm"
      :class="actionToast.type === 'success'
        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
        : 'bg-red-500/10 border border-red-500/30 text-red-400'"
    >
      {{ actionToast.message }}
    </div>

    <div v-if="pending" class="mx-auto w-full max-w-4xl space-y-6">
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-dark-800 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="error || !order" class="mx-auto w-full max-w-4xl bg-dark-900 rounded-xl border border-dark-700 p-12 text-center">
      <h2 class="text-xl font-semibold text-white mb-2">{{ error || 'Order Not Found' }}</h2>
      <NuxtLink to="/admin/orders" class="text-cyan-400 text-sm">Back to Orders</NuxtLink>
    </div>

    <div v-else class="mx-auto w-full max-w-4xl space-y-5">
      <!-- Status command header -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <p class="font-mono text-lg sm:text-2xl font-bold text-white break-all">
          {{ order.orderNumber || `Order #${orderId}` }}
        </p>
        <p class="mt-1 text-cyan-300 font-semibold">{{ headline }}</p>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span :class="paymentBadgeClass(order.paymentStatus, order)">{{ paymentLabel(order.paymentStatus, order) }}</span>
          <span :class="badgeClass(fulfillmentBadge(order).kind)">{{ fulfillmentBadge(order).label }}</span>
        </div>
        <div class="mt-4 flex items-end justify-between gap-3">
          <div class="min-w-0">
            <p class="text-white font-medium truncate">{{ order.customerName || '—' }}</p>
            <p class="text-dark-400 text-sm truncate">{{ order.email }}</p>
          </div>
          <p class="text-xl font-bold text-white shrink-0">{{ formatCents(order.totalCents) }}</p>
        </div>
        <p class="text-sm mt-4" :class="fulfillmentHintClass">{{ fulfillmentHint }}</p>
      </div>

      <!-- Manual Cash App verification -->
      <div
        v-if="showCashAppVerification"
        class="bg-dark-900 rounded-xl border border-amber-500/30 p-4 sm:p-6"
      >
        <h2 class="text-lg font-semibold text-white mb-1">Manual Cash App verification</h2>
        <p class="text-dark-400 text-sm mb-4">Confirm the Cash App payment before buying a label.</p>

        <dl class="space-y-2 text-sm mb-4">
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Order number</dt>
            <dd class="text-white font-mono text-right break-all">{{ order.orderNumber || `#${order.id}` }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Amount due</dt>
            <dd class="text-white font-semibold">{{ formatCents(order.totalCents) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Customer</dt>
            <dd class="text-white text-right">
              {{ order.customerName || '—' }}
              <span v-if="order.email" class="block text-dark-400 text-xs break-all">{{ order.email }}</span>
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Payment status</dt>
            <dd class="text-white text-right">{{ paymentLabel(order.paymentStatus, order) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Claimed sender</dt>
            <dd class="text-white text-right">{{ order.manualPaymentClaimedSenderName || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Cash App handle</dt>
            <dd class="text-white text-right">{{ order.manualPaymentClaimedHandle || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Customer note</dt>
            <dd class="text-white text-right break-words">{{ order.manualPaymentClaimedNote || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Claimed at</dt>
            <dd class="text-white text-right">{{ order.manualPaymentClaimedAt ? formatDate(order.manualPaymentClaimedAt) : 'Not claimed yet' }}</dd>
          </div>
          <div v-if="order.manualPaymentExpiresAt" class="flex justify-between gap-3">
            <dt class="text-dark-500">Expires</dt>
            <dd class="text-white text-right">{{ formatDate(order.manualPaymentExpiresAt) }}</dd>
          </div>
          <div v-if="order.manualPaymentRejectionReason" class="flex justify-between gap-3">
            <dt class="text-dark-500">Last rejection</dt>
            <dd class="text-amber-300 text-right break-words">{{ order.manualPaymentRejectionReason }}</dd>
          </div>
        </dl>

        <div v-if="hasInsufficientStock" class="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Stock warning: one or more items have less inventory than ordered.
        </div>

        <div v-if="order.items?.length" class="mb-4 rounded-lg border border-dark-700 overflow-hidden">
          <div
            v-for="item in order.items"
            :key="'stock-' + item.id"
            class="flex items-center justify-between gap-3 px-3 py-2 text-sm border-b border-dark-700 last:border-0"
          >
            <div class="min-w-0">
              <p class="text-white truncate">{{ item.productName }} · {{ item.variantName }}</p>
              <p class="text-dark-400 text-xs">Ordered {{ item.quantity }}</p>
            </div>
            <p :class="item.insufficient ? 'text-amber-300 font-medium' : 'text-dark-300'">
              Stock {{ item.currentStock == null ? '—' : item.currentStock }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-xl"
            @click="copyText(order.orderNumber || String(order.id), 'Order number')"
          >
            Copy Order Number
          </button>
          <button
            type="button"
            class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-xl"
            @click="copyText(formatCents(order.totalCents).replace('$', ''), 'Amount')"
          >
            Copy Amount
          </button>
          <button
            v-if="order.email"
            type="button"
            class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-xl"
            @click="copyText(order.email, 'Customer email')"
          >
            Copy Customer Email
          </button>
          <a
            href="https://cash.app"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-[48px] items-center justify-center px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-xl"
          >
            Open Cash App
          </a>
          <button
            type="button"
            class="min-h-[48px] px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading || !online"
            @click="markPaymentReceived(false)"
          >
            {{ actionLoading === 'payment' ? 'Marking…' : 'Mark Payment Received' }}
          </button>
          <button
            type="button"
            class="min-h-[48px] px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 disabled:opacity-50 text-red-300 text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading || !online"
            @click="askRejectPayment"
          >
            Reject / Request Correction
          </button>
        </div>
      </div>

      <!-- Fulfillment choice: Shippo vs manual -->
      <div v-if="showFulfillmentChoice" class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <h2 class="text-lg font-semibold text-white mb-1">Fulfillment</h2>
        <p class="text-dark-400 text-sm mb-4">Choose how you want to ship this paid order.</p>

        <p
          v-if="order.labelErrorMessage && order.shippingStatus === 'label_failed'"
          class="mb-4 text-sm text-red-400 break-words"
        >
          {{ order.labelErrorMessage }}
        </p>

        <div
          v-if="labelActionError"
          class="mb-4 rounded-lg px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-300 space-y-2"
        >
          <p class="font-medium">Could not buy label: {{ labelActionError.message }}</p>
          <p v-if="labelActionError.step" class="text-red-400/80 text-xs">Step: {{ labelActionError.step }}</p>
          <p v-if="labelActionError.detail" class="text-red-400/70 text-xs break-words">{{ labelActionError.detail }}</p>
          <button
            type="button"
            class="min-h-[44px] px-3 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm"
            @click="copyText(labelActionError.message + (labelActionError.detail ? `\n${labelActionError.detail}` : ''), 'Error')"
          >
            Copy error
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="rounded-xl border border-dark-700 bg-dark-950/40 p-4 flex flex-col">
            <h3 class="text-white font-semibold mb-1">Buy label with Shippo</h3>
            <p class="text-dark-400 text-sm mb-3 flex-1">
              Purchase a shipping label inside the app using the selected shipping rate. The label and tracking will be saved to this order.
            </p>
            <p
              v-if="!canBuyLabel && buyLabelBlockedReason"
              class="mb-3 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2"
            >
              Unavailable: {{ buyLabelBlockedReason }}
            </p>
            <button
              type="button"
              class="min-h-[48px] px-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              :disabled="!!actionLoading || !online || !canBuyLabel"
              @click="askBuyLabel"
            >
              {{ buyLabelButtonLabel }}
            </button>
          </div>

          <div class="rounded-xl border border-dark-700 bg-dark-950/40 p-4 flex flex-col">
            <h3 class="text-white font-semibold mb-1">Add manual tracking</h3>
            <p class="text-dark-400 text-sm mb-3 flex-1">
              Already bought a label at USPS/UPS or want to buy one outside the app? Enter the tracking number here and continue fulfillment from the app.
            </p>
            <button
              type="button"
              class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              :disabled="!!actionLoading || !online"
              @click="askManualTracking"
            >
              Add Manual Tracking
            </button>
          </div>
        </div>
      </div>

      <!-- Label purchasing in progress -->
      <div
        v-else-if="order.shippingStatus === 'label_purchasing'"
        class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6"
      >
        <h2 class="text-lg font-semibold text-white mb-2">Generating label</h2>
        <p class="text-dark-400 text-sm mb-4">Shippo is creating the label. Refresh in a moment.</p>
        <button
          type="button"
          class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-semibold rounded-xl"
          :disabled="!!actionLoading"
          @click="refreshLabelStatus"
        >
          {{ actionLoading === 'buy' ? 'Checking…' : 'Refresh Order' }}
        </button>
      </div>

      <!-- Tracking / fulfillment card -->
      <div v-if="showTrackingFulfillmentCard" class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <h2 class="text-lg font-semibold text-white mb-3">Tracking &amp; fulfillment</h2>

        <p
          v-if="isManualFulfillment"
          class="mb-4 text-sm text-dark-300 bg-dark-800/60 border border-dark-700 rounded-lg px-3 py-2"
        >
          Manual tracking was added. No app-generated label PDF is available for this order.
        </p>

        <dl class="space-y-2 text-sm mb-4">
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Fulfillment method</dt>
            <dd class="text-white text-right">{{ fulfillmentMethodLabel }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Status</dt>
            <dd class="text-white text-right">{{ shippingLabel(order.shippingStatus) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Carrier</dt>
            <dd class="text-white text-right">{{ order.shippingCarrier || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Service</dt>
            <dd class="text-white text-right">{{ order.shippingService || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Tracking #</dt>
            <dd class="text-white font-mono text-xs text-right break-all">{{ order.trackingNumber || '—' }}</dd>
          </div>
          <div v-if="order.trackingUrl" class="flex justify-between gap-3">
            <dt class="text-dark-500">Tracking URL</dt>
            <dd class="text-cyan-300 text-xs text-right break-all">
              <a :href="order.trackingUrl" target="_blank" rel="noopener noreferrer" class="hover:underline">
                {{ order.trackingUrl }}
              </a>
            </dd>
          </div>
          <div v-if="order.shippingLabelUrl" class="flex justify-between gap-3">
            <dt class="text-dark-500">Label URL</dt>
            <dd class="text-cyan-300 text-xs text-right break-all">
              <a :href="order.shippingLabelUrl" target="_blank" rel="noopener noreferrer" class="hover:underline">
                Open label PDF
              </a>
            </dd>
          </div>
          <div v-if="order.labelPurchasedAt" class="flex justify-between gap-3">
            <dt class="text-dark-500">Label purchased</dt>
            <dd class="text-white text-right">{{ formatDate(order.labelPurchasedAt) }}</dd>
          </div>
          <div v-if="order.manualTrackingAddedAt" class="flex justify-between gap-3">
            <dt class="text-dark-500">Manual tracking added</dt>
            <dd class="text-white text-right">{{ formatDate(order.manualTrackingAddedAt) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Label cost</dt>
            <dd class="text-white">{{ order.labelCostCents != null ? formatCents(order.labelCostCents) : '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Customer paid shipping</dt>
            <dd class="text-white">{{ formatCents(order.shippingCostCents) }}</dd>
          </div>
          <div v-if="labelDifference != null" class="flex justify-between gap-3">
            <dt class="text-dark-500">Difference</dt>
            <dd class="text-white">{{ formatCents(labelDifference) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Shipped</dt>
            <dd class="text-white text-right">{{ order.shippedAt ? formatDate(order.shippedAt) : 'Not marked yet' }}</dd>
          </div>
          <div>
            <dt class="text-dark-500">Tracking email</dt>
            <dd class="text-white mt-1">
              {{ order.trackingEmailSentAt ? `Tracking email sent on ${formatDate(order.trackingEmailSentAt)}` : 'Tracking email not sent yet' }}
            </dd>
          </div>
        </dl>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            v-if="order.shippingLabelUrl"
            type="button"
            class="min-h-[48px] px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl"
            @click="openLabel"
          >
            Open Label
          </button>
          <button
            v-if="order.shippingLabelUrl"
            type="button"
            class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-semibold rounded-xl"
            @click="shareLabel"
          >
            Share Label
          </button>
          <button
            v-if="order.shippingLabelUrl"
            type="button"
            class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-xl"
            @click="copyText(order.shippingLabelUrl, 'Label link')"
          >
            Copy Label Link
          </button>
          <button
            v-if="order.trackingNumber"
            type="button"
            class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-xl"
            @click="copyText(order.trackingNumber, 'Tracking number')"
          >
            Copy Tracking Number
          </button>
          <a
            v-if="order.trackingUrl"
            :href="order.trackingUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-[48px] items-center justify-center px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-xl"
          >
            Open Tracking
          </a>
          <button
            v-if="canEmailTracking"
            type="button"
            class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading || !online"
            @click="emailTracking"
          >
            {{ emailTrackingLabel }}
          </button>
          <button
            v-if="canMarkShipped"
            type="button"
            class="min-h-[48px] px-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading || !online"
            @click="askMarkShipped"
          >
            {{ actionLoading === 'ship' ? 'Saving…' : 'Mark as Shipped' }}
          </button>
        </div>
      </div>

      <!-- Print helper (Shippo label only) -->
      <div
        v-if="order.shippingLabelUrl && order.shippingStatus !== 'shipped' && order.shippingStatus !== 'delivered'"
        class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6"
      >
        <h2 class="text-base font-semibold text-white mb-2">Need to print from your phone?</h2>
        <p class="text-dark-300 text-sm mb-3">
          Open or share the label PDF from your phone. You can print it at UPS Store, Staples, a local print shop, or any printer connected to your phone.
        </p>
        <ol class="text-sm text-dark-300 space-y-1 list-decimal list-inside">
          <li>Open Label</li>
          <li>Share or download the PDF</li>
          <li>Print the PDF</li>
          <li>Attach the label to the package</li>
          <li>Tap Mark as Shipped</li>
        </ol>
      </div>

      <!-- How to fulfill -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <button
          type="button"
          class="w-full flex items-center justify-between min-h-[44px] text-left"
          @click="guideOpen = !guideOpen"
        >
          <span class="text-white font-semibold">How to fulfill this order</span>
          <span class="text-dark-400 text-sm">{{ guideOpen ? 'Hide' : 'Show' }}</span>
        </button>
        <ol v-if="guideOpen" class="mt-3 text-sm text-dark-300 space-y-1.5 list-decimal list-inside">
          <template v-if="order.shippingStatus === 'label_purchased'">
            <li>Open or share the label.</li>
            <li>Print it.</li>
            <li>Attach to package.</li>
            <li>Email tracking if not sent.</li>
            <li>Mark as shipped.</li>
          </template>
          <template v-else-if="order.shippingStatus === 'manual_tracking_added' || isManualFulfillment">
            <li>Attach your outside label to the package.</li>
            <li>Email tracking to the customer.</li>
            <li>Mark as shipped.</li>
          </template>
          <template v-else-if="order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered' || order.shippingStatus === 'in_transit'">
            <li>Open tracking if a customer asks.</li>
            <li>Re-send the tracking email if needed.</li>
          </template>
          <template v-else>
            <li>Pack the products.</li>
            <li>Buy a Shippo label, or add manual tracking from an outside label.</li>
            <li>Email tracking.</li>
            <li>Mark as shipped.</li>
          </template>
        </ol>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Customer</h2>
          <div class="space-y-3 text-sm">
            <div>
              <p class="text-dark-400">Name</p>
              <p class="text-white">{{ order.customerName || '—' }}</p>
            </div>
            <div>
              <p class="text-dark-400">Email</p>
              <p class="text-white break-all">{{ order.email || '—' }}</p>
            </div>
            <div>
              <p class="text-dark-400">Phone</p>
              <p class="text-white">{{ order.phone || '—' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Shipping Address</h2>
          <div class="text-white text-sm space-y-1 mb-4">
            <p>{{ order.shippingName || order.customerName }}</p>
            <p>{{ order.shippingAddressLine1 || '—' }}</p>
            <p v-if="order.shippingAddressLine2">{{ order.shippingAddressLine2 }}</p>
            <p>
              {{ order.shippingCity }}{{ order.shippingCity && order.shippingState ? ', ' : '' }}{{ order.shippingState }}
              {{ order.shippingPostalCode }}
            </p>
            <p>{{ order.shippingCountry || 'US' }}</p>
          </div>
          <button
            type="button"
            class="min-h-[44px] w-full sm:w-auto px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-xl"
            @click="copyShippingAddress"
          >
            Copy Shipping Address
          </button>
        </div>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Items</h2>
        <div class="divide-y divide-dark-700">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4"
          >
            <div>
              <p class="text-white font-medium">{{ item.productName }}</p>
              <p class="text-dark-400 text-sm">
                {{ item.variantName }}
                <span v-if="item.sku"> · SKU {{ item.sku }}</span>
              </p>
              <p
                v-if="item.currentStock != null"
                class="text-xs mt-1"
                :class="item.insufficient ? 'text-amber-300' : 'text-dark-500'"
              >
                Stock {{ item.currentStock }}{{ item.insufficient ? ' · insufficient' : '' }}
              </p>
            </div>
            <div class="text-right text-sm">
              <p class="text-white">${{ Number(item.unitPrice).toFixed(2) }} × {{ item.quantity }}</p>
              <p class="text-dark-400">${{ (Number(item.unitPrice) * item.quantity).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div class="border-t border-dark-700 mt-4 pt-4 space-y-2 text-sm">
          <div class="flex justify-between text-dark-300">
            <span>Subtotal</span>
            <span>{{ formatCents(order.subtotalCents) }}</span>
          </div>
          <div class="flex justify-between text-dark-300">
            <span>Shipping (customer paid)</span>
            <span>{{ formatCents(order.shippingCostCents) }}</span>
          </div>
          <div class="flex justify-between text-dark-300">
            <span>Tax</span>
            <span>{{ formatCents(order.taxCents) }}</span>
          </div>
          <div class="flex justify-between text-white font-semibold text-lg pt-2">
            <span>Total</span>
            <span>{{ formatCents(order.totalCents) }}</span>
          </div>
        </div>
      </div>

      <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Payment</h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="flex justify-between sm:block gap-3">
            <dt class="text-dark-500">Payment status</dt>
            <dd class="text-white">{{ order.paymentStatus || '—' }}</dd>
          </div>
          <div class="flex justify-between sm:block gap-3">
            <dt class="text-dark-500">Order status</dt>
            <dd class="text-white">{{ order.status || '—' }}</dd>
          </div>
          <div class="flex justify-between sm:block gap-3">
            <dt class="text-dark-500">Provider</dt>
            <dd class="text-white">{{ order.paymentProvider || '—' }}</dd>
          </div>
          <div class="flex justify-between sm:block gap-3">
            <dt class="text-dark-500">Method</dt>
            <dd class="text-white">{{ order.paymentMethod || '—' }}</dd>
          </div>
          <div class="flex justify-between sm:block gap-3 sm:col-span-2">
            <dt class="text-dark-500">Moov transfer</dt>
            <dd class="text-white font-mono text-xs break-all">{{ order.moovTransferId || '—' }}</dd>
          </div>
          <div class="flex justify-between sm:block gap-3">
            <dt class="text-dark-500">Paid at</dt>
            <dd class="text-white">{{ order.paidAt ? formatDate(order.paidAt) : '—' }}</dd>
          </div>
          <div class="flex justify-between sm:block gap-3">
            <dt class="text-dark-500">Receipt emailed</dt>
            <dd class="text-white">{{ order.paidReceiptSentAt ? formatDate(order.paidReceiptSentAt) : '—' }}</dd>
          </div>
          <div class="flex justify-between sm:block gap-3">
            <dt class="text-dark-500">Inventory committed</dt>
            <dd class="text-white">{{ order.inventoryCommitted ? 'Yes' : 'No' }}</dd>
          </div>
          <div v-if="order.manualPaymentClaimedAt" class="flex justify-between sm:block gap-3">
            <dt class="text-dark-500">Claimed at</dt>
            <dd class="text-white">{{ formatDate(order.manualPaymentClaimedAt) }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Mobile sticky actions -->
    <div
      v-if="order && stickyPrimary"
      class="lg:hidden fixed inset-x-0 bottom-0 z-20 border-t border-dark-700 bg-dark-900/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div class="flex gap-2">
        <template v-if="stickyPrimary === 'verify'">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-emerald-500 text-white font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online"
            @click="markPaymentReceived(false)"
          >
            {{ actionLoading === 'payment' ? 'Marking…' : 'Mark Received' }}
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online"
            @click="askRejectPayment"
          >
            Reject
          </button>
        </template>
        <button
          v-else-if="stickyPrimary === 'buy'"
          type="button"
          class="flex-1 min-h-[48px] rounded-xl bg-cyan-500 text-white font-semibold disabled:opacity-50"
          :disabled="!!actionLoading || !online"
          @click="askBuyLabel"
        >
          {{ buyLabelButtonLabel }}
        </button>
        <button
          v-else-if="stickyPrimary === 'refresh'"
          type="button"
          class="flex-1 min-h-[48px] rounded-xl bg-dark-700 text-white font-semibold"
          :disabled="!!actionLoading"
          @click="refreshLabelStatus"
        >
          Refresh Order
        </button>
        <template v-else-if="stickyPrimary === 'label'">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-emerald-500 text-white font-semibold"
            @click="openLabel"
          >
            Open Label
          </button>
          <button
            v-if="canMarkShipped"
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-primary-500 text-white font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online"
            @click="askMarkShipped"
          >
            Mark Shipped
          </button>
        </template>
        <template v-else-if="stickyPrimary === 'tracking'">
          <a
            v-if="order.trackingUrl"
            :href="order.trackingUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-dark-700 text-white font-semibold"
          >
            Open Tracking
          </a>
          <button
            v-else-if="order.trackingNumber"
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-dark-700 text-white font-semibold"
            @click="copyText(order.trackingNumber, 'Tracking number')"
          >
            Copy Tracking
          </button>
          <button
            v-if="canMarkShipped"
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-primary-500 text-white font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online"
            @click="askMarkShipped"
          >
            Mark Shipped
          </button>
        </template>
      </div>
    </div>

    <!-- Buy label confirm -->
    <div
      v-if="buyConfirm"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4"
      @click.self="buyConfirm = false"
    >
      <div class="w-full sm:max-w-md bg-dark-900 border border-dark-700 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 class="text-lg font-semibold text-white mb-2">Buy shipping label?</h3>
        <dl class="text-sm space-y-2 mb-5">
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Order</dt>
            <dd class="text-white font-mono text-right break-all">{{ order?.orderNumber || `#${orderId}` }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Customer</dt>
            <dd class="text-white text-right">{{ order?.customerName || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Ship to</dt>
            <dd class="text-white text-right text-xs leading-relaxed">
              <p>{{ order?.shippingName || order?.customerName }}</p>
              <p>{{ order?.shippingAddressLine1 }}</p>
              <p v-if="order?.shippingAddressLine2">{{ order.shippingAddressLine2 }}</p>
              <p>
                {{ order?.shippingCity }}{{ order?.shippingCity && order?.shippingState ? ', ' : '' }}{{ order?.shippingState }}
                {{ order?.shippingPostalCode }}
              </p>
              <p>{{ order?.shippingCountry || 'US' }}</p>
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Carrier</dt>
            <dd class="text-white text-right">{{ order?.shippingCarrier || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Service</dt>
            <dd class="text-white text-right">{{ order?.shippingService || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Shipping amount</dt>
            <dd class="text-white text-right">{{ formatCents(order?.shippingCostCents || 0) }}</dd>
          </div>
        </dl>
        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white"
            :disabled="actionLoading === 'buy'"
            @click="buyConfirm = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-cyan-500 text-white font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online"
            @click="confirmBuyLabel"
          >
            {{ actionLoading === 'buy' ? 'Buying label…' : 'Yes, buy label' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Insufficient stock confirm -->
    <div
      v-if="stockConfirm"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4"
      @click.self="stockConfirm = false"
    >
      <div class="w-full sm:max-w-md bg-dark-900 border border-dark-700 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 class="text-lg font-semibold text-white mb-2">Insufficient stock</h3>
        <p class="text-dark-300 text-sm mb-4">
          One or more items have less stock than ordered. Mark payment received anyway?
        </p>
        <ul v-if="stockConfirmLines.length" class="text-sm text-amber-200 space-y-1 mb-5">
          <li v-for="(line, idx) in stockConfirmLines" :key="idx">
            {{ line.productName }} {{ line.variantName }} — ordered {{ line.orderedQty }}, stock {{ line.currentStock }}
          </li>
        </ul>
        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white"
            @click="stockConfirm = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-emerald-500 text-white font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online"
            @click="markPaymentReceived(true)"
          >
            {{ actionLoading === 'payment' ? 'Marking…' : 'Confirm anyway' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject payment -->
    <div
      v-if="rejectOpen"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4"
      @click.self="rejectOpen = false"
    >
      <div class="w-full sm:max-w-md bg-dark-900 border border-dark-700 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 class="text-lg font-semibold text-white mb-2">Reject payment?</h3>
        <p class="text-dark-300 text-sm mb-3">
          The customer will be emailed correction instructions. Inventory is not changed.
        </p>
        <textarea
          v-model="rejectReason"
          rows="3"
          class="w-full min-h-[96px] px-4 py-3 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm mb-3 focus:outline-none focus:border-red-400"
          placeholder="Reason (required)"
        />
        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white"
            @click="rejectOpen = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-red-500 text-white font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online || !rejectReason.trim()"
            @click="rejectPayment"
          >
            {{ actionLoading === 'reject' ? 'Rejecting…' : 'Reject payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mark shipped confirm -->
    <div
      v-if="shipConfirm"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4"
      @click.self="shipConfirm = false"
    >
      <div class="w-full sm:max-w-md bg-dark-900 border border-dark-700 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 class="text-lg font-semibold text-white mb-2">Mark as shipped?</h3>
        <p class="text-dark-300 text-sm mb-5">
          This marks {{ order?.orderNumber || 'the order' }} as shipped. Tracking stays available.
        </p>
        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white"
            @click="shipConfirm = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-primary-500 text-white font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online"
            @click="markShipped"
          >
            {{ actionLoading === 'ship' ? 'Saving…' : 'Mark as Shipped' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Manual tracking modal -->
    <div
      v-if="manualOpen"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 p-0 sm:p-4"
      @click.self="manualOpen = false"
    >
      <div class="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-dark-900 border border-dark-700 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 class="text-lg font-semibold text-white mb-1">Add manual tracking</h3>
        <p class="text-dark-400 text-sm mb-4">
          For labels purchased outside the app. Does not mark the order as shipped.
        </p>
        <div class="space-y-3 mb-5">
          <div>
            <label class="block text-dark-400 text-xs mb-1.5">Carrier <span class="text-red-400">*</span></label>
            <select
              v-model="manualForm.carrier"
              class="w-full min-h-[48px] px-4 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="USPS">USPS</option>
              <option value="UPS">UPS</option>
              <option value="FedEx">FedEx</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-dark-400 text-xs mb-1.5">Service (optional)</label>
            <input
              v-model="manualForm.service"
              type="text"
              class="w-full min-h-[48px] px-4 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="e.g. Priority Mail"
            />
          </div>
          <div>
            <label class="block text-dark-400 text-xs mb-1.5">Tracking number <span class="text-red-400">*</span></label>
            <input
              v-model="manualForm.trackingNumber"
              type="text"
              class="w-full min-h-[48px] px-4 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="Required"
              autocomplete="off"
            />
          </div>
          <div>
            <label class="block text-dark-400 text-xs mb-1.5">Tracking URL (optional)</label>
            <input
              v-model="manualForm.trackingUrl"
              type="url"
              class="w-full min-h-[48px] px-4 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="Auto-filled from carrier if blank"
            />
          </div>
          <div>
            <label class="block text-dark-400 text-xs mb-1.5">Label cost (optional)</label>
            <input
              v-model="manualForm.labelCostDollars"
              type="number"
              min="0"
              step="0.01"
              class="w-full min-h-[48px] px-4 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="Dollars, e.g. 8.50"
            />
          </div>
          <div>
            <label class="block text-dark-400 text-xs mb-1.5">Notes (optional)</label>
            <textarea
              v-model="manualForm.notes"
              rows="2"
              class="w-full min-h-[72px] px-4 py-3 rounded-xl bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="Internal note"
            />
          </div>
        </div>
        <div class="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-dark-800 border border-dark-600 text-white"
            :disabled="actionLoading === 'manual'"
            @click="manualOpen = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 min-h-[48px] rounded-xl bg-cyan-500 text-white font-semibold disabled:opacity-50"
            :disabled="!!actionLoading || !online || !manualForm.carrier || !manualForm.trackingNumber.trim()"
            @click="submitManualTracking"
          >
            {{ actionLoading === 'manual' ? 'Saving…' : 'Save Tracking' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  badgeClass,
  fulfillmentBadge,
  paymentBadgeClass,
  paymentLabel,
  shippingLabel,
  statusHeadline,
} from '~/utils/adminFulfillment'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const orderId = computed(() => route.params.id as string)
const pending = ref(true)
const error = ref('')
const order = ref<any>(null)
const actionLoading = ref<'' | 'buy' | 'email' | 'ship' | 'payment' | 'reject' | 'manual'>('')
const actionToast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const labelActionError = ref<{ message: string; step?: string; detail?: string } | null>(null)
const guideOpen = ref(false)
const shipConfirm = ref(false)
const buyConfirm = ref(false)
const stockConfirm = ref(false)
const stockConfirmLines = ref<any[]>([])
const rejectOpen = ref(false)
const rejectReason = ref('')
const manualOpen = ref(false)
const manualForm = ref({
  carrier: 'USPS',
  service: '',
  trackingNumber: '',
  trackingUrl: '',
  labelCostDollars: '',
  notes: '',
})
const { online } = useAdminOnline()

const FULFILLED_SHIPPING_STATUSES = [
  'label_purchased',
  'manual_tracking_added',
  'shipped',
  'in_transit',
  'delivered',
] as const

const formatCents = (cents: number) => `$${((Number(cents) || 0) / 100).toFixed(2)}`
const formatDate = (dateString: string | null) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function showToast(type: 'success' | 'error', message: string) {
  actionToast.value = { type, message }
  setTimeout(() => {
    actionToast.value = null
  }, 5000)
}

const headline = computed(() => (order.value ? statusHeadline(order.value) : ''))

const isManualCashAppOrder = computed(() => {
  if (!order.value) return false
  const provider = String(order.value.paymentProvider || '')
  const method = String(order.value.paymentMethod || '')
  return provider === 'cashapp_manual' || provider === 'manual' || method === 'cashapp'
})

const showCashAppVerification = computed(() => {
  if (!order.value || !isManualCashAppOrder.value) return false
  return order.value.paymentStatus !== 'paid'
})

const hasInsufficientStock = computed(() =>
  Boolean(order.value?.items?.some((item: any) => item.insufficient))
)

const labelDifference = computed(() => {
  if (!order.value || order.value.labelCostCents == null) return null
  return Number(order.value.shippingCostCents || 0) - Number(order.value.labelCostCents || 0)
})

const buyLabelButtonLabel = computed(() => {
  if (actionLoading.value === 'buy') return 'Buying label…'
  if (order.value?.shippingStatus === 'label_failed') return 'Retry Label Purchase'
  return 'Buy Shipping Label'
})

const emailTrackingLabel = computed(() => {
  if (actionLoading.value === 'email') return 'Sending…'
  if (order.value?.trackingEmailSentAt) return 'Re-send Tracking Email'
  return 'Email Tracking'
})

const stickyPrimary = computed(() => {
  if (!order.value) return ''
  if (showCashAppVerification.value) return 'verify'
  if (order.value.shippingStatus === 'label_purchasing') return 'refresh'
  if (showFulfillmentChoice.value && canBuyLabel.value) return 'buy'
  if (
    order.value.shippingLabelUrl &&
    order.value.shippingStatus !== 'shipped' &&
    order.value.shippingStatus !== 'delivered'
  ) {
    return 'label'
  }
  if (order.value.trackingNumber || order.value.trackingUrl) return 'tracking'
  return ''
})

const hasShippingAddress = computed(() => {
  if (!order.value) return false
  return Boolean(
    order.value.shippingAddressLine1 &&
      order.value.shippingCity &&
      order.value.shippingState &&
      order.value.shippingPostalCode
  )
})

const showFulfillmentChoice = computed(() => {
  if (!order.value) return false
  if (order.value.paymentStatus !== 'paid') return false
  if (order.value.trackingNumber) return false
  if (order.value.shippingLabelUrl) return false
  if (FULFILLED_SHIPPING_STATUSES.includes(order.value.shippingStatus as (typeof FULFILLED_SHIPPING_STATUSES)[number])) {
    return false
  }
  return true
})

const showTrackingFulfillmentCard = computed(() => {
  if (!order.value) return false
  return Boolean(
    order.value.trackingNumber ||
      order.value.shippingLabelUrl ||
      order.value.shippingStatus === 'label_purchased' ||
      order.value.shippingStatus === 'manual_tracking_added' ||
      order.value?.fulfillmentMethod === 'shippo_label' ||
      order.value?.fulfillmentMethod === 'manual_label'
  )
})

const isManualFulfillment = computed(() => {
  if (!order.value) return false
  if (order.value.fulfillmentMethod === 'manual_label') return true
  if (order.value.shippingStatus === 'manual_tracking_added') return true
  if (order.value.fulfillmentMethod === 'shippo_label' || order.value.shippingLabelUrl) return false
  return Boolean(order.value.trackingNumber && !order.value.shippingLabelUrl)
})

const fulfillmentMethodLabel = computed(() => {
  if (!order.value) return '—'
  if (order.value.fulfillmentMethod === 'shippo_label' || order.value.shippingLabelUrl) {
    return 'Shippo label'
  }
  if (order.value.fulfillmentMethod === 'manual_label' || isManualFulfillment.value) {
    return 'Manual/outside label'
  }
  return '—'
})

const buyLabelBlockedReason = computed(() => {
  if (!order.value) return 'Order not loaded.'
  if (order.value.paymentStatus !== 'paid') return 'payment is not paid yet.'
  if (order.value.status === 'cancelled' || ['cancelled', 'refunded'].includes(order.value.paymentStatus)) {
    return 'order is cancelled or refunded.'
  }
  if (order.value.trackingNumber || order.value?.fulfillmentMethod === 'manual_label') {
    return 'tracking was already added for this order.'
  }
  if (order.value.shippoTransactionId && order.value.shippingLabelUrl) {
    return 'a label was already purchased.'
  }
  if (order.value.shippingStatus === 'label_purchasing') {
    return 'a label is already being generated — use Refresh Order.'
  }
  if (!order.value.shippoRateId) return 'no Shippo rate is selected on this order.'
  if (!hasShippingAddress.value) return 'shipping address is incomplete.'
  if (!['selected', 'ready_to_ship', 'label_failed', 'quoted', 'not_quoted'].includes(order.value.shippingStatus)) {
    return `shipping status is "${order.value.shippingStatus}" (needs selected, ready_to_ship, or label_failed).`
  }
  return ''
})

const canBuyLabel = computed(() => !buyLabelBlockedReason.value)

const canEmailTracking = computed(() => {
  if (!order.value) return false
  if (order.value.paymentStatus !== 'paid') return false
  return Boolean((order.value.trackingNumber || order.value.trackingUrl) && order.value.email)
})

const canMarkShipped = computed(() => {
  if (!order.value) return false
  return (
    order.value.paymentStatus === 'paid' &&
    Boolean(order.value.trackingNumber || order.value.trackingUrl) &&
    order.value.shippingStatus !== 'shipped' &&
    order.value.shippingStatus !== 'delivered'
  )
})

function extractLabelError(errOrRes: any): { message: string; step?: string; detail?: string } {
  const body = errOrRes?.data && typeof errOrRes.data === 'object' ? errOrRes.data : errOrRes
  const nested = body?.data && typeof body.data === 'object' ? body.data : null
  const message =
    body?.message ||
    nested?.message ||
    errOrRes?.message ||
    'Label purchase failed.'
  const step = body?.step || nested?.step
  const detail = body?.detail || nested?.detail
  return { message, step, detail }
}

const fulfillmentHint = computed(() => {
  if (!order.value) return ''
  if (order.value.paymentStatus !== 'paid') {
    if (isManualCashAppOrder.value) {
      if (order.value.paymentStatus === 'processing') {
        return 'Customer says they paid. Verify in Cash App, then mark payment received.'
      }
      if (order.value.paymentStatus === 'failed') {
        return 'Payment was rejected. Waiting for the customer to correct and reclaim.'
      }
      return 'Awaiting Cash App payment. Label stays locked until you verify.'
    }
    return 'Label can be purchased after payment is confirmed.'
  }
  switch (order.value.shippingStatus) {
    case 'selected':
    case 'ready_to_ship':
    case 'quoted':
    case 'not_quoted':
      return 'Payment received. Buy a Shippo label or add manual tracking when ready.'
    case 'label_purchasing':
      return 'Label is being generated. Refresh shortly.'
    case 'label_purchased':
      return 'Shipping label is ready.'
    case 'manual_tracking_added':
      return 'Manual tracking added. Email the customer, then mark shipped.'
    case 'shipped':
    case 'in_transit':
      return 'Order marked as shipped.'
    case 'label_failed':
      return 'Label purchase failed. Retry Shippo, or add manual tracking instead.'
    default:
      return `Shipping status: ${order.value.shippingStatus || 'unknown'}`
  }
})

const fulfillmentHintClass = computed(() => {
  const s = order.value?.shippingStatus
  if (order.value?.paymentStatus === 'failed') return 'text-red-400'
  if (order.value?.paymentStatus === 'processing' && isManualCashAppOrder.value) return 'text-amber-400'
  if (s === 'label_failed') return 'text-red-400'
  if (s === 'label_purchased' || s === 'manual_tracking_added' || s === 'shipped' || s === 'in_transit') {
    return 'text-emerald-400'
  }
  if (s === 'label_purchasing') return 'text-amber-400'
  return 'text-dark-400'
})

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('success', `${label} copied.`)
  } catch {
    showToast('error', `Could not copy ${label}.`)
  }
}

function copyShippingAddress() {
  if (!order.value) return
  const lines = [
    order.value.shippingName || order.value.customerName,
    order.value.shippingAddressLine1,
    order.value.shippingAddressLine2,
    [
      [order.value.shippingCity, order.value.shippingState].filter(Boolean).join(', '),
      order.value.shippingPostalCode,
    ]
      .filter(Boolean)
      .join(' '),
    order.value.shippingCountry || 'US',
  ].filter(Boolean)
  copyText(lines.join('\n'), 'Shipping address')
}

function openLabel() {
  const url = order.value?.shippingLabelUrl
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function downloadLabel() {
  const url = order.value?.shippingLabelUrl
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
  showToast('success', 'Use your phone’s share button to save or send this label.')
}

async function shareLabel() {
  const url = order.value?.shippingLabelUrl
  if (!url) return
  const title = `Shipping label ${order.value.orderNumber || ''}`.trim()
  const text = [
    title,
    order.value.trackingNumber ? `Tracking: ${order.value.trackingNumber}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return
    } catch (err: any) {
      if (err?.name === 'AbortError') return
    }
  }
  await copyText(url, 'Label link')
}

async function refreshOrder() {
  const data = await $fetch(`/api/admin/orders/${orderId.value}`, { credentials: 'include' })
  order.value = data
}

function requireOnline(): boolean {
  if (online.value) return true
  showToast('error', 'You are offline. Reconnect to manage orders.')
  return false
}

async function markPaymentReceived(confirmInsufficientStock: boolean) {
  if (actionLoading.value) return
  if (!requireOnline()) return
  actionLoading.value = 'payment'
  try {
    const res = await $fetch<any>(`/api/admin/orders/${orderId.value}/mark-payment-received`, {
      method: 'POST',
      credentials: 'include',
      body: { confirmInsufficientStock },
    })
    stockConfirm.value = false
    await refreshOrder()
    showToast('success', res.message || 'Payment marked received.')
  } catch (err: any) {
    const body = err?.data && typeof err.data === 'object' ? err.data : null
    const data = body?.data && typeof body.data === 'object' ? body.data : body
    if (err?.statusCode === 409 || err?.status === 409) {
      if (data?.insufficientStock && !confirmInsufficientStock) {
        stockConfirmLines.value = (data.stockLines || []).filter((l: any) => l.insufficient)
        stockConfirm.value = true
        return
      }
    }
    showToast('error', body?.message || err?.message || 'Could not mark payment received.')
  } finally {
    actionLoading.value = ''
  }
}

function askRejectPayment() {
  if (!requireOnline()) return
  rejectReason.value = ''
  rejectOpen.value = true
}

async function rejectPayment() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  const reason = rejectReason.value.trim()
  if (!reason) {
    showToast('error', 'A rejection reason is required.')
    return
  }
  actionLoading.value = 'reject'
  try {
    const res = await $fetch<any>(`/api/admin/orders/${orderId.value}/reject-payment`, {
      method: 'POST',
      credentials: 'include',
      body: { reason },
    })
    rejectOpen.value = false
    await refreshOrder()
    showToast('success', res.message || 'Payment rejected.')
  } catch (err: any) {
    showToast('error', err.data?.message || err.message || 'Could not reject payment.')
  } finally {
    actionLoading.value = ''
  }
}

/** Re-check Shippo for an in-flight transaction (idempotent — does not buy a new label). */
async function refreshLabelStatus() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  labelActionError.value = null
  actionLoading.value = 'buy'
  try {
    const res = await $fetch<any>(`/api/admin/orders/${orderId.value}/buy-label`, {
      method: 'POST',
      credentials: 'include',
    })
    await refreshOrder()
    if (res?.ok === false) {
      const parsed = extractLabelError(res)
      labelActionError.value = parsed
      showToast('error', `Could not buy label: ${parsed.message}`)
      return
    }
    if (res.shippingStatus === 'label_purchased') {
      showToast('success', res.message || 'Shipping label is ready.')
    } else {
      showToast('success', res.message || 'Label is still being generated.')
    }
  } catch (err: any) {
    const parsed = extractLabelError(err)
    labelActionError.value = parsed
    showToast('error', `Could not buy label: ${parsed.message}`)
    await refreshOrder().catch(() => {})
  } finally {
    actionLoading.value = ''
  }
}

function askBuyLabel() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  buyConfirm.value = true
}

async function confirmBuyLabel() {
  await buyLabel()
}

async function buyLabel() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  labelActionError.value = null
  actionLoading.value = 'buy'
  try {
    const res = await $fetch<any>(`/api/admin/orders/${orderId.value}/buy-label`, {
      method: 'POST',
      credentials: 'include',
    })
    await refreshOrder()
    buyConfirm.value = false
    if (res?.ok === false) {
      const parsed = extractLabelError(res)
      labelActionError.value = parsed
      showToast('error', `Could not buy label: ${parsed.message}`)
      if (res.shippingLabelUrl) {
        order.value = {
          ...order.value,
          shippingLabelUrl: res.shippingLabelUrl,
          trackingNumber: res.trackingNumber || order.value.trackingNumber,
          trackingUrl: res.trackingUrl || order.value.trackingUrl,
          shippoTransactionId: res.shippoTransactionId || order.value.shippoTransactionId,
        }
      }
      return
    }
    if (res.shippingStatus === 'label_purchasing') {
      showToast('success', res.message || 'Label is being generated. Refresh shortly.')
    } else {
      showToast('success', res.alreadyPurchased ? 'Label already purchased.' : res.message || 'Shipping label purchased.')
    }
  } catch (err: any) {
    const parsed = extractLabelError(err)
    labelActionError.value = parsed
    showToast('error', `Could not buy label: ${parsed.message}`)
    const body = err?.data && typeof err.data === 'object' ? err.data : null
    if (body?.shippingLabelUrl && order.value) {
      order.value = {
        ...order.value,
        shippingLabelUrl: body.shippingLabelUrl,
        trackingNumber: body.trackingNumber || order.value.trackingNumber,
        trackingUrl: body.trackingUrl || order.value.trackingUrl,
        shippoTransactionId: body.shippoTransactionId || order.value.shippoTransactionId,
        shippingStatus: body.shippingStatus || order.value.shippingStatus,
      }
    } else {
      await refreshOrder().catch(() => {})
    }
  } finally {
    actionLoading.value = ''
  }
}

async function emailTracking() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  actionLoading.value = 'email'
  try {
    await $fetch(`/api/admin/orders/${orderId.value}/email-tracking`, {
      method: 'POST',
      credentials: 'include',
    })
    await refreshOrder()
    showToast('success', 'Tracking email sent.')
  } catch (err: any) {
    showToast('error', err.data?.message || err.message || 'Could not send tracking email.')
  } finally {
    actionLoading.value = ''
  }
}

function askManualTracking() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  manualForm.value = {
    carrier: 'USPS',
    service: '',
    trackingNumber: '',
    trackingUrl: '',
    labelCostDollars: '',
    notes: '',
  }
  manualOpen.value = true
}

async function submitManualTracking() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  const carrier = String(manualForm.value.carrier || '').trim()
  const trackingNumber = String(manualForm.value.trackingNumber || '').trim()
  if (!carrier || !trackingNumber) {
    showToast('error', 'Carrier and tracking number are required.')
    return
  }

  let labelCostCents: number | undefined
  const dollarsRaw = String(manualForm.value.labelCostDollars || '').trim()
  if (dollarsRaw !== '') {
    const dollars = Number(dollarsRaw)
    if (!Number.isFinite(dollars) || dollars < 0) {
      showToast('error', 'Label cost must be a non-negative dollar amount.')
      return
    }
    labelCostCents = Math.round(dollars * 100)
  }

  actionLoading.value = 'manual'
  try {
    const body: Record<string, unknown> = {
      carrier,
      trackingNumber,
    }
    const service = String(manualForm.value.service || '').trim()
    const trackingUrl = String(manualForm.value.trackingUrl || '').trim()
    const notes = String(manualForm.value.notes || '').trim()
    if (service) body.service = service
    if (trackingUrl) body.trackingUrl = trackingUrl
    if (labelCostCents != null) body.labelCostCents = labelCostCents
    if (notes) body.notes = notes

    const res = await $fetch<any>(`/api/admin/orders/${orderId.value}/manual-tracking`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    manualOpen.value = false
    await refreshOrder()
    showToast('success', res?.message || 'Manual tracking saved.')
  } catch (err: any) {
    showToast('error', err.data?.message || err.message || 'Could not save manual tracking.')
  } finally {
    actionLoading.value = ''
  }
}

function askMarkShipped() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  shipConfirm.value = true
}

async function markShipped() {
  if (actionLoading.value) return
  if (!requireOnline()) return
  actionLoading.value = 'ship'
  try {
    const res = await $fetch<{
      ok?: boolean
      message?: string
      trackingEmailSent?: boolean
      trackingEmailError?: string | null
    }>(`/api/admin/orders/${orderId.value}/mark-shipped`, {
      method: 'POST',
      credentials: 'include',
    })
    shipConfirm.value = false
    await refreshOrder()
    if (res?.trackingEmailError) {
      showToast('error', res.message || `Shipped, but tracking email failed: ${res.trackingEmailError}`)
    } else {
      showToast('success', res?.message || 'Order marked as shipped.')
    }
  } catch (err: any) {
    showToast('error', err.data?.message || err.message || 'Could not mark as shipped.')
  } finally {
    actionLoading.value = ''
  }
}

onMounted(async () => {
  pending.value = true
  try {
    await refreshOrder()
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Order not found.'
  } finally {
    pending.value = false
  }
})
</script>
