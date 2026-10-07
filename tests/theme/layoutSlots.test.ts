import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { parse } from 'vue/compiler-sfc'

function slotNames(source: string, forwarded: boolean): Set<string> {
  const { descriptor } = parse(source)
  const nodes = [...(descriptor.template?.ast?.children ?? [])]
  const names = new Set<string>()
  while (nodes.length) {
    const node = nodes.pop()!
    if (node.type !== 1)
      continue
    nodes.push(...node.children)
    for (const prop of node.props) {
      if (forwarded && prop.type === 7 && prop.name === 'slot' && prop.arg?.type === 4)
        names.add(prop.arg.content)
      if (!forwarded && node.tag === 'slot' && prop.type === 6 && prop.name === 'name' && prop.value)
        names.add(prop.value.content)
    }
  }
  return names
}

test('site Layout only fills slots exposed by the installed VitePress theme', () => {
  const used = slotNames(readFileSync('.vitepress/theme/layouts/Layout.vue', 'utf8'), true)
  const available = slotNames(readFileSync('node_modules/vitepress/dist/client/theme-default/Layout.vue', 'utf8'), false)
  assert.ok(used.size > 0)
  assert.ok(available.size > 0)
  for (const name of used)
    assert.ok(available.has(name), `VitePress Layout no longer exposes ${name}`)
})
