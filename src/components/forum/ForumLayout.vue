<template>
  <div class="forum-container relative overflow-auto">
    <slot name="header" />
    <div
      class="forum-content float-left mt-4 min-h-[calc(100vh-64px)] w-[clamp(calc(100%-276px),660px,55vw)]"
    >
      <slot name="content" />

      <slot />
    </div>

    <div class="forum-aside sticky top-64px mt-4">
      <slot name="aside" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$ForumAsideWidth: 274px;

.forum-container {
  margin: 0 auto;
  padding: 0 16px;
}

.forum-aside {
  float: right;
  width: 250px;
  height: 100%;

  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
}

@media (min-width: 1440px) {
  .forum-container {
    max-width: 945px;
    padding: 0;
  }
}

@media (min-width: 768px) {
  .Forum {
    padding-bottom: 96px;
  }
}

@media (max-width: (768 + $ForumAsideWidth)) {
  .Forum {
    margin: 36px auto 0;
  }

  .forum-content {
    width: calc(100% - $ForumAsideWidth);
    margin-right: 1.5rem;
  }
}

@media (max-width: 768px) {
  .forum-content {
    width: calc(100%);
    margin-right: 1.5rem;
  }
}

@media (max-width: 767px) {
  .forum-aside {
    display: none;
  }
}

@media (max-width: 468px) {
  .forum-content {
    width: 100%;
  }
}
</style>
