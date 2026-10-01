<template>
  <Transition name="search-panel">
    <slot />
  </Transition>
</template>

<style>
.search-panel-enter-active {
  transition:
    opacity 160ms ease,
    transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

.search-panel-leave-active {
  transition:
    opacity 100ms ease,
    transform 100ms ease;
  pointer-events: none;
}

.search-panel-enter-from,
.search-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .search-panel-enter-active,
  .search-panel-leave-active {
    transition: none;
  }
}
</style>
