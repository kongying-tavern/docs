<template>
  <Layout>
    <template #page-top>
      <Toc v-show="anchor" class="docs-anchor" />
      <el-tooltip
        effect="dark"
        :enterable="false"
        content="回到顶部"
        placement="left-start"
      >
        <el-backtop :visibility-height="200" :right="50" class="docs-backtop">
          <svg class="iconfont-icon" aria-hidden="true" style="width: 28px">
            <use xlink:href="#docs-gotop"></use>
          </svg>
        </el-backtop>
      </el-tooltip>
    </template>
    <template #page-bottom>
      <footer class="docs-footer page-meta">
        <div class="footer-container" role="presentation">
          <div class="follow-us" role="region" aria-label="社交媒体链接">
            <h3>关注我们</h3>
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
                    href="https://github.com/yuanshenmap"
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
          <div class="score">
            <div class="score-container">
              <span class="score-title" role="heading"
                >以上内容对您是否有帮助？</span
              >
              <div class="rate-container">
                <el-rate
                  show-text
                  class="docs-rate"
                  v-model="value"
                  @change="tips"
                  :texts="false"
                  :colors="colors"
                >
                </el-rate>
              </div>
              <a href="https://support.qq.com/products/321980/">
                <el-button class="feedback-btn" size="medium" plain="true">
                  反馈
                  <i class="el-icon-arrow-right el-icon--right"></i>
                </el-button>
              </a>
            </div>
          </div>
          <nav
            class="directory"
            aria-label="原神地图网站目录"
            role="navigation"
          >
            <div class="directory-item">
              <div class="directory-heading" role="heading" aria-label="4">
                了解我们
              </div>
              <ul>
                <li>
                  <a href="https://support.qq.com/products/321980/team/"
                    >关于我们</a
                  >
                </li>
                <li>
                  <a href="https://yuanshen.site/docs/join.html">加入我们</a>
                </li>
                <li>
                  <a href="https://yuanshen.site/docs/support-us.html"
                    >赞助我们</a
                  >
                </li>
              </ul>
            </div>
            <div class="directory-item">
              <div class="directory-heading" role="heading" aria-label="4">
                相关信息
              </div>
              <ul>
                <li>
                  <a href="https://yuanshen.site/docs/privacy.html">隐私政策</a>
                </li>
                <li>
                  <a href="https://yuanshen.site/docs/disclaimer.html"
                    >免责声明</a
                  >
                </li>
                <li>
                  <a
                    href="https://yuanshen.site/docs/announcement/Identify-fraud.html"
                    >识别诈骗</a
                  >
                </li>
              </ul>
            </div>
            <div class="directory-item">
              <div class="directory-heading" role="heading" aria-label="4">
                开发人员
              </div>
              <ul>
                <li>
                  <a href="https://yuanshen.site/docs/developer/documentation/"
                    >前端文档</a
                  >
                </li>
                <li><a href="#">素材下载</a></li>
                <li>
                  <a
                    href="https://yuanshen.site/docs/developer/documentation/spec/"
                    >文档规范</a
                  >
                </li>
              </ul>
            </div>
            <div class="friendlink">
              <div class="friendlink-heading" role="heading" aria-label="4">
                友情链接
              </div>
              <ul>
                <li>
                  <a
                    href="https://www.mona-uranai.com/"
                    target="_blank"
                    title="莫娜占卜铺"
                    >莫娜占卜铺</a
                  >
                </li>
                <li>
                  <a
                    href="https://genshin.pub/"
                    target="_blank"
                    title="可莉特调"
                    >可莉特调</a
                  >
                </li>
              </ul>
            </div>
          </nav>
          <div class="docs-info">Chinese hoyolab Made By Kongying Tavern</div>
        </div>
      </footer>
    </template>
  </Layout>
</template>

<script>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { usePageData, usePageFrontmatter } from "@vuepress/client";
import Layout from "@vuepress/theme-default/lib/client/layouts/Layout.vue";

export default {
  setup() {
    const frontmatter = usePageFrontmatter();
    return {
      value: ref(null),
      anchor: ref(frontmatter.value.anchor ?? true),
      colors: ref(["#99A9BF", "#F7BA2A", "#FF9900"]),
      tips: () => {
        ElMessage({
          type: "success",
          message: "感谢您的反馈！",
          center: true,
        });
      },
    };
  },
  components: {
    Layout,
  },
};
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

.docs-backtop {
  z-index: 99999;
  display: grid;
  place-items: center;
  background-color: var(--c-bg-light) !important;
  svg > use {
    stroke: red;
  }
}

.docs-anchor {
  position: fixed;
  top: 115px;
  right: 20px;
  ul {
    list-style: none;
    font-size: 12px;
    max-width: 125px;
    min-width: 92px;
    border-left: 1px solid var(--c-border-dark);
    margin: 0;
    li {
      a {
        color: var(--text-color);
      }
      a.router-link-active.active {
        color: var(--c-text-accent);
      }
      &:not(:last-child) {
        margin-bottom: 4px;
      }
      ul {
        display: none;
      }
    }
  }
}

@media only screen and (max-width: 1280px) {
  .docs-anchor {
    display: none;
  }
}

@media only screen and (max-width: 980px) {
  .docs-backtop {
    display: none;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes floating-level {
  25% {
    transform: translateX(4px);
  }
  50%,
  100% {
    transform: translateX(0);
  }
  75% {
    transform: translateX(4px);
  }
}
</style>
