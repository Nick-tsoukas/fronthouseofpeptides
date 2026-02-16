import { defineStore } from 'pinia'
import type { CartItem } from '~/types'
import { CART } from '~/constants'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    isDrawerOpen: false,
  }),

  getters: {
    itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    
    subtotal: (state) => state.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
    
    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    addItem(item: Omit<CartItem, 'quantity'>, quantity: number = 1) {
      const existingIndex = this.items.findIndex(
        (i) => i.variantId === item.variantId
      )

      if (existingIndex > -1) {
        const newQty = Math.min(
          this.items[existingIndex].quantity + quantity,
          CART.MAX_QUANTITY
        )
        this.items[existingIndex].quantity = newQty
      } else {
        this.items.push({
          ...item,
          quantity: Math.min(Math.max(quantity, CART.MIN_QUANTITY), CART.MAX_QUANTITY),
        })
      }
      this.saveToStorage()
      this.openDrawer()
    },

    removeItem(variantId: number) {
      this.items = this.items.filter((item) => item.variantId !== variantId)
      this.saveToStorage()
    },

    updateQuantity(variantId: number, quantity: number) {
      const item = this.items.find((i) => i.variantId === variantId)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(variantId)
        } else {
          item.quantity = Math.min(Math.max(quantity, CART.MIN_QUANTITY), CART.MAX_QUANTITY)
          this.saveToStorage()
        }
      }
    },

    clearCart() {
      this.items = []
      this.saveToStorage()
    },

    openDrawer() {
      this.isDrawerOpen = true
    },

    closeDrawer() {
      this.isDrawerOpen = false
    },

    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen
    },

    saveToStorage() {
      if (import.meta.client) {
        localStorage.setItem('cart', JSON.stringify(this.items))
      }
    },

    loadFromStorage() {
      if (import.meta.client) {
        const stored = localStorage.getItem('cart')
        if (stored) {
          try {
            this.items = JSON.parse(stored)
          } catch {
            this.items = []
          }
        }
      }
    },
  },
})
