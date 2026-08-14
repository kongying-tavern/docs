import type { FontSubsetConfig, FontSubsetPaths } from './config'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const fontFacePattern = /@font-face\s*\{[^}]*\}/g
const unicodeRangePattern = /unicode-range\s*:/
const standardHashPattern = /font-subset-standard:\s*([a-f0-9]{64})/
const siteHashPattern = /font-subset-site:\s*([a-f0-9]{64})/
const specialRegExpCharacterPattern = /[.*+?^${}()|[\]\\]/g
const trailingSlashPattern = /\/$/

function escapeRegExp(value: string): string {
  return value.replace(specialRegExpCharacterPattern, '\\$&')
}

export class FontArtifacts {
  private readonly fontUrlPattern: RegExp
  private readonly managedFontPattern: RegExp
  private readonly siteFontPattern: RegExp
  private readonly standardFontPattern: RegExp
  private readonly expectedStandardTiers: Set<string>

  constructor(
    private readonly config: FontSubsetConfig,
    private readonly paths: FontSubsetPaths,
  ) {
    const stems = config.fonts.map(font => escapeRegExp(font.fileStem)).join('|')
    const legacyStems = config.fonts.map(font => (
      escapeRegExp(font.fileStem.replaceAll('_', '-'))
    )).join('|')
    const standardTiers = Array.from(
      new Set(config.fonts.flatMap(font => font.standardTiers)),
      escapeRegExp,
    ).join('|')
    const hashLength = config.hashing.fileNameLength
    const extension = escapeRegExp(config.output.extension)
    const publicPath = escapeRegExp(
      config.css.publicFontPath.replace(trailingSlashPattern, ''),
    )

    this.fontUrlPattern = new RegExp(
      `url\\(['"]?${publicPath}/((?:${stems})_[^'")]+\\.${extension})['"]?\\)`,
      'g',
    )
    this.managedFontPattern = new RegExp(
      `^(?:(?:${stems})_.*|(?:${legacyStems})-.*)\\.${extension}$`,
    )
    this.siteFontPattern = new RegExp(
      `^(?:${stems})_min_\\d{2}_[a-f0-9]{${hashLength}}\\.${extension}$`,
    )
    this.standardFontPattern = new RegExp(
      `^(${stems})_(${standardTiers})_\\d{2}_[a-f0-9]{${hashLength}}\\.${extension}$`,
    )
    this.expectedStandardTiers = new Set(
      config.fonts.flatMap(font => (
        font.standardTiers.map(tier => `${font.fileStem}:${tier}`)
      )),
    )
  }

  count(): number {
    return this.allReferences().length
  }

  isCurrent(standardHash: string, siteHash: string): boolean {
    if (!this.cssIsComplete(this.paths.siteCssFile, this.siteFontPattern)
      || !this.standardIsCurrent(standardHash)) {
      return false
    }

    const css = this.readCss(this.paths.siteCssFile)
    return css.match(siteHashPattern)?.[1] === siteHash
      && this.generatedFilesMatchReferences()
  }

  standardIsCurrent(standardHash: string): boolean {
    if (!existsSync(this.paths.fontsDir)
      || !this.cssIsComplete(this.paths.standardCssFile, this.standardFontPattern)) {
      return false
    }

    if (this.readCss(this.paths.standardCssFile).match(standardHashPattern)?.[1] !== standardHash)
      return false

    const referenced = this.references(this.paths.standardCssFile)
    const generated = this.generatedFiles(this.standardFontPattern)
    if (generated.length !== referenced.length
      || !generated.every(file => referenced.includes(file))) {
      return false
    }

    const actualTiers = new Set(
      referenced.flatMap((file) => {
        const match = file.match(this.standardFontPattern)
        return match ? [`${match[1]}:${match[2]}`] : []
      }),
    )
    return actualTiers.size === this.expectedStandardTiers.size
      && [...this.expectedStandardTiers].every(tier => actualTiers.has(tier))
  }

  private readCss(path: string): string {
    return readFileSync(path, 'utf8')
  }

  private references(cssFile: string): string[] {
    if (!existsSync(cssFile))
      return []
    return Array.from(
      this.readCss(cssFile).matchAll(this.fontUrlPattern),
      match => match[1]!,
    )
  }

  private allReferences(): string[] {
    return [
      ...this.references(this.paths.siteCssFile),
      ...this.references(this.paths.standardCssFile),
    ]
  }

  private generatedFiles(pattern: RegExp): string[] {
    if (!existsSync(this.paths.fontsDir))
      return []
    return readdirSync(this.paths.fontsDir).filter(file => pattern.test(file))
  }

  private fontFileIsValid(file: string): boolean {
    const path = resolve(this.paths.fontsDir, file)
    if (!existsSync(path))
      return false

    const hashLength = this.config.hashing.fileNameLength
    const expected = file.slice(
      file.lastIndexOf('_') + 1,
      -`.${this.config.output.extension}`.length,
    )
    const actual = createHash(this.config.hashing.algorithm)
      .update(readFileSync(path))
      .digest('hex')
      .slice(0, hashLength)
    return expected === actual
  }

  private cssIsComplete(cssFile: string, expectedPattern: RegExp): boolean {
    if (!existsSync(cssFile))
      return false

    const fontFaces = this.readCss(cssFile).match(fontFacePattern) ?? []
    const referenced = this.references(cssFile)
    return fontFaces.length > 0
      && fontFaces.length === referenced.length
      && new Set(referenced).size === referenced.length
      && fontFaces.every(rule => unicodeRangePattern.test(rule))
      && referenced.every(file => expectedPattern.test(file))
      && referenced.every(file => this.fontFileIsValid(file))
  }

  private generatedFilesMatchReferences(): boolean {
    const references = this.allReferences()
    const referenced = new Set(references)
    const generated = new Set(this.generatedFiles(this.managedFontPattern))
    return referenced.size === references.length
      && referenced.size === generated.size
      && [...referenced].every(file => generated.has(file))
  }
}
