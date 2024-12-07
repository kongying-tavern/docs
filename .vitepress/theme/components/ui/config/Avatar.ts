// @unocss-include
export const Avatar = {
  wrapper: 'relative inline-flex items-center justify-center flex-shrink-0',
  background: 'bg-[var(--vp-c-gray-soft)]',
  rounded: 'rounded-full',
  text: 'font-medium leading-none text-gray-900 dark:text-white truncate',
  placeholder:
    'font-medium leading-none text-gray-500 dark:text-gray-400 truncate',
  size: {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-14 w-14 text-xl',
  },
  chip: {
    base: 'absolute rounded-full ring-1 ring-white dark:ring-gray-900 flex items-center justify-center text-white dark:text-gray-900 font-medium',
    background: 'bg-{color}-500 dark:bg-{color}-400',
    position: {
      'top-right': 'top-0 right-0',
      'bottom-right': 'bottom-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-left': 'bottom-0 left-0',
    },
    size: {
      xs: 'h-1.5 min-w-[0.375rem] text-[6px] p-px',
      sm: 'h-2 min-w-[0.5rem] text-[7px] p-0.5',
      md: 'h-2.5 min-w-[0.625rem] text-[8px] p-0.5',
      lg: 'h-3 min-w-[0.75rem] text-[10px] p-0.5',
      xl: 'h-3.5 min-w-[0.875rem] text-[11px] p-1',
    },
  },
  icon: {
    base: 'text-gray-500 dark:text-gray-400 flex-shrink-0',
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7',
    },
  },
  default: {
    size: 'sm',
    icon: null,
    chipColor: null,
    chipPosition: 'top-right',
  },
}
