<script setup lang="ts">
interface AvatarProps {
  src?: string
  icon?: string
  alt?: string
  size?: string
}

interface ChipProps {
  color?: 'primary' | 'gray' | 'green' | 'yellow' | 'red' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange' | 'teal' | 'cyan'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  size?: string
  inset?: boolean
}

interface Props {
  name?: string
  description?: string
  avatar?: Omit<AvatarProps, 'size'>
  chip?: boolean | Omit<ChipProps, 'size' | 'inset'>
  size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  orientation?: 'horizontal' | 'vertical'
  to?: string
  target?: '_blank' | '_parent' | '_self' | '_top' | string
  as?: any
  ui?: {
    root?: string
    wrapper?: string
    name?: string
    description?: string
    avatar?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  orientation: 'horizontal',
  as: 'div',
})

interface SizeClasses {
  root: string
  wrapper?: string
  name: string
  description: string
}

const sizeClasses: Record<NonNullable<Props['size']>, SizeClasses> = {
  '3xs': {
    root: 'gap-1',
    wrapper: 'flex items-center gap-1',
    name: 'text-xs',
    description: 'text-xs',
  },
  '2xs': {
    root: 'gap-1.5',
    wrapper: 'flex items-center gap-1.5',
    name: 'text-xs',
    description: 'text-xs',
  },
  'xs': {
    root: 'gap-1.5',
    wrapper: 'flex items-center gap-1.5',
    name: 'text-xs',
    description: 'text-xs',
  },
  'sm': {
    root: 'gap-2',
    name: 'text-xs',
    description: 'text-xs',
  },
  'md': {
    root: 'gap-2',
    name: 'text-sm',
    description: 'text-xs',
  },
  'lg': {
    root: 'gap-2.5',
    name: 'text-sm',
    description: 'text-sm',
  },
  'xl': {
    root: 'gap-2.5',
    name: 'text-base',
    description: 'text-sm',
  },
  '2xl': {
    root: 'gap-3',
    name: 'text-base',
    description: 'text-base',
  },
  '3xl': {
    root: 'gap-3',
    name: 'text-lg',
    description: 'text-base',
  },
}

const orientationClasses = {
  horizontal: 'flex items-center',
  vertical: 'flex flex-col',
}

const chipPositionClasses = {
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
}

const chipColorClasses: Record<NonNullable<ChipProps['color']>, string> = {
  primary: 'bg-primary-500',
  gray: 'bg-gray-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
}
</script>

<template>
  <component
    :is="as"
    class="group/user relative" :class="[
      orientationClasses[orientation],
      sizeClasses[size].root,
      props.ui?.root,
      to && 'cursor-pointer',
    ]"
    :to="to"
    :target="target"
  >
    <div
      class="relative" :class="[
        sizeClasses[size].wrapper,
        props.ui?.wrapper,
      ]"
    >
      <slot name="avatar">
        <div
          v-if="avatar"
          class="shrink-0" :class="[
            props.ui?.avatar,
          ]"
        >
          <img
            v-if="avatar.src"
            :src="avatar.src"
            :alt="avatar.alt || name"
            class="rounded-full object-cover"
            :class="[
              size === '3xs' && 'w-4 h-4',
              size === '2xs' && 'w-5 h-5',
              size === 'xs' && 'w-6 h-6',
              size === 'sm' && 'w-8 h-8',
              size === 'md' && 'w-10 h-10',
              size === 'lg' && 'w-12 h-12',
              size === 'xl' && 'w-14 h-14',
              size === '2xl' && 'w-16 h-16',
              size === '3xl' && 'w-20 h-20',
            ]"
          >
          <div
            v-else-if="avatar.icon"
            class="flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800" :class="[
              avatar.icon,
              size === '3xs' && 'w-4 h-4 text-xs',
              size === '2xs' && 'w-5 h-5 text-xs',
              size === 'xs' && 'w-6 h-6 text-sm',
              size === 'sm' && 'w-8 h-8 text-sm',
              size === 'md' && 'w-10 h-10 text-base',
              size === 'lg' && 'w-12 h-12 text-lg',
              size === 'xl' && 'w-14 h-14 text-xl',
              size === '2xl' && 'w-16 h-16 text-2xl',
              size === '3xl' && 'w-20 h-20 text-3xl',
            ]"
          />
        </div>
      </slot>

      <div
        v-if="chip"
        class="absolute h-2.5 w-2.5 border-2 border-white rounded-full" :class="[
          typeof chip === 'object' && chip.position && chipPositionClasses[chip.position],
          typeof chip === 'object' && chip.color && chipColorClasses[chip.color],
          typeof chip === 'boolean' && 'bg-primary-500 top-0 right-0',
        ]"
      />
    </div>

    <div class="flex flex-col">
      <slot name="name">
        <span
          v-if="name"
          class="c-[var(--vp-c-text-1)] font-medium font-[var(--vp-font-family-title)] dark:text-gray-100" :class="[
            sizeClasses[size].name,
            props.ui?.name,
            to && 'vp-link',
          ]"
        >
          {{ name }}
        </span>
      </slot>

      <slot name="description">
        <span
          v-if="description"
          class="text-gray-500 font-[var(--vp-font-family-subtitle)] dark:text-gray-400" :class="[
            sizeClasses[size].description,
            props.ui?.description,
          ]"
        >
          {{ description }}
        </span>
      </slot>

      <slot />
    </div>
  </component>
</template>
