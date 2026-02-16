import { useCartStore } from '~/stores/cart'

export default defineNuxtPlugin(() => {
  const cartStore = useCartStore()
  cartStore.loadFromStorage()
})
