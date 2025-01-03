<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <div
          class="header border-b border-[var(--vp-c-divider)] flex justify-between"
        >
          <h2 class="font-size-6 py-3">
            {{ message.forum.user.myFeedback.title }}
          </h2>
          <div></div>
        </div>
        <h3 class="w-full text-align-center mt-4" v-if="!userAuth.isTokenValid">
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
          <ForumTopicsList
            :data="data"
            :data-loader="refreshData"
          ></ForumTopicsList>

          <template #fallback>
            <div v-if="loading" class="flex justify-center w-full my-8">
              <ReloadIcon class="w-4 h-4 mr-2 animate-spin v-middle" />
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

<script setup lang="ts">
import { issues } from '@/apis/forum/gitee'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { ReloadIcon } from '@radix-icons/vue'
import { useLocalized } from '@/hooks/useLocalized'
import { ref } from 'vue'
import { useLoadMore } from '../../../composables/useLoadMore'
import ForumAside from '../ForumAside.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import ForumLayout from '../ForumLayout.vue'

const { message } = useLocalized()

const page = ref(1)
const userAuth = useUserAuthStore()

const { data, runAsync, loading, loadMore, noMore, initialData } = useLoadMore(
  issues.getUserCreatedTopics,
  {
    manual: true,
  },
)

const refreshData = async () => {
  if (!userAuth.isTokenValid) return (location.hash = 'login-alert')

  const data = await runAsync(
    {
      current: page.value,
      sort: 'created',
      pageSize: 50,
    },
    userAuth.accessToken,
  )
}
</script>

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
