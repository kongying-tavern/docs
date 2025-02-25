<script setup lang="ts">
import { issues } from '@/apis/forum/gitee'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import { useLoadMore } from '@/hooks/useLoadMore'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { ReloadIcon } from '@radix-icons/vue'
import { watchOnce } from '@vueuse/core'
import { ref } from 'vue'

import { handleError } from '~/composables/handleError'

import ForumAside from '../ForumAside.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumTopicsList from '../ForumTopicsList.vue'

const { message } = useLocalized()

const page = ref(1)
const userAuth = useUserAuthStore()

const { data, runAsync, loading, error } = useLoadMore(
  issues.getUserCreatedTopics,
  {
    manual: true,
  },
)

async function refreshData() {
  if (!userAuth.isTokenValid)
    return (location.hash = 'login-alert')

  await runAsync({
    current: page.value,
    sort: 'created',
    pageSize: 50,
    filter: null,
  })
}

watchOnce(error, () => {
  handleError(error.value, message)
})
</script>

<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <div
          class="header flex justify-between border-b border-[var(--vp-c-divider)]"
        >
          <h2 class="py-3 font-size-6">
            {{ message.forum.user.myFeedback.title }}
          </h2>
          <div />
        </div>
        <h3 v-if="!userAuth.isTokenValid" class="mt-4 w-full text-align-center">
          <DynamicTextReplacer :data="message.forum.auth.loginToCheck">
            <template #login>
              <a class="vp-link" href="#login-alert">
                [{{ message.forum.auth.login }}]
              </a>
            </template>
          </DynamicTextReplacer>
        </h3>
      </template>

      <template #content>
        <Suspense>
          <ForumTopicsList :data="data" :data-loader="refreshData" />

          <template #fallback>
            <div v-if="loading" class="my-8 w-full flex justify-center">
              <ReloadIcon class="mr-2 h-4 w-4 animate-spin v-middle" />
              <p class="font-size-4 lh-[1]">
                {{ message.ui.button.loading }}
              </p>
            </div>
          </template>
        </Suspense>
      </template>

      <template #aside>
        <ForumAside :show-button="false" />
      </template>
    </ForumLayout>
  </ClientOnly>
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

  .forum-mobile-publish-btn {
    display: none;
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

@media (max-width: 468px) {
  .forum-content {
    width: 85vw;
    margin-right: 1.5rem;
  }
}
</style>
