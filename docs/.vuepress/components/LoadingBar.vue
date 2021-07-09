<template>
  <div class="loading">
    <!-- 默认加载动画 -->
    <div class="loading-default">
      <img :src="$withBase('/20210617/loading-bar.png')" alt="Loading..." />
    </div>
    <!-- 移动端加载动画 -->
    <div class="loading-mobile">
      <ul class="rotate">
        <li class="item"></li>
        <li class="item"></li>
        <li class="item"></li>
        <li class="item"></li>
        <li class="item"></li>
      </ul>
      <h2 id="loading-text">Loading<Dot /></h2>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'LoadingBar',
  props: {},
  setup() {
    console.log('Loading')
  },
})
</script>

<style lang="scss" scoped>
@charset "utf-8";

$loading-img-height: 62.5px;
$loading-img-width: 500px;

$text-loading-animation-delay: 0.15s;
$text-loading-animation-item-size: 5px;
$text-loading-animation-rotate-size: 50px;

@mixin img-color($color, $top: 500px) {
  position: absolute;
  left: 0;
  top: $top;
  filter: drop-shadow(0 #{-$top} 0 $color);
}

.loading {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99999;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  opacity: 1;
  overflow-y: hidden;
  transition: all 0.3s;
  .loading-default {
    position: absolute;
    left: 50%;
    top: 50%;
    width: $loading-img-width;
    height: $loading-img-height;
    transform: translate(-50%, -50%) scale(0.8);
    transition: all 0.5s;
    overflow: hidden;

    img {
      @include img-color(var(--Docs-LoadingBackgroundColor));
    }

    &::after {
      content: '';
      @include img-color(var(--Docs-LoadingProspectColor));
      width: $loading-img-width;
      height: $loading-img-height;
      //background: url('/20210617/loading-bar.png') no-repeat left 100%;
      background-size: $loading-img-width $loading-img-height;
      background-position-x: 0;
    }
  }

  .loading-mobile {
    display: none;
  }

  @media screen and (max-width: 734px) {
    .loading-default {
      display: none;
    }

    @media screen and (orientation: landscape) {
      // 移动端横屏依旧下使用默认Loading并且得小一点
      .loading-default {
        display: block !important;
        transform: translate(-50%, -50%) scale(0.7) !important;
      }

      .loading-mobile {
        display: none !important;
      }
    }

    .loading-mobile {
      display: inline-block;
      position: absolute;
      width: 150px;
      height: auto;
      left: 50%;
      top: 50%;
      text-align: center;
      transform: translate(-50%, -50%) scale(1.2);

      .rotate {
        position: relative;
        width: $text-loading-animation-rotate-size;
        height: $text-loading-animation-rotate-size;
        margin: 0 $text-loading-animation-rotate-size;
        padding: 0;
        background-color: transparent;
        transform: scale(1.2);
      }

      .item {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        animation: rotating 4s linear infinite;
      }

      .item::after {
        content: '';
        display: block;
        width: $text-loading-animation-item-size;
        height: $text-loading-animation-item-size;
        border-radius: 50%;
        background-color: rgb(214, 213, 213);
      }

      @for $i from 1 through 5 {
        .item:nth-child(#{$i}) {
          animation-delay: $text-loading-animation-delay * $i;
        }
      }

      h2 {
        margin-top: 80px;
        font-size: 1.3125em;
        font-family: 'hywh', sans-serif;
      }
    }
  }
}

@supports not (filter: drop-shadow(0 0 0 #fff)) {
  // 如果浏览器不支持filter就使用移动端的动画
  .loading-default {
    display: none !important;
  }

  .loading-mobile {
    display: inline-block !important;
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

@keyframes rotating {
  // 移动端loading动画逻辑
  75% {
    transform: rotate(600deg);
  }

  79% {
    transform: rotate(720deg);
    opacity: 1;
  }

  80% {
    transform: rotate(720deg);
    opacity: 0;
  }

  100% {
    transform: rotate(810deg);
    opacity: 0;
  }
}

@keyframes loading-bar {
  0% {
    width: 0px;
    background-size: $loading-img-width $loading-img-height;
  }

  16.6% {
  }

  33.2% {
  }

  49.8% {
  }

  66.4% {
  }

  83% {
  }

  100% {
    width: $loading-img-width - 30;
  }
}
</style>
