<template>
  <div class="score">
    <div class="score-container">
      <span ref="scoreTitle" class="score-title" role="heading">{{
        text
      }}</span>
      <div class="rate-container">
        <ElRate
          v-model="value"
          :disabled="isDisabled"
          class="docs-rate"
          :colors="colors"
          @change="rateChange"
        >
        </ElRate>
      </div>
      <ElButton
        class="feedback-btn"
        aria-label="Feedback button"
        size="medium"
        @click.stop="feedback"
      >
        {{ feedbackText }}
        <i class="el-icon-arrow-right el-icon--right"></i>
      </ElButton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { feedback } from '../utils'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'
import { ElMessage } from 'element-plus'

import type { ThemeData } from '../shared'

export default defineComponent({
  name: 'Grade',
  setup() {
    const themeLocaleData = useThemeLocaleData<ThemeData>()
    const value = ref(null)
    const isDisabled = ref(false)
    const scoreTitle = ref(null)
    value.value = null
    return {
      value,
      isDisabled,
      scoreTitle,
      colors: ref(['#99A9BF', '#F7BA2A', '#FF9900']),
      rate: ref(null),
      feedback: (): void => feedback(),
      rateChange: (): void => {
        console.log('Score:', value.value)
        isDisabled.value = true
        ElMessage.success({
          message: themeLocaleData.value.thankFeedback,
          center: true,
          showClose: true,
          duration: 3000,
          type: 'success',
        })
      },
      text: themeLocaleData.value.grade,
      feedbackText: themeLocaleData.value.feedback,
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
          border-color: var(--c-brand);
          color: var(--c-brand);
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
