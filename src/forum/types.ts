/**
 * 全仓唯一允许的反向依赖出口：消息类型契约的所有权在 .vitepress/locales
 * （词条文件本身必须留在平台层），src 侧一律经由本桶导入，禁止再写
 * `../../../.vitepress/...` 这类跨根目录相对路径。
 */
export type { CustomConfig, CustomConstant, LocaleConfigShape, LocaleTextConfig } from '../../.vitepress/locales/types'
