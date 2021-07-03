<template>
  <div class="score">
    <div class="score-container">
      <span class="score-title" role="heading">以上内容对您是否有帮助？</span>
      <div class="rate-container">
        <el-rate
          v-model="value"
          class="docs-rate"
          :colors="colors"
          @change="rateChange"
        >
        </el-rate>
      </div>
      <el-button class="feedback-btn" size="medium" @click="feedback">
        反馈
        <i class="el-icon-arrow-right el-icon--right"></i>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick } from 'vue'
import { feedback } from '../utils'

export default defineComponent({
  name: 'Grade',
  setup() {
    return {
      value: ref(null),
      colors: ref(['#99A9BF', '#F7BA2A', '#FF9900']),
      rate: ref(null),
      feedback: () => {
        feedback()
      },
      rateChange: () => {},
    }
  },
})
</script>

<style lang="scss" scoped>
$container-border: 1px solid var(--c-border-dark);

.score {
  display: flex;
  margin-top: 30px;
  padding-bottom: 30px;
  border-bottom: $container-border;
  .score-container {
    margin: auto;
    text-align: center;
    box-sizing: border-box;
    .score-title {
      font-size: 1.35rem;
      font-weight: bold;
    }
    .rate-container {
      display: flex;
      cursor: pointer;
      width: 100%;
      height: 50px;
      margin: 12px 0;
      .docs-rate {
        margin: auto;
        transform: scale(1.4);
      }
    }
    .feedback-btn {
      transform: scale(1.1);
      background-color: transparent;
      border: 1.5px solid var(--c-border-dark);
      border-radius: 8px;
      transition: all 0.3s;
      &:hover {
        & {
          border-color: #409eff !important;
        }
        & > span > i {
          transform: translate3d(5px, 0, 0);
          transition: transform 0.3s;
        }
      }
    }
  }
}
</style>
