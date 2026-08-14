import { readFileSync } from 'node:fs'
import { posix, resolve, win32 } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const parentPathSegment = /(?:^|[\\/])\.\.(?:[\\/]|$)/
const relativePath = z
  .string()
  .min(1)
  .refine(value => !posix.isAbsolute(value) && !win32.isAbsolute(value), {
    message: 'Must be relative to the project root',
  })
  .refine(value => !parentPathSegment.test(value), {
    message: 'Must not traverse outside its configured directory',
  })
const codepoint = z.number().int().min(0).max(0x10FFFF)
const codepointRange = z.tuple([codepoint, codepoint]).refine(
  ([start, end]) => start <= end,
  { message: 'Unicode range start must not exceed its end' },
)
const pythonCandidate = z.object({
  command: z.string().min(1),
  args: z.array(z.string()),
})
const pythonModule = z.string().regex(/^[a-z_]\w*(?:\.[a-z_]\w*)*$/i)
const fontTier = z.enum(['l1', 'l2l3'])
const fontRole = z.string().regex(/^[a-z][a-z0-9-]*$/)
const extension = z.string().regex(/^\.[a-z0-9]+$/)
const slicingSchema = z.object({
  source: z.string().min(1),
  url: z.url(),
  license: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  order: z.literal('highest-to-lowest'),
  upstreamBucketCount: z.number().int().positive(),
  priorityBuckets: z.array(z.string().min(1)).min(1),
})
const charactersSchema = z.object({
  expectedLevelSizes: z.object({
    l1: z.number().int().positive(),
    l2: z.number().int().positive(),
    l3: z.number().int().positive(),
  }),
  source: z.string().min(1),
  slicingFile: relativePath,
  levels: z.object({
    l1: z.string().min(1),
    l2: z.string().min(1),
    l3: z.string().min(1),
  }),
})

const configSchema = z.object({
  version: z.literal(1),
  paths: z.object({
    fontsDir: relativePath,
    siteCssFile: relativePath,
    standardCssFile: relativePath,
    sourceDir: relativePath,
    pythonEntry: relativePath,
    pythonPackage: relativePath,
    requirements: relativePath,
  }),
  scan: z.array(z.object({
    path: relativePath,
    extensions: z.array(extension).min(1),
  })).min(1),
  siteExtraction: z.object({
    roles: z.array(fontRole).min(1),
    defaultRole: fontRole,
    sharedRole: fontRole,
    extensions: z.object({
      markdown: z.array(extension),
      vue: z.array(extension),
      script: z.array(extension),
      json: z.array(extension),
    }),
    tagRoles: z.record(z.string().min(1), fontRole),
    classRoles: z.record(z.string().min(1), fontRole),
    fontVariableRoles: z.record(z.string().min(1), fontRole),
    frontmatterRoles: z.record(z.string().min(1), fontRole),
    textAttributes: z.array(z.string().min(1)),
  }),
  python: z.object({
    requiredModules: z.array(pythonModule).min(1),
    candidates: z.array(pythonCandidate).min(1),
  }),
  hashing: z.object({
    algorithm: z.literal('sha256'),
    fileNameLength: z.number().int().min(8).max(64),
    standardNamespace: z.string().min(1),
    siteNamespace: z.string().min(1),
  }),
  chunking: z.object({
    siteTargetBytes: z.number().int().positive(),
    estimatedBytesPerCharacter: z.number().int().positive(),
    standardCharactersPerChunk: z.number().int().positive(),
  }),
  output: z.object({
    extension: z.literal('woff2'),
    format: z.literal('woff2'),
  }),
  css: z.object({
    publicFontPath: z.string().startsWith('/'),
    fontStyle: z.string().min(1),
    fontWeight: z.number().int().positive(),
    fontDisplay: z.string().min(1),
    localFallback: z.string().min(1),
  }),
  fontaine: z.object({
    cssEntry: relativePath,
    fallbackNameSuffix: z.string().trim().min(1),
    fallbacks: z.array(z.string().trim().min(1)).min(1),
  }),
  siteCharacters: z.object({
    minimumCodepoint: codepoint,
    excludedRanges: z.array(codepointRange),
    extraRanges: z.array(codepointRange),
    extraCodepoints: z.array(codepoint),
  }),
  fonts: z.array(z.object({
    family: z.string().min(1),
    cssFamily: z.string().min(1),
    fileStem: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
    sourceFile: relativePath,
    standardTiers: z.array(fontTier).min(1),
    siteRoles: z.array(fontRole).min(1),
  })).min(1),
  charactersFile: relativePath,
}).superRefine((config, context) => {
  if (config.paths.siteCssFile === config.paths.standardCssFile) {
    context.addIssue({
      code: 'custom',
      message: 'Site and standard fonts must use different CSS outputs',
      path: ['paths'],
    })
  }

  if (config.paths.fontsDir === config.paths.sourceDir) {
    context.addIssue({
      code: 'custom',
      message: 'Font output and source directories must be different',
      path: ['paths'],
    })
  }

  if (config.chunking.siteTargetBytes < config.chunking.estimatedBytesPerCharacter) {
    context.addIssue({
      code: 'custom',
      message: 'Site chunk settings must accommodate at least one character',
      path: ['chunking'],
    })
  }

  for (const key of ['family', 'cssFamily', 'fileStem', 'sourceFile'] as const) {
    const values = config.fonts.map(font => font[key])
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: 'custom',
        message: `fonts.${key} values must be unique`,
        path: ['fonts'],
      })
    }
  }

  if (new Set(config.fontaine.fallbacks).size !== config.fontaine.fallbacks.length) {
    context.addIssue({
      code: 'custom',
      message: 'fontaine.fallbacks values must be unique',
      path: ['fontaine', 'fallbacks'],
    })
  }

  const roles = new Set(config.siteExtraction.roles)
  if (roles.size !== config.siteExtraction.roles.length) {
    context.addIssue({
      code: 'custom',
      message: 'siteExtraction.roles values must be unique',
      path: ['siteExtraction', 'roles'],
    })
  }

  const referencedRoles = [
    config.siteExtraction.defaultRole,
    config.siteExtraction.sharedRole,
    ...Object.values(config.siteExtraction.tagRoles),
    ...Object.values(config.siteExtraction.classRoles),
    ...Object.values(config.siteExtraction.fontVariableRoles),
    ...Object.values(config.siteExtraction.frontmatterRoles),
    ...config.fonts.flatMap(font => font.siteRoles),
  ]
  for (const role of referencedRoles) {
    if (!roles.has(role)) {
      context.addIssue({
        code: 'custom',
        message: `Referenced font role is not declared: ${role}`,
        path: ['siteExtraction'],
      })
    }
  }

  const extensionGroups = Object.values(config.siteExtraction.extensions)
  const configuredExtensions = extensionGroups.flat()
  if (new Set(configuredExtensions).size !== configuredExtensions.length) {
    context.addIssue({
      code: 'custom',
      message: 'File extensions must not appear in multiple extractors',
      path: ['siteExtraction', 'extensions'],
    })
  }
  const knownExtensions = new Set(configuredExtensions)
  for (const [index, entry] of config.scan.entries()) {
    for (const value of entry.extensions) {
      if (!knownExtensions.has(value)) {
        context.addIssue({
          code: 'custom',
          message: `No character extractor is configured for ${value}`,
          path: ['scan', index, 'extensions'],
        })
      }
    }
  }
})

type FontSubsetConfigDocument = z.infer<typeof configSchema>
export type FontSubsetConfig = FontSubsetConfigDocument & {
  characters: z.infer<typeof charactersSchema> & {
    slicing: z.infer<typeof slicingSchema>
  }
}
export type FontRole = FontSubsetConfig['siteExtraction']['roles'][number]
export type PythonEnvironment = FontSubsetConfig['python']['candidates'][number]

export interface FontSubsetPaths {
  fontsDir: string
  pythonEntry: string
  pythonPackage: string
  requirements: string
  siteCssFile: string
  sourceDir: string
  standardCssFile: string
}

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
export const configFile = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../fonts/font-subset.config.json',
)

export function loadFontSubsetConfig(): FontSubsetConfig {
  const input: unknown = JSON.parse(readFileSync(configFile, 'utf8'))
  const document = configSchema.parse(input)
  const charactersFile = resolve(projectRoot, document.charactersFile)
  const charactersInput: unknown = JSON.parse(readFileSync(charactersFile, 'utf8'))
  const characters = charactersSchema.parse(charactersInput)
  const slicingFile = resolve(projectRoot, characters.slicingFile)
  const slicingInput: unknown = JSON.parse(readFileSync(slicingFile, 'utf8'))

  return {
    ...document,
    characters: {
      ...characters,
      slicing: slicingSchema.parse(slicingInput),
    },
  }
}

export function resolveFontSubsetPaths(
  projectRoot: string,
  config: FontSubsetConfig,
): FontSubsetPaths {
  const fromRoot = (path: string) => resolve(projectRoot, path)
  return {
    fontsDir: fromRoot(config.paths.fontsDir),
    pythonEntry: fromRoot(config.paths.pythonEntry),
    pythonPackage: fromRoot(config.paths.pythonPackage),
    requirements: fromRoot(config.paths.requirements),
    siteCssFile: fromRoot(config.paths.siteCssFile),
    sourceDir: fromRoot(config.paths.sourceDir),
    standardCssFile: fromRoot(config.paths.standardCssFile),
  }
}
