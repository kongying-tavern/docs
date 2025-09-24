export interface BannerItem {
  /** 过期时间戳 */
  expiryDate: number
  /** 内容哈希值 */
  contentHash: number
  /** 语言区域 */
  locale: string
  /** 页面路径 */
  path: string
}

export type PartialBannerItem = Partial<BannerItem>

export class BannerData implements BannerItem {
  constructor(
    public expiryDate: number,
    public contentHash: number,
    public locale: string,
    public path: string,
  ) {}

  static fromPartial(partial: PartialBannerItem): BannerData | null {
    if (!partial.expiryDate || !partial.contentHash || !partial.locale || !partial.path) {
      return null
    }
    return new BannerData(
      partial.expiryDate,
      partial.contentHash,
      partial.locale,
      partial.path,
    )
  }
}
