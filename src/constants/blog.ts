/**
 * 博客列表的固定排列顺序，按语言区分。
 * 值为博客文章路径的最后一段（不带语言前缀），例如 `changelog-client`。
 * 未在该配置中的文章排在最后，并按发布日期倒序。
 */
export const BLOG_POST_ORDER: Record<string, string[]> = {
  zh: [
    'hotupdatelog-client',
    'changelog-web',
    'hotupdatelog-autotrack',
    'changelog-client',
    'changelog-autotrack',
  ],
  en: [
    'changelog-client',
    'hotupdatelog-client',
    'changelog-web',
  ],
}
