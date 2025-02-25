<template>
  <div class="slide-enter Forum">
    <div class="forum-container">
      <div
        class="forum-content float-left min-h-[calc(100vh-64px)] w-[clamp(calc(100%-240px),700px,55vw)]"
      >
        <slot name="header" />

        <slot name="content" />

        <slot />
      </div>

      <div class="forum-aside">
        <slot name="aside" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$ForumAsideWidth: 248px;

.Forum {
  flex-grow: 1;
  flex-shrink: 0;
  margin: calc(var(--vp-layout-top-height, 0px) + 48px) auto 0;
  width: 100%;
  margin-bottom: 32px;
}

.forum-container {
  margin: 0 auto;
  padding: 0 32px;
}

.forum-aside {
  float: right;
  width: 224px;
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
    width: 85vw;
    margin-right: 1.5rem;
  }
}
</style>
