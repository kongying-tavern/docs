import type { QaControl } from '../../../../.vitepress/theme/markdown-ext/qa/context.ts'
import { expect, test } from 'vitest'
import { createSSRApp, defineComponent, h, provide, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { installI18n } from '../../../../.vitepress/theme/i18n/index.ts'
import { qaGroupKey } from '../../../../.vitepress/theme/markdown-ext/qa/context.ts'
import Qa from '../../../../.vitepress/theme/markdown-ext/qa/QA.vue'
import QaGroup from '../../../../.vitepress/theme/markdown-ext/qa/QaGroup.vue'
import { useQaGroup } from '../../../../.vitepress/theme/markdown-ext/qa/useQaGroup.ts'
import { useQaGroupControl } from '../../../../.vitepress/theme/markdown-ext/qa/useQaGroupControl.ts'

async function renderGroup(): Promise<string> {
  const app = createSSRApp({
    render: () => h(QaGroup, null, {
      default: () => h(Qa, null, {
        question: () => h('p', 'Question line'),
        answer: () => h('p', 'Answer line'),
      }),
    }),
  })
  await installI18n(app)
  return renderToString(app)
}

function actionTags(html: string): string[] {
  return html.match(/<button[^>]*class="qa-group-action"[^>]*>/g) ?? []
}

test('the group offers an expand-all and a collapse-all action', async () => {
  const html = await renderGroup()

  expect(actionTags(html)).toHaveLength(2)
  expect(actionTags(html).every(tag => tag.includes('type="button"'))).toBe(true)
  expect(html).toContain('全部展开')
  expect(html).toContain('全部折叠')
})

test('the group renders the answers nested inside it', async () => {
  const html = await renderGroup()

  expect(html).toMatch(/<div class="qa-group-body">.*<div class="qa qa-collapsible qa-opened">/)
})

test('setAll only reaches the answers that have a toggle', () => {
  const { register, setAll } = useQaGroup()
  const log: string[] = []

  register({ collapsible: true, setOpened: opened => log.push(`movable:${opened}`) })
  register({ collapsible: false, setOpened: opened => log.push(`fixed:${opened}`) })

  setAll(false)
  setAll(true)

  expect(log).toEqual(['movable:false', 'movable:true'])
})

test('an answer stops answering the group once it unmounts', () => {
  const { register, unregister, setAll } = useQaGroup()
  let switched = 0
  const control = {
    collapsible: true,
    setOpened: () => {
      switched++
    },
  }

  register(control)
  setAll(true)
  expect(switched).toBe(1)

  unregister(control)
  setAll(true)
  expect(switched).toBe(1)
})

test('the same answer registered twice is switched once', () => {
  const { register, setAll } = useQaGroup()
  let switched = 0
  const control = {
    collapsible: true,
    setOpened: () => {
      switched++
    },
  }

  register(control)
  register(control)
  setAll(true)

  expect(switched).toBe(1)
})

test('an answer hands itself to the group above it', async () => {
  const registered: QaControl[] = []
  const collapsible = ref(true)

  // `inject` reads the ancestors' provides, so the group sits one level up.
  const answer = defineComponent({
    setup() {
      useQaGroupControl(collapsible, () => {})
      return () => h('div')
    },
  })

  const app = createSSRApp({
    setup() {
      provide(qaGroupKey, {
        register: control => void registered.push(control),
        unregister: () => {},
      })
      return () => h(answer)
    },
  })
  await renderToString(app)

  expect(registered).toHaveLength(1)
  expect(registered[0].collapsible).toBe(true)

  collapsible.value = false
  expect(registered[0].collapsible).toBe(false)
})

test('two groups on one page keep their own answers', async () => {
  const seen = [0, 0]

  // A group is a provider, not a global: each subtree resolves to its nearest.
  const group = (index: number) => defineComponent({
    setup() {
      provide(qaGroupKey, {
        register: () => void seen[index]++,
        unregister: () => {},
      })
      return () => h(Qa, null, {
        question: () => h('p', 'Question line'),
        answer: () => h('p', 'Answer line'),
      })
    },
  })

  const app = createSSRApp({
    render: () => h('div', [h(group(0)), h(group(1))]),
  })
  await installI18n(app)
  await renderToString(app)

  expect(seen).toEqual([1, 1])
})
