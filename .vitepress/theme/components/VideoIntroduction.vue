<template>
  <a href="https://www.bilibili.com/video/BV1uU4y157Te" target="_blank">
    <span class="logo-wrapper">
      <label i-custom-bilibili h-6 w-6></label>
    </span>
    <span class="description">
      观看客户端基础使用教程 <span>（BV1uU4y157Te）</span>
    </span>
  </a>
</template>

<style scoped>
a {
  background-color: var(--vp-c-bg-alt);
  border-radius: 8px;
  padding: 8px 16px 8px 8px;
  transition: color 0.5s, background-color 0.5s;
  display: flex;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 10px;
}

.description {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: var(--vp-c-text-1);
  margin: 0 0 0 16px;
  transition: color 0.5s;
}

a:hover {
  text-decoration: none !important;
}

.description span {
  color: var(--vp-c-brand);
}

.logo-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--vp-c-bg-soft);
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 576px) {
  .description {
    font-size: 12px;
    line-height: 18px;
  }

  .logo-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
  }
}
</style>
