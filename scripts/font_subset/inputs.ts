import type { FontSubsetConfig } from './config'
import type { SiteFontCodepoints } from './files'
import { resolve } from 'node:path'
import { resolveFontSubsetPaths } from './config'
import { collectFiles } from './files'
import { calculateHash } from './hash'
import { fontBuildManifestVersion } from './manifest'

export function calculateFontInputHashes(
  projectRoot: string,
  config: FontSubsetConfig,
  codepoints: SiteFontCodepoints,
) {
  const paths = resolveFontSubsetPaths(projectRoot, config)
  const pythonInputs = [
    paths.pythonEntry,
    paths.requirements,
    ...collectFiles(paths.pythonPackage, new Set(['.py'])),
    ...config.fonts.map(font => resolve(paths.sourceDir, font.sourceFile)),
  ]

  return {
    standardHash: calculateHash(
      projectRoot,
      config.hashing.standardNamespace,
      pythonInputs,
      {
        version: config.version,
        manifestVersion: fontBuildManifestVersion,
        fileNameLength: config.hashing.fileNameLength,
        chunking: {
          standardCharactersPerChunk: config.chunking.standardCharactersPerChunk,
        },
        output: config.output,
        css: config.css,
        fonts: config.fonts.map(font => ({
          fileStem: font.fileStem,
          fontWeight: font.fontWeight,
          sourceFile: font.sourceFile,
          scriptTiers: font.scriptTiers,
          standardTiers: font.standardTiers,
        })),
        characters: {
          expectedLevelSizes: config.characters.expectedLevelSizes,
          source: config.characters.source,
          slicing: config.characters.slicing,
          levels: config.characters.levels,
        },
        scripts: config.scripts,
      },
    ),
    siteHash: calculateHash(
      projectRoot,
      config.hashing.siteNamespace,
      pythonInputs,
      {
        version: config.version,
        manifestVersion: fontBuildManifestVersion,
        fileNameLength: config.hashing.fileNameLength,
        chunking: {
          siteTargetBytes: config.chunking.siteTargetBytes,
          estimatedBytesPerCharacter: config.chunking.estimatedBytesPerCharacter,
        },
        output: config.output,
        css: config.css,
        fonts: config.fonts,
        scan: config.scan,
        siteCharacters: config.siteCharacters,
        codepoints: Object.fromEntries(Object.entries(codepoints).map(
          ([font, values]) => [font, values.map(codepoint => codepoint.toString(16))],
        )),
      },
    ),
  }
}
