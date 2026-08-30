import type { FontSubsetConfig } from './config'

export const fontBuildManifestVersion = 2

export function createFontBuildManifest(config: FontSubsetConfig) {
  return {
    version: fontBuildManifestVersion,
    paths: {
      fontsDir: config.paths.fontsDir,
      siteCssFile: config.paths.siteCssFile,
      sourceDir: config.paths.sourceDir,
      standardCssFile: config.paths.standardCssFile,
    },
    output: config.output,
    fileHashLength: config.hashing.fileNameLength,
    chunking: {
      siteCharactersPerChunk: Math.floor(
        config.chunking.siteTargetBytes / config.chunking.estimatedBytesPerCharacter,
      ),
      standardCharactersPerChunk: config.chunking.standardCharactersPerChunk,
    },
    css: config.css,
    siteCharacters: config.siteCharacters,
    fonts: config.fonts.map(font => ({
      cssFamily: font.cssFamily,
      family: font.family,
      fileStem: font.fileStem,
      sourceFile: font.sourceFile,
      scriptTiers: font.scriptTiers,
      standardTiers: font.standardTiers,
    })),
    characters: {
      expectedLevelSizes: config.characters.expectedLevelSizes,
      levels: config.characters.levels,
      priorityBuckets: config.characters.slicing.priorityBuckets,
    },
    scripts: config.scripts.sets,
  }
}
