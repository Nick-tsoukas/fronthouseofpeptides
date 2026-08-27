<template>
  <div class="px-4 pt-5 pb-8 sm:px-6 lg:p-8">
    <div class="mb-5">
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
      class="mb-4 rounded-xl px-4 py-3 text-sm max-w-4xl"
      :class="actionToast.type === 'success'
        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
        : 'bg-red-500/10 border border-red-500/30 text-red-400'"
    >
      {{ actionToast.message }}
    </div>

    <div v-if="pending" class="space-y-6 max-w-4xl">
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-6 animate-pulse">
        <div class="h-6 bg-dark-800 rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-dark-800 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="error || !order" class="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center max-w-4xl">
      <h2 class="text-xl font-semibold text-white mb-2">{{ error || 'Order Not Found' }}</h2>
      <NuxtLink to="/admin/orders" class="text-cyan-400 text-sm">Back to Orders</NuxtLink>
    </div>

    <div v-else class="space-y-5 max-w-4xl">
      <!-- Status command header -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <p class="font-mono text-lg sm:text-2xl font-bold text-white break-all">
          {{ order.orderNumber || `Order #${orderId}` }}
        </p>
        <p class="mt-1 text-cyan-300 font-semibold">{{ headline }}</p>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span :class="paymentBadgeClass(order.paymentStatus)">{{ paymentLabel(order.paymentStatus) }}</span>
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

      <!-- Manual payment verification -->
      <div
        v-if="manual"
        class="bg-dark-900 rounded-xl border p-4 sm:p-6"
        :class="needsVerification ? 'border-fuchsia-500/40' : 'border-dark-700'"
      >
        <h2 class="text-lg font-semibold text-white mb-1">{{ manual.label }} payment</h2>
        <p class="text-dark-400 text-sm mb-4">
          Open {{ manual.label }} and confirm the exact payment amount and order number before marking this
          order paid.
        </p>

        <div
          v-if="!manual.configured"
          class="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
        >
          {{ manual.label }} settings are incomplete ({{ manual.missingFields.join(', ') }}). Fix them in
          <NuxtLink to="/admin/settings" class="underline">Settings → Payments</NuxtLink>.
        </div>

        <dl class="space-y-2 text-sm mb-4">
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Amount due</dt>
            <dd class="text-white font-semibold text-right">{{ formatCents(order.totalCents) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Order number</dt>
            <dd class="text-white font-mono text-right break-all">{{ order.orderNumber || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Customer</dt>
            <dd class="text-white text-right break-all">{{ order.customerName }} · {{ order.email }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Pay-to</dt>
            <dd class="text-white text-right break-all">
              {{ manual.recipientHandle || '—' }}
              <span v-if="manual.recipientDisplayName" class="text-dark-400">({{ manual.recipientDisplayName }})</span>
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Customer says sent by</dt>
            <dd class="text-white text-right break-all">{{ manual.claimedSenderName || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Claimed handle</dt>
            <dd class="text-white font-mono text-right break-all">{{ manual.claimedSenderHandle || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Claimed at</dt>
            <dd class="text-white text-right">{{ manual.claimedAt ? formatDate(manual.claimedAt) : '—' }}</dd>
          </div>
          <div v-if="manual.claimedNote" class="pt-2 border-t border-dark-800">
            <dt class="text-dark-500 mb-1">Customer note</dt>
            <dd class="text-white whitespace-pre-line">{{ manual.claimedNote }}</dd>
          </div>
          <div class="flex justify-between gap-3 pt-2 border-t border-dark-800">
            <dt class="text-dark-500">Payment status</dt>
            <dd class="text-white text-right">{{ paymentLabel(order.paymentStatus) }}</dd>
          </div>
          <div v-if="manual.verifiedAt" class="flex justify-between gap-3">
            <dt class="text-dark-500">Verified</dt>
            <dd class="text-white text-right">{{ formatDate(manual.verifiedAt) }} · {{ manual.verifiedBy }}</dd>
          </div>
          <div v-if="manual.rejectedAt" class="flex justify-between gap-3">
            <dt class="text-dark-500">Rejected</dt>
            <dd class="text-white text-right">{{ formatDate(manual.rejectedAt) }}</dd>
          </div>
        </dl>

        <p class="text-amber-300/90 text-xs mb-4">
          A customer claim is not proof of payment. Verify it in {{ manual.label }} first.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            v-if="canVerifyManualPayment"
            type="button"
            class="min-h-[48px] px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading || !online"
            @click="markManualPaymentReceived"
          >
            {{ actionLoading === 'manual' ? 'Verifying…' : 'Mark Payment Received' }}
          </button>
          <button
            v-if="canVerifyManualPayment"
            type="button"
            class="min-h-[48px] px-4 bg-dark-800 border border-dark-600 hover:bg-dark-700 text-white text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading || !online"
            @click="rejectOpen = !rejectOpen"
          >
            Reject / Request Correction
          </button>
          <button
            type="button"
            class="min-h-[48px] px-4 bg-dark-800 border border-dark-600 text-white text-sm rounded-xl"
            @click="copyText(order.orderNumber || '', 'Order number')"
          >
            Copy Order Number
          </button>
          <button
            type="button"
            class="min-h-[48px] px-4 bg-dark-800 border border-dark-600 text-white text-sm rounded-xl"
            @click="copyText(((order.totalCents || 0) / 100).toFixed(2), 'Amount')"
          >
            Copy Amount
          </button>
          <button
            type="button"
            class="min-h-[48px] px-4 bg-dark-800 border border-dark-600 text-white text-sm rounded-xl"
            @click="copyText(order.email || '', 'Customer email')"
          >
            Copy Customer Email
          </button>
          <a
            v-if="manual.paymentUrl"
            :href="manual.paymentUrl"
            target="_blank"
            rel="noopener"
            class="min-h-[48px] px-4 bg-dark-800 border border-dark-600 text-white text-sm rounded-xl flex items-center justify-center"
          >
            Open {{ manual.label }}
          </a>
        </div>

        <div v-if="rejectOpen && canVerifyManualPayment" class="mt-4 space-y-2">
          <label class="block text-dark-300 text-xs">Reason emailed to the customer</label>
          <textarea
            v-model="rejectReason"
            rows="3"
            class="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-white text-sm"
            placeholder="We could not find a payment matching this order number and amount."
          ></textarea>
          <button
            type="button"
            class="min-h-[48px] w-full px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading || !online"
            @click="rejectManualPayment"
          >
            {{ actionLoading === 'manual' ? 'Sending…' : 'Reject and email customer' }}
          </button>
        </div>
      </div>

      <!-- Fulfillment actions -->
      <div class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <h2 class="text-lg font-semibold text-white mb-3">Next action</h2>

        <p
          v-if="order.labelErrorMessage && order.shippingStatus === 'label_failed'"
          class="mb-4 text-sm text-red-400 break-words"
        >
          {{ order.labelErrorMessage }}
        </p>

        <p
          v-if="showBuyLabelBlockedNotice"
          class="mb-4 text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2"
        >
          Buy Shipping Label unavailable: {{ buyLabelBlockedReason }}
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

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            v-if="canBuyLabel"
            type="button"
            class="min-h-[48px] px-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading || !online"
            @click="buyLabel"
          >
            {{ buyLabelButtonLabel }}
          </button>

          <button
            v-if="order.shippingStatus === 'label_purchasing'"
            type="button"
            class="min-h-[48px] px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-semibold rounded-xl"
            :disabled="!!actionLoading"
            @click="refreshLabelStatus"
          >
            {{ actionLoading === 'buy' ? 'Checking…' : 'Refresh Order' }}
          </button>

          <button
            v-if="order.shippingLabelUrl"
            type="button"
            class="min-h-[48px] px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl"
            @click="openLabel"
          >
            Open Label
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

      <!-- Label card -->
      <div v-if="order.shippingLabelUrl || order.shippingStatus === 'label_purchased'" class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <h2 class="text-lg font-semibold text-white mb-3">Shipping label</h2>
        <dl class="space-y-2 text-sm mb-4">
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
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Purchased</dt>
            <dd class="text-white text-right">{{ order.labelPurchasedAt ? formatDate(order.labelPurchasedAt) : '—' }}</dd>
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
            @click="downloadLabel"
          >
            Download Label
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
        </div>
      </div>

      <!-- Print helper -->
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

      <!-- Tracking card -->
      <div v-if="order.trackingNumber || order.trackingUrl" class="bg-dark-900 rounded-xl border border-dark-700 p-4 sm:p-6">
        <h2 class="text-lg font-semibold text-white mb-3">Tracking</h2>
        <dl class="space-y-2 text-sm mb-4">
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Carrier / service</dt>
            <dd class="text-white text-right">
              {{ order.shippingCarrier || '—' }}{{ order.shippingCarrier && order.shippingService ? ' — ' : '' }}{{ order.shippingService || '' }}
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-dark-500">Tracking #</dt>
            <dd class="text-white font-mono text-xs text-right break-all">{{ order.trackingNumber || '—' }}</dd>
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
            Mark as Shipped
          </button>
        </div>
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
          <template v-else-if="order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered'">
            <li>Open tracking if a customer asks.</li>
            <li>Re-send the tracking email if needed.</li>
          </template>
          <template v-else>
            <li>Pack the products.</li>
            <li>Tap Buy Shipping Label.</li>
            <li>Open or share the label PDF.</li>
            <li>Print and attach the label.</li>
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
          <div class="text-white text-sm space-y-1">
            <p>{{ order.shippingName || order.customerName }}</p>
            <p>{{ order.shippingAddressLine1 || '—' }}</p>
            <p v-if="order.shippingAddressLine2">{{ order.shippingAddressLine2 }}</p>
            <p>
              {{ order.shippingCity }}{{ order.shippingCity && order.shippingState ? ', ' : '' }}{{ order.shippingState }}
              {{ order.shippingPostalCode }}
            </p>
            <p>{{ order.shippingCountry || 'US' }}</p>
          </div>
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
            <dt class="text-dark-500">Inventory committed</dt>
            <dd class="text-white">{{ order.inventoryCommitted ? 'Yes' : 'No' }}</dd>
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
        <button
          v-if="stickyPrimary === 'buy'"
          type="button"
          class="flex-1 min-h-[48px] rounded-xl bg-cyan-500 text-white font-semibold disabled:opacity-50"
          :disabled="!!actionLoading || !online"
          @click="buyLabel"
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
        <a
          v-else-if="stickyPrimary === 'tracking' && order.trackingUrl"
          :href="order.trackingUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-dark-700 text-white font-semibold"
        >
          Open Tracking
        </a>
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
const actionLoading = ref<'' | 'buy' | 'email' | 'ship' | 'manual'>('')
const actionToast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const labelActionError = ref<{ message: string; step?: string; detail?: string } | null>(null)
const guideOpen = ref(false)
const shipConfirm = ref(false)
const { online } = useAdminOnline()

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

const rejectOpen = ref(false)
const rejectReason = ref('')

const manual = computed<any>(() => (order.value?.isManualPayment ? order.value.manualPayment : null))

const needsVerification = computed(() =>
  ['payment_claimed_by_customer', 'manual_review'].includes(order.value?.paymentStatus)
)

const canVerifyManualPayment = computed(
  () =>
    Boolean(manual.value) &&
    ['awaiting_manual_payment', 'payment_claimed_by_customer', 'manual_review', 'manual_payment_rejected'].includes(
      order.value?.paymentStatus
    )
)

async function markManualPaymentReceived() {
  if (actionLoading.value || !requireOnline()) return
  actionLoading.value = 'manual'
  try {
    const res = await $fetch<any>(
      `/api/admin/orders/${orderId.value}/mark-manual-payment-received`,
      { method: 'POST', credentials: 'include', body: {} }
    )
    await refreshOrder()
    showToast('success', res?.message || 'Payment verified.')
  } catch (err: any) {
    showToast('error', err?.data?.message || err?.message || 'Could not mark this order paid.')
  } finally {
    actionLoading.value = ''
  }
}

async function rejectManualPayment() {
  if (actionLoading.value || !requireOnline()) return
  actionLoading.value = 'manual'
  try {
    const res = await $fetch<any>(`/api/admin/orders/${orderId.value}/reject-manual-payment`, {
      method: 'POST',
      credentials: 'include',
      body: { reason: rejectReason.value },
    })
    await refreshOrder()
    rejectOpen.value = false
    rejectReason.value = ''
    showToast(res?.customerEmailSent ? 'success' : 'error', res?.message || 'Payment rejected.')
  } catch (err: any) {
    showToast('error', err?.data?.message || err?.message || 'Could not reject this payment.')
  } finally {
    actionLoading.value = ''
  }
}

const labelDifference = computed(() => {
  if (!order.value || order.value.labelCostCents == null) return null
  return Number(order.value.shippingCostCents || 0) - Number(order.value.labelCostCents || 0)
})

const buyLabelButtonLabel = computed(() => {
  if (actionLoading.value === 'buy') return 'Purchasing…'
  if (order.value?.shippingStatus === 'label_failed') return 'Retry Label Purchase'
  return 'Buy Shipping Label'
})

const emailTrackingLabel = computed(() => {
  if (actionLoading.value === 'email') return 'Sending…'
  if (order.value?.trackingEmailSentAt) return 'Re-send Tracking Email'
  return 'Email Tracking to Customer'
})

const stickyPrimary = computed(() => {
  if (!order.value) return ''
  if (canBuyLabel.value) return 'buy'
  if (order.value.shippingStatus === 'label_purchasing') return 'refresh'
  if (order.value.shippingLabelUrl && order.value.shippingStatus !== 'shipped' && order.value.shippingStatus !== 'delivered') {
    return 'label'
  }
  if (order.value.trackingUrl) return 'tracking'
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

const buyLabelBlockedReason = computed(() => {
  if (!order.value) return 'Order not loaded.'
  if (order.value.paymentStatus !== 'paid') return 'payment is not paid yet.'
  if (order.value.status === 'cancelled' || ['cancelled', 'refunded'].includes(order.value.paymentStatus)) {
    return 'order is cancelled or refunded.'
  }
  if (order.value.shippoTransactionId && order.value.shippingLabelUrl) {
    return 'a label was already purchased.'
  }
  if (order.value.shippingStatus === 'label_purchasing') {
    return 'a label is already being generated — use Refresh Order.'
  }
  if (!order.value.shippoRateId) return 'no Shippo rate is selected on this order.'
  if (!hasShippingAddress.value) return 'shipping address is incomplete.'
  if (!['selected', 'ready_to_ship', 'label_failed'].includes(order.value.shippingStatus)) {
    return `shipping status is "${order.value.shippingStatus}" (needs selected, ready_to_ship, or label_failed).`
  }
  return ''
})

const canBuyLabel = computed(() => !buyLabelBlockedReason.value)

const showBuyLabelBlockedNotice = computed(() => {
  if (!order.value || canBuyLabel.value || !buyLabelBlockedReason.value) return false
  if (order.value.shippingLabelUrl || order.value.shippingStatus === 'label_purchased') return false
  if (order.value.shippingStatus === 'label_purchasing') return false
  if (order.value.shippingStatus === 'shipped' || order.value.shippingStatus === 'delivered') return false
  return true
})

const canEmailTracking = computed(() => {
  if (!order.value) return false
  return (
    Boolean(order.value.trackingNumber && order.value.trackingUrl && order.value.email) &&
    ['label_purchased', 'shipped', 'in_transit'].includes(order.value.shippingStatus)
  )
})

const canMarkShipped = computed(() => {
  if (!order.value) return false
  return (
    order.value.paymentStatus === 'paid' &&
    Boolean(order.value.shippoTransactionId && order.value.trackingNumber) &&
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
    return order.value.isManualPayment
      ? 'Shipping label can be purchased after payment is verified.'
      : 'Label can be purchased after payment is confirmed.'
  }
  switch (order.value.shippingStatus) {
    case 'selected':
    case 'ready_to_ship':
      return 'Payment received. Buy a shipping label when the package is ready.'
    case 'label_purchasing':
      return 'Label is being generated. Refresh shortly.'
    case 'label_purchased':
      return 'Shipping label is ready.'
    case 'shipped':
      return 'Order marked as shipped.'
    case 'label_failed':
      return 'Label purchase failed. Review the address, package details, or carrier setup.'
    default:
      return `Shipping status: ${order.value.shippingStatus || 'unknown'}`
  }
})

const fulfillmentHintClass = computed(() => {
  const s = order.value?.shippingStatus
  if (s === 'label_failed') return 'text-red-400'
  if (s === 'label_purchased' || s === 'shipped') return 'text-emerald-400'
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

function askMarkShipped() {
  if (!requireOnline()) return
  shipConfirm.value = true
}

async function markShipped() {
  if (!requireOnline()) return
  actionLoading.value = 'ship'
  try {
    await $fetch(`/api/admin/orders/${orderId.value}/mark-shipped`, {
      method: 'POST',
      credentials: 'include',
    })
    shipConfirm.value = false
    await refreshOrder()
    showToast('success', 'Order marked as shipped.')
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
