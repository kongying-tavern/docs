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

function fakeAnswer(collapsible: boolean, opened: boolean) {
  const isOpened = ref(opened)
  return {
    collapsible,
    isOpened,
    setOpened: (next: boolean) => {
      isOpened.value = next
    },
  }
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

test('the static page does not ship both actions disabled', async () => {
  const html = await renderGroup()

  expect(actionTags(html).every(tag => !tag.includes('disabled'))).toBe(true)
})

test('the batch actions skip the answers that have no toggle', () => {
  const { register, expandAll, collapseAll } = useQaGroup()
  const asked: string[] = []

  register({ ...fakeAnswer(false, true), setOpened: () => void asked.push('fixed') })
  register({ ...fakeAnswer(true, false), setOpened: () => void asked.push('movable') })

  collapseAll()
  expandAll()

  expect(asked).toEqual(['movable', 'movable'])
})

test('each action is offered only while it would change something', () => {
  const { register, expandAll, collapseAll, canExpand, canCollapse } = useQaGroup()
  const state = () => [canExpand.value, canCollapse.value]

  // Nobody has signed up yet, so the state is unknown: both stay offered.
  expect(state()).toEqual([true, true])

  // A fixed answer is always open and never makes a batch unnecessary.
  register(fakeAnswer(false, true))
  expect(state()).toEqual([false, false])

  register(fakeAnswer(true, true))
  expect(state()).toEqual([false, true])

  collapseAll()
  expect(state()).toEqual([true, false])

  expandAll()
  expect(state()).toEqual([false, true])
})

test('an answer stops answering the group once it unmounts', () => {
  const { register, unregister, expandAll, canExpand } = useQaGroup()
  let switched = 0
  const staying = fakeAnswer(true, true)
  const leaving = {
    collapsible: true,
    isOpened: ref(false),
    setOpened: () => {
      switched++
    },
  }

  register(staying)
  register(leaving)
  expect(canExpand.value).toBe(true)

  unregister(leaving)
  expect(canExpand.value).toBe(false)

  expandAll()
  expect(switched).toBe(0)
})

test('the same answer registered twice is switched once', () => {
  const { register, expandAll } = useQaGroup()
  let switched = 0
  const control = {
    collapsible: true,
    isOpened: ref(false),
    setOpened: () => {
      switched++
    },
  }

  register(control)
  register(control)
  expandAll()

  expect(switched).toBe(1)
})

test('an answer hands itself to the group above it', async () => {
  const registered: QaControl[] = []
  const collapsible = ref(true)
  const isOpened = ref(true)

  // `inject` reads the ancestors' provides, so the group sits one level up.
  const answer = defineComponent({
    setup() {
      useQaGroupControl({ collapsible, isOpened, setOpened: () => {} })
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

  // The group reads the same ref the answer owns, not a copy.
  isOpened.value = false
  expect(registered[0].isOpened.value).toBe(false)
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
