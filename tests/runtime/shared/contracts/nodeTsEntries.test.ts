import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import ts from 'typescript'
import { test } from 'vitest'
import { collectNodeEntries, findCjsGlobals, findDecoratorNodes, findJsonImports, nodeResolves } from '../../../../scripts/typecheckNodeEntries.ts'

interface PackageJson {
  scripts: Record<string, string>
}

function realScripts(): Record<string, string> {
  const { scripts } = JSON.parse(
    readFileSync(new URL('../../../../package.json', import.meta.url), 'utf8'),
  ) as PackageJson
  return scripts
}

test('collects the .ts file node runs, with flags around it', () => {
  assert.deepEqual(
    collectNodeEntries({ fix: 'node scripts/lint-zh/index.ts --fix' }),
    ['scripts/lint-zh/index.ts'],
  )
  assert.deepEqual(
    collectNodeEntries({ lintMd: 'node scripts/lintMd.ts' }),
    ['scripts/lintMd.ts'],
  )
  assert.deepEqual(
    collectNodeEntries({ watch: 'node --enable-source-maps ./scripts/a.ts' }),
    ['./scripts/a.ts'],
  )
  assert.deepEqual(
    collectNodeEntries({ chained: 'pnpm clean && node scripts/b.ts' }),
    ['scripts/b.ts'],
  )
})

test('ignores inline scripts, .mjs entry points and tsx', () => {
  assert.deepEqual(collectNodeEntries({
    clean: 'node -e "require(\'node:fs\').rmSync(\'./dist\')"',
    buildFonts: 'tsx ./scripts/buildFonts.ts',
    testUi: 'node --test tests/harness/a/browser.test.mjs',
  }), [])
})

test('resolves # imports natively and rejects tsconfig aliases', () => {
  assert.equal(nodeResolves('../x.ts'), true)
  assert.equal(nodeResolves('vite'), true)
  assert.equal(nodeResolves('@vitejs/plugin-vue'), true)
  // `#` 前缀镜像在 package.json 的 imports 里，Node 自己就能解析。
  assert.equal(nodeResolves('#data/x.ts'), true)
  assert.equal(nodeResolves('@theme/components/ui.ts'), false)
  assert.equal(nodeResolves('~/config/markdown.ts'), false)
  assert.equal(nodeResolves('@/src/constants/site.ts'), false)
})

test('finds decorators, which erasableSyntaxOnly lets through', () => {
  const sourceFile = ts.createSourceFile(
    'probe.ts',
    [
      'function dec(_v: unknown): void {}',
      '@dec',
      'class Decorated {',
      '  @dec method(): void {}',
      '}',
      'class Plain {}',
    ].join('\n'),
    ts.ScriptTarget.ESNext,
    true,
  )
  assert.equal(findDecoratorNodes(sourceFile).length, 2)
})

test('rejects .json imports that miss the type attribute', () => {
  const parse = (text: string) => ts.createSourceFile('probe.ts', text, ts.ScriptTarget.ESNext, true)

  assert.deepEqual(findJsonImports(parse(`import data from './a.json'`)).map(node => node.text), ['./a.json'])
  assert.deepEqual(findJsonImports(parse(`import data from './a.json' with { type: 'json' }`)), [])
  assert.deepEqual(findJsonImports(parse(`const data = import('./a.json')`)).map(node => node.text), ['./a.json'])
  assert.deepEqual(findJsonImports(parse(`import data from './a.ts'`)), [])
  // 类型导入会被擦掉，运行时不存在这次加载。
  assert.deepEqual(findJsonImports(parse(`import type data from './a.json'`)), [])
})

test('rejects CommonJS globals that only exist in @types/node', () => {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: ['node'],
    noEmit: true,
  }

  /** 用内存里的单文件 program 拿到真实 checker，`@types/node` 从仓库依赖解析。 */
  const probe = (text: string): string[] => {
    const host = ts.createCompilerHost(options)
    const name = 'probe.ts'
    const getSourceFile = host.getSourceFile.bind(host)
    host.getSourceFile = (fileName, languageVersion) =>
      fileName === name
        ? ts.createSourceFile(name, text, languageVersion, true)
        : getSourceFile(fileName, languageVersion)
    const program = ts.createProgram([name], options, host)
    const file = program.getSourceFile(name)
    assert.ok(file, 'probe file should be in the program')
    return findCjsGlobals(program, file).map(node => node.text)
  }

  assert.deepEqual(probe(`console.log(__dirname, require('node:fs'))`), ['__dirname', 'require'])
  // 同名本地声明、属性名与参数都不是全局引用，不能误报。
  assert.deepEqual(probe(`const module = { exports: 1 }\nconsole.log(module.exports)`), [])
  assert.deepEqual(probe(`const box = { module: 1 }\nconsole.log(box.module)`), [])
  assert.deepEqual(probe(`function read(module: string): string { return module }`), [])
}, 60000)

test('resolves every collected entry to a file on disk', () => {
  const entries = collectNodeEntries(realScripts())
  assert.ok(entries.length > 0, 'expected at least one `node *.ts` script')
  for (const entry of entries)
    assert.ok(existsSync(new URL(`../../../../${entry}`, import.meta.url)), `${entry} does not exist`)
})
