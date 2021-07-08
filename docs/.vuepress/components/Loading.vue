<!--
 * @Author: undefined
 * @Date: 2021-07-07 15:55
 * @LastEditTime: 2021-07-07 17:58
-->
<template>
  <div class="load-container">
    <div class="container container-1">
      <div class="dot dot-1"></div>
      <div class="dot dot-2"></div>
      <div class="dot dot-3"></div>
      <div class="dot dot-4"></div>
    </div>
    <div class="container container-2">
      <div class="dot dot-1"></div>
      <div class="dot dot-2"></div>
      <div class="dot dot-3"></div>
      <div class="dot dot-4"></div>
    </div>
    <div class="container container-3">
      <div class="dot dot-1"></div>
      <div class="dot dot-2"></div>
      <div class="dot dot-3"></div>
      <div class="dot dot-4"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'Loading',
})
</script>

<style lang="scss" scoped>
.load-container {
  // margin: 50px auto;
  width: 56px;
  height: 56px;
  .container {
    position: absolute;
    width: 100%;
    height: 100%;
    .dot {
      width: 12px;
      height: 12px;
      background-color: rgba(245, 245, 147, 1);
      box-shadow: 0 0 12px 0 rgba(255, 189, 89, 1);
      border-radius: 100%;
      position: absolute;
      animation: bouncedelay 0.8s infinite ease-in-out;
      animation-fill-mode: both;

      &.dot-1 {
        top: 0;
        left: 0;
      }
      &.dot-2 {
        top: 0;
        right: 0;
      }
      &.dot-3 {
        right: 0;
        bottom: 0;
      }
      &.dot-4 {
        left: 0;
        bottom: 0;
      }
    }

    &.container-1 {
      .dot-2 {
        animation-delay: -0.6s;
      }
      .dot-3 {
        animation-delay: -0.4s;
      }
      .dot-4 {
        animation-delay: -0.2s;
      }
    }

    &.container-2 {
      transform: rotateZ(45deg);

      .dot-1 {
        animation-delay: -0.734s;
      }

      .dot-2 {
        animation-delay: -0.534s;
      }

      .dot-3 {
        animation-delay: -0.334s;
      }

      .dot-4 {
        animation-delay: -0.137s;
      }
    }

    &.container-3 {
      transform: rotateZ(90deg);
      .dot-1 {
        animation-delay: -0.667s;
      }

      .dot-2 {
        animation-delay: -0.467s;
      }

      .dot-3 {
        animation-delay: -0.267s;
      }

      .dot-4 {
        animation-delay: -0.0667s;
      }
    }
  }

  @keyframes bouncedelay {
    0%,
    80%,
    100% {
      opacity: 0;
      // transform: scale(0);
    }
    40% {
      opacity: 1;
      // transform: scale(1);
    }
  }
}
</style>
