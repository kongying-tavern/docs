<template>
  <dot :class="$style.dot"></dot>
</template>

<style module lang="scss">
.dot {
  display: inline-block;
  height: 1em;
  line-height: 1;
  text-align: left;
  vertical-align: -0.25ex;
  overflow: hidden;
  &::before {
    display: block;
    content: '...\A..\A.';
    white-space: pre-wrap;
    animation: dot 2s infinite step-start both;
  }
}

@keyframes dot {
  33% {
    transform: translateY(-2em);
  }
  66% {
    transform: translateY(-1em);
  }
}
</style>
