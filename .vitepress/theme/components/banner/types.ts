export interface BannerItem {
  expiryDate: number
  contentHash: number
  locale: string
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
