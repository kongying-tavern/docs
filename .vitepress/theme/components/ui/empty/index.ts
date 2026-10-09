import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Empty } from './Empty.vue'
export { default as EmptyActions } from './EmptyActions.vue'
export { default as EmptyContent } from './EmptyContent.vue'
export { default as EmptyDescription } from './EmptyDescription.vue'
export { default as EmptyHeader } from './EmptyHeader.vue'
export { default as EmptyMedia } from './EmptyMedia.vue'
export { default as EmptyTitle } from './EmptyTitle.vue'

export const emptyActionsVariants = cva('flex w-full flex-wrap items-center justify-center gap-2', {
  variants: {
    variant: {
      default: '',
      pills: [
        '[&_button[data-slot]]:min-w-36',
        '[&_button[data-slot]]:py-0',
        '[&_button[data-slot]]:border',
        '[&_button[data-slot]]:border-transparent',
        '[&_button[data-slot]]:rounded-full',
        '[&_button[data-slot][data-variant=outline]]:border-[var(--vp-c-border)]',
        '[&_button[data-slot][data-variant=outline]]:bg-transparent',
        '[&_button[data-slot][data-variant=outline]]:shadow-none',
      ].join(' '),
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type EmptyActionsVariants = VariantProps<typeof emptyActionsVariants>

export const emptyMediaVariants = cva(
  'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: 'bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*=\'size-\'])]:size-6',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type EmptyMediaVariants = VariantProps<typeof emptyMediaVariants>
