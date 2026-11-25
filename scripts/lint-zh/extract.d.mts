export interface ExtractedBlock {
  checkText: string
  charMap: number[]
}

export function extractBlocks(src: string): Promise<ExtractedBlock[]>

export function closeExtractRenderer(): Promise<void>
