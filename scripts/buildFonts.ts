import type { PythonEnvironment } from './font_subset/config'
import type { SiteFontCodepoints } from './font_subset/files'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer } from 'vitepress'
import { markdownConfig } from '../.vitepress/config/markdown'
import { FontArtifacts } from './font_subset/artifacts'
import {
  loadFontSubsetConfig,
  resolveFontSubsetPaths,
} from './font_subset/config'
import { collectFiles, collectSiteCodepoints } from './font_subset/files'
import { calculateHash } from './font_subset/hash'
import {
  createFontBuildManifest,
  fontBuildManifestVersion,
} from './font_subset/manifest'
import { detectPython, runProcess } from './font_subset/process'

const scriptPath = fileURLToPath(import.meta.url)
const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const config = loadFontSubsetConfig()
const paths = resolveFontSubsetPaths(projectRoot, config)
const artifacts = new FontArtifacts(config, paths)

export interface FontBuildLogger {
  info: (message: string) => void
  warn: (message: string) => void
}

const cliLogger: FontBuildLogger = {
  info: message => process.stdout.write(`${message}\n`),
  warn: message => process.stderr.write(`${message}\n`),
}

function forwardOutput(
  logger: FontBuildLogger,
  level: keyof FontBuildLogger,
  output: string,
): void {
  const message = output.trimEnd()
  if (message)
    logger[level](message)
}

const pythonInputs = [
  paths.pythonEntry,
  paths.requirements,
  ...collectFiles(paths.pythonPackage, new Set(['.py'])),
  ...config.fonts.map(font => resolve(paths.sourceDir, font.sourceFile)),
]

function standardHash(): string {
  return calculateHash(
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
        sourceFile: font.sourceFile,
        standardTiers: font.standardTiers,
      })),
      characters: {
        expectedLevelSizes: config.characters.expectedLevelSizes,
        source: config.characters.source,
        slicing: config.characters.slicing,
        levels: config.characters.levels,
      },
    },
  )
}

function siteHash(codepoints: SiteFontCodepoints): string {
  return calculateHash(
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
  )
}

async function generateFonts(
  python: PythonEnvironment,
  codepoints: SiteFontCodepoints,
  standardInputHash: string,
  siteInputHash: string,
  reuseStandard: boolean,
  logger: FontBuildLogger,
): Promise<void> {
  const tempDir = mkdtempSync(join(tmpdir(), 'font-subset-site-'))
  const siteCharsFile = join(tempDir, 'chars.json')
  const manifestFile = join(tempDir, 'manifest.json')
  let stderr = ''
  try {
    writeFileSync(
      siteCharsFile,
      `${JSON.stringify({ version: 1, fonts: Object.fromEntries(
        Object.entries(codepoints).map(([font, values]) => [
          font,
          values.map(codepoint => String.fromCodePoint(codepoint)).join(''),
        ]),
      ) })}\n`,
      'utf8',
    )
    writeFileSync(
      manifestFile,
      `${JSON.stringify(createFontBuildManifest(config))}\n`,
      'utf8',
    )
    const args = [
      ...python.args,
      paths.pythonEntry,
      `--manifest=${manifestFile}`,
      `--site-chars=${siteCharsFile}`,
      `--standard-hash=${standardInputHash}`,
      `--site-hash=${siteInputHash}`,
      ...(reuseStandard ? ['--reuse-standard'] : []),
    ]
    const code = await runProcess(python.command, args, projectRoot, {
      stderr: output => stderr += output,
      stdout: output => forwardOutput(logger, 'info', output),
    })
    if (code !== 0) {
      throw new Error(
        stderr.trim() || `Font subset process failed with exit code ${code}`,
      )
    }
    forwardOutput(logger, 'warn', stderr)
  }
  finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

export async function buildFonts(options: {
  force?: boolean
  logger?: FontBuildLogger
} = {}): Promise<void> {
  const markdown = await createMarkdownRenderer(
    resolve(projectRoot, 'src'),
    markdownConfig,
  )
  const siteCodepoints = await collectSiteCodepoints(projectRoot, config, markdown)
  const standardInputHash = standardHash()
  const siteInputHash = siteHash(siteCodepoints)
  const force = options.force ?? false
  const logger = options.logger ?? cliLogger

  // Fail without the required toolchain even when artifacts are current.
  const python = await detectPython(projectRoot, config.python)
  if (!python) {
    throw new Error(
      `Python 3 with ${config.python.requiredModules.join(' and ')} is required; font generation aborted`,
    )
  }

  if (!force && artifacts.isCurrent(standardInputHash, siteInputHash)) {
    logger.info(`[fonts:subset] cache hit: reusing ${artifacts.count()} generated chunks`)
    return
  }

  const reuseStandard = !force && artifacts.standardIsCurrent(standardInputHash)
  await generateFonts(
    python,
    siteCodepoints,
    standardInputHash,
    siteInputHash,
    reuseStandard,
    logger,
  )
  if (!artifacts.isCurrent(standardInputHash, siteInputHash))
    throw new Error('Font generation completed, but artifact validation failed')
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  buildFonts({ force: process.argv.includes('--force') }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message.startsWith('[fonts:subset]') ? message : `[fonts:subset] error: ${message}`}\n`)
    process.exitCode = 1
  })
}
