// @unocss-include
export const Notification = {
  wrapper:
    'w-full pointer-events-auto transition-all duration-200 ease-in-out hover:scale-[103%]',
  container: 'relative overflow-hidden',
  inner: 'w-0 flex-1',
  title: 'text-sm font-medium text-[var(--vp-c-text-1)]',
  description: 'mt-1 text-sm leading-4 text-gray-500 dark:text-gray-400',
  actions: 'flex items-center gap-2 mt-3 flex-shrink-0',
  background: 'bg-[var(--vp-c-bg-elv)]',
  shadow: 'shadow-lg',
  rounded: 'rounded-lg',
  padding: 'p-4',
  gap: 'gap-3',
  ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
  icon: {
    base: 'flex-shrink-0 w-5 h-5',
    color: 'text-{color}-500 dark:text-{color}-400',
  },
  avatar: {
    base: 'flex-shrink-0 self-center',
    size: 'md',
  },
  progress: {
    base: 'absolute bottom-0 end-0 start-0 h-1',
    background: 'bg-[var(--vp-c-indigo-1)]',
  },
  transition: {
    enterActiveClass: 'transform ease-out duration-300 transition',
    enterFromClass: 'translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2',
    enterToClass: 'translate-y-0 opacity-100 sm:translate-x-0',
    leaveActiveClass: 'transition ease-in duration-100',
    leaveFromClass: 'opacity-100',
    leaveToClass: 'opacity-0',
  },
  default: {
    color: 'primary',
    icon: null,
    timeout: 5000,
    closeButton: {
      icon: 'i-mdi:close',
      color: 'gray',
      base: 'flex-shrink-0 h-5 w-5',
    },
    actionButton: {
      size: 'xs',
      color: 'white',
      base: 'flex items-center gap-2 flex-shrink-0 mt-0',
    },
  },
}
