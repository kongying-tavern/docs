<template>
  <div class="TeamHero">
    <div class="container">
      <h1 class="title">
        <slot name="title" />
      </h1>
      <p class="lead">
        <slot name="lead" />
      </p>
      <p class="action">
        <slot name="action" />
      </p>
    </div>
  </div>
</template>

<style scoped>
.TeamHero {
  padding: 48px 24px;
}

@media (min-width: 768px) {
  .TeamHero {
    padding: 64px 32px 48px;
  }
}

.container {
  margin: 0 auto;
  max-width: 960px;
}

.title,
.lead {
  transition: color 0.25s;
}

.title {
  @apply leading-ui-32;
  @apply text-ui-32;
  font-weight: 500;
}

@media (min-width: 768px) {
  .title {
    @apply leading-ui-40;
    @apply text-ui-40;
  }
}

.lead {
  padding-top: 8px;
  @apply text-ui-16;
  font-weight: 500;
  max-width: 512px;
  color: var(--vp-c-text-2);
}

.action {
  padding-top: 4px;
}

.action :deep(a) {
  display: inline-block;
  @apply leading-ui-20;
  @apply text-ui-14;
  font-weight: 500;
  color: var(--vp-c-brand);
  transition: color 0.25s;
}

.action :deep(a:hover) {
  color: var(--vp-c-brand-dark);
}
</style>
