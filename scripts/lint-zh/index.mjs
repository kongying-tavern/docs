/**
 * zh 文档的中文排版检查。
 *
 * 用项目 Markdown 渲染器的 token 流提取可见文本（见 extract.mjs），
 * 再按"块元素"边界逐块交给 zhlint：
 * - 块内片段连续拼接，跨链接等语法标记的规则（如链接左右空格）仍能触发；
 * - 行内 / 块级 MDC 组件各自成块，组件渲染出的 div/span 不会和相邻正文
 *   拼成一句话，避免误删组件前的空格而破坏语法；
 * - 组件属性是否纳入检查由组件真实渲染结果决定，不按属性名猜测；
 *
 * 每块独立 diff 并映射回原文偏移。块通常只有一段话，LCS 规模很小；
 * 不做全文 diff，避免长文档上 O(n*m) 退化。
 */
import { globSync, readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { report, run } from 'zhlint'
import { closeExtractRenderer, extractBlocks } from './extract.mjs'
import { createLintZhOptions } from './options.mjs'

const fix = process.argv.includes('--fix')
const options = createLintZhOptions()

/** LCS diff，把相邻的删除 + 插入合并成同一锚点的替换。 */
function diffOps(a, b) {
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const raw = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      raw.push({ type: 'keep', pos: i })
      i++
      j++
    }
    else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ type: 'del', pos: i })
      i++
    }
    else {
      raw.push({ type: 'ins', pos: i, ch: b[j] })
      j++
    }
  }
  while (i < n) raw.push({ type: 'del', pos: i++ })
  while (j < m) raw.push({ type: 'ins', pos: n, ch: b[j++] })

  const ops = []
  let current = null
  for (const op of raw) {
    if (op.type === 'keep') {
      current = null
      continue
    }
    if (!current) {
      current = { pos: op.pos, del: 0, ins: '' }
      ops.push(current)
    }
    if (op.type === 'del')
      current.del++
    else current.ins += op.ch
  }
  return ops
}

/** 检查文本位置 → 原文偏移；末尾插入落在最后一个字符之后。 */
function toSourcePos(charMap, checkPos) {
  if (checkPos < charMap.length)
    return charMap[checkPos]
  return charMap.length ? charMap[charMap.length - 1] + 1 : 0
}

const resultList = []
try {
  for (const file of globSync('pages/zh/**/*.md')) {
    console.log(`[start] ${file}`)
    const origin = readFileSync(file, { encoding: 'utf8' })
    const blocks = await extractBlocks(origin)

    // 块间用 \n 拼接后整体检查：块边界的语义让 zhlint 不去拼合相邻块，
    // 同时块内仍是连续正文，跨链接标记的规则照常触发。
    // zhlint 不增删换行，因此 result 可以按 \n 切回各块。
    const checkText = blocks.map(block => block.checkText).join('\n')
    const globalCharMap = []
    blocks.forEach((block, index) => {
      if (index)
        globalCharMap.push(-1)
      globalCharMap.push(...block.charMap)
    })

    const { result: lintResult, validations: rawValidations } = run(checkText, options)
    const resultLines = lintResult.split('\n')

    const validations = rawValidations.map(validation => ({
      ...validation,
      index: toSourcePos(globalCharMap, validation.index),
    }))

    /** @type {Array<{ pos: number, del: number, ins: string }>} */
    const edits = []
    blocks.forEach((block, index) => {
      const fixedLine = resultLines[index] ?? block.checkText
      for (const op of diffOps(block.checkText, fixedLine)) {
        edits.push({
          pos: toSourcePos(block.charMap, op.pos),
          del: op.del,
          ins: op.ins,
        })
      }
    })

    const chars = origin.split('')
    for (const edit of edits.sort((a, b) => b.pos - a.pos))
      chars.splice(edit.pos, edit.del, edit.ins)
    const result = chars.join('')

    resultList.push({ file, origin, result, validations })
  }
}
finally {
  await closeExtractRenderer()
}

const exitCode = report(resultList)

if (fix) {
  resultList.forEach(({ file, origin, result }) => {
    if (origin !== result)
      writeFileSync(file, result)
  })
}
else if (exitCode) {
  process.exit(exitCode)
}
