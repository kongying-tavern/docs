import { defineAsyncComponent } from 'vue'

// Shared loaders keep menu triggers synchronous when virtual rows remount.
export const ForumMenuDesktop = defineAsyncComponent(() => import('./ForumMenuDesktop.vue'))
export const ForumMenuMobileDrawer = defineAsyncComponent(() => import('./ForumMenuMobileDrawer.vue'))
