<template>
  <div class="score">
    <div class="score-container">
      <span class="score-title" role="heading">以上内容对您是否有帮助？</span>
      <div class="rate-container">
        <el-rate
          v-model="value"
          show-text
          class="docs-rate"
          :texts="false"
          :colors="colors"
          @change="tips"
        >
        </el-rate>
      </div>
      <el-button
        class="feedback-btn"
        size="medium"
        plain="true"
        @click="feedback"
      >
        反馈
        <i class="el-icon-arrow-right el-icon--right"></i>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { feedback } from '../utils'
export default defineComponent({
  name: 'Grade',
  setup() {
    return {
      value: ref(null),
      colors: ref(['#99A9BF', '#F7BA2A', '#FF9900']),
      feedback: () => {
        feedback()
      },
      tips: () => {
        ElMessage({
          type: 'success',
          message: '感谢您的反馈！',
          center: true,
        })
      },
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
    a > .feedback-btn {
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
          animation: floating-level 3s linear infinite;
        }
      }
    }
  }
}
</style>
