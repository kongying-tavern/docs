<template>
  <div class="download-client">
    <div
      v-for="item in list"
      :key="item.name"
      class="download-client-card"
      :aria-label="item.name"
      :style="
        'background:url(' +
        withBase(item.bg) +
        ')no-repeat;background-position: right bottom;background-size: auto 150px;'
      "
    >
      <div class="card-container">
        <header>
          <h3 class="card-name">{{ item.name }}</h3>
          <span class="card-description">{{
            item.disabled ? newFolder : item.version
          }}</span>
        </header>

        <ElButton
          class="card-button"
          title="Download button"
          type="success"
          :disabled="item.disabled"
          @click="download(item.baiduNetdisk, item.googleDrive)"
        >
          {{ item.disabled ? stayTuned : downloadText }}
        </ElButton>

        <div v-if="item.QRCode" class="qrcode-container" aria-label="QRCode">
          <SvgIcon name="qrcode" />
        </div>
        <figure v-if="item.QRCode" class="card-qrcode" aria-label="Scan QRCode">
          <QRCode
            tag="svg"
            :value="item?.baiduNetdisk || item.name"
            :options="{
              width: 150,
              height: 150,
            }"
          ></QRCode>
        </figure>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, h } from 'vue'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'
import { withBase } from '@vuepress/client'
import { ElMessageBox } from 'element-plus'
import { useClipboard, useMediaQuery } from '@vueuse/core'
import { ElMessage } from 'element-plus'

import type { ThemeLocaleData } from '../shared'

export default defineComponent({
  name: 'DownloadClient',
  setup() {
    const { copy, isSupported } = useClipboard()
    const isSmallScreen = useMediaQuery('(max-width: 730px)')
    const themeLocaleData = useThemeLocaleData<ThemeLocaleData>()
    const list = ref([
      {
        name: 'Windows',
        version: 'v1.11.1_beta',
        QRCode: false,
        disabled: false,
        bg: '/20210710/8f6ce2c16420c33e970c1efd524cda04.png',
        baiduNetdisk: 'https://pan.baidu.com/s/1t_FRadAiGHGxw1YvvWt0bg',
        googleDrive:
          'https://drive.google.com/drive/folders/1ade5zOu14oMIJlwaJd0qf-S_xdH9pkSa?usp=sharing',
      },
      {
        name: 'Android',
        version: '',
        QRCode: true,
        disabled: true,
        bg: '/20210710/52044112edc51a91234e025fc03320bc.png',
        baiduNetdisk: '',
        googleDrive: '',
      },
      {
        name: 'iPhone',
        version: '',
        QRCode: true,
        disabled: true,
        bg: '/20210710/61fa5ac2e828fc55337cd473d0b728f4.png',
        baiduNetdisk: '',
        googleDrive: '',
      },
      {
        name: 'macOS',
        version: '',
        disabled: true,
        bg: '/20210710/fe5de467ccd8445e0273fdd0b4ecabf5.png',
        baiduNetdisk: '',
        googleDrive: '',
      },
      {
        name: 'iPad',
        version: '',
        disabled: true,
        bg: '/20210710/b735765c5e121efc0ea5bcd839051971.png',
        baiduNetdisk: '',
        googleDrive: '',
      },
      {
        name: 'WeChat Applet ',
        version: '',
        disabled: true,
        bg: '/20210710/b735765c5e121efc0ea5bcd839051972.png',
        baiduNetdisk: '',
        googleDrive: '',
      },
    ])
    const download = function (
      baiduNetdisk: string,
      googleDrive: string
    ): void {
      ElMessageBox({
        center: true,
        showClose: false,
        showCancelButton: false,
        showConfirmButton: false,
        closeOnPressEscape: true,
        closeOnClickModal: true,
        dangerouslyUseHTMLString: true,
        title: themeLocaleData.value.selectDownloadMethod,
        message: h(
          'ul',
          { class: 'download-list', style: `text-align: left;` },
          [
            h(
              'li',
              {
                class: 'download-item',
              },
              [
                h('strong', '加入讨论组：\n'),
                h(
                  'a',
                  {
                    'href': './communication-group.html',
                    'aria-label': 'communicationGroup download link',
                  },
                  'https://yuanshen.site/docs/communication-group.html'
                ),
              ]
            ),
            h(
              'li',
              {
                class: 'download-item baidu-netdisk',
              },
              [
                h('strong', '百度网盘（提取码：KYJG，点击链接复制）：'),
                h(
                  'a',
                  {
                    'href': 'javascript:void(0)',
                    'aria-label': 'baiduNetdisk download link',
                    'onClick': () => {
                      if (isSupported) {
                        document.documentElement.focus()
                        copy('KYJG')
                        ElMessage.success({
                          message:
                            themeLocaleData.value.extractionCode +
                            themeLocaleData.value.copySuccess,
                          duration: 2000,
                          center: true,
                          type: 'success',
                        })
                      } else {
                        ElMessage({
                          message:
                            themeLocaleData.value.extractionCode +
                            themeLocaleData.value.notSupportReplication,
                          duration: 2000,
                          center: true,
                        })
                      }
                      window.open(
                        baiduNetdisk,
                        isSmallScreen.value ? '百度网盘' : '_black',
                        isSmallScreen.value
                          ? ''
                          : 'resizable,scrollbars,status,width=500,height=500'
                      )
                    },
                  },
                  baiduNetdisk
                ),
              ]
            ),
            h(
              'li',
              {
                class: 'download-item',
              },
              [
                h('strong', 'Google Drive：'),
                h(
                  'a',
                  {
                    'href': googleDrive,
                    'rel': 'noopener noreferrer',
                    'target': '_blank',
                    'aria-label': 'googleDrive download link',
                  },
                  googleDrive
                ),
              ]
            ),
          ]
        ),
      }).catch((e) => {
        console.log(e, isSmallScreen.value)
      })
    }
    return {
      list,
      download,
      withBase,
      downloadText: themeLocaleData.value.download,
      newFolder: themeLocaleData.value.newFolder,
      stayTuned: themeLocaleData.value.stayTuned,
    }
  },
})
</script>

<style lang="scss" scoped>
@import '../styles/config';

$qrcode-btn-size: 36px;

@mixin center() {
  display: grid;
  place-items: center;
}

@media only screen and (max-width: $mobile) {
  .download-client {
    flex-direction: column;
    align-items: center;
  }
  .download-client-card {
    margin: 16px 0 !important;
  }
}
.download-client {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  margin: 50px auto;
  .download-client-card {
    position: relative;
    width: 320px;
    height: 200px;
    border: 1px solid var(--c-border);
    border-radius: 8px;
    margin: 16px;
    box-sizing: border-box;
    overflow: hidden;

    .card-container {
      width: 100%;
      height: 100%;
      padding: 24px 0 0 24px;
      .qrcode-container {
        @include center();
        position: absolute;
        right: 0;
        top: 0;
        width: $qrcode-btn-size;
        height: $qrcode-btn-size;
        &:hover {
          color: var(--accent-color);
          opacity: 1;
        }
        svg {
          z-index: 1;
          font-size: 1.3em;
          opacity: 0.85;
        }
      }
      header {
        .card-name {
          display: inline-block;
          line-height: 32px;
          margin: 0 8px 0 0;
        }
        .card-description {
          opacity: 0;
          color: #8e8e8e;
          font-size: 14px;
          line-height: 24px;
          transition: opacity 0.2s;
        }
      }
      .card-button {
        position: absolute;
        left: 24px;
        bottom: 24px;
        width: auto;
        background-color: var(--c-brand);
        border: none;
        &:hover {
          background-color: var(--c-brand-light);
        }
        &.is-disabled {
          opacity: 0.65;
        }
      }
      .card-qrcode {
        @include center();
        z-index: -1;
        position: absolute;
        width: 100%;
        height: 100%;
        left: 50%;
        top: 50%;
        opacity: 0;
        margin: 0;
        transform: translate(-50%, -50%) translateY(-100%);
        transition: all 0.3s;
      }
    }
  }
}

.download-client-card:hover .card-description {
  opacity: 1 !important;
}

.download-client-card:hover .qrcode-container:hover {
  z-index: 99999999;
  width: 1000px;
  height: 1000px;
  background: transparent;
}

.download-client-card:hover .qrcode-container:hover ~ .card-qrcode {
  z-index: 1;
  opacity: 1;
  backdrop-filter: saturate(180%) blur(20px);
  transform: translate(-50%, -50%) translateY(0);
}
</style>
