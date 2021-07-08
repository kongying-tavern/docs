<template>
  <Layout>
    <template #page-top>
      <Anchor v-show="anchor" />
      <Backtop />
    </template>
    <template #page-bottom>
      <footer class="docs-footer page-meta">
        <div class="footer-container" role="presentation">
          <div class="follow-us" role="region" aria-label="社交媒体链接">
            <h4>关注我们</h4>
            <nav>
              <ul>
                <li class="follow-us-item">
                  <a
                    href="https://space.bilibili.com/518076785"
                    target="_blank"
                    title="bilibili"
                  >
                    <svg class="iconfont-icon" aria-hidden="true">
                      <use xlink:href="#docs-bilibili"></use>
                    </svg>
                  </a>
                </li>
                <li class="follow-us-item">
                  <a
                    href="https://github.com/jiazengp/genshinmap-docs/"
                    target="_blank"
                    title="GitHub"
                  >
                    <svg class="iconfont-icon" aria-hidden="true">
                      <use xlink:href="#docs-github"></use>
                    </svg>
                  </a>
                </li>
                <li class="follow-us-item">
                  <a
                    href="https://gitee.com/KYJGYSDT"
                    target="_blank"
                    title="Gitee"
                  >
                    <svg class="iconfont-icon" aria-hidden="true">
                      <use xlink:href="#docs-gitee"></use>
                    </svg>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <Grade />
          <div class="docs-info">Chinese hoyolab Made By Kongying Tavern</div>
        </div>
      </footer>
    </template>
  </Layout>
</template>

<script lang="ts">
import { ref } from 'vue'
import { usePageData, usePageFrontmatter } from '@vuepress/client'
import Layout from '@vuepress/theme-default/lib/client/layouts/Layout.vue'
export default {
  components: {
    Layout,
  },
  setup() {
    const frontmatter = usePageFrontmatter()
    return {
      anchor: ref(frontmatter.value.anchor ?? true),
    }
  },
}
</script>

<style lang="scss">
$follow-us-icon-size: 24px;
$container-border: 1px solid var(--c-border-dark);

.footer-container {
  .follow-us {
    display: flex;
    border-bottom: $container-border;
    h3 {
      font-size: 1.16875em;
      margin-right: 8px;
    }
    nav {
      margin: auto 0;
      ul {
        display: flex;
        list-style: none;
      }
    }
  }

  .directory {
    display: flex;
    flex-wrap: nowrap;
    padding-top: 30px;
    padding-bottom: 15px;
    border-bottom: $container-border;
    .friendlink {
      padding-left: 25px;
      border-left: $container-border;
      ul {
        list-style: none;
        padding-left: 0;
        li {
          float: left;
          font-size: 0.875rem;
          padding: 0 2px;
          margin-bottom: 5px;
          margin-right: 15px;
          a {
            color: var(--text-color);
          }
        }
      }
    }
    .directory-item {
      flex-basis: 20%;
      .directory-heading {
        font-weight: 600;
        margin-bottom: 0.8em;
      }
      ul {
        list-style: none;
        padding-left: 0;
        li > a {
          font-size: 0.875rem;
          line-height: 1.375rem;
          letter-spacing: 0.01562rem;
          color: var(--text-color);
        }
      }
    }
  }
}

.follow-us-item {
  height: $follow-us-icon-size;
  width: $follow-us-icon-size;
  margin-right: $follow-us-icon-size;
  flex: 0 0 auto;
  a > svg {
    color: #202124;
    filter: grayscale(1);
    margin: 0 5px 0 0;
    height: $follow-us-icon-size;
    width: $follow-us-icon-size;
    transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    &:hover {
      filter: grayscale(0);
    }
  }
}

.docs-info {
  display: grid;
  place-items: center;
  padding-top: 20px;
  text-align: center;
}
</style>
