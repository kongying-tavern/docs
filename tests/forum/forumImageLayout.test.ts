/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { planForumImageGrid, planForumImageRow } from '../../src/forum/services/forumImageLayout'

const wide = { width: 1600, height: 800 }
const tall = { width: 800, height: 1600 }
const square = { width: 800, height: 800 }

test('card rows fit natural proportions within a bounded common height', () => {
  const plan = planForumImageRow([wide, square], 608)
  assert.equal(plan.height, 200)
  assert.equal(plan.width, 608)
  assert.equal(plan.columns, '2fr 1fr')
  assert.equal(planForumImageRow([tall], 608).height, 200)
  assert.equal(planForumImageRow([wide, wide, wide], 608).height, 592 / 6)
})

test('card rows retain extreme ratios and tolerate missing or invalid dimensions', () => {
  const plan = planForumImageRow([{ width: 1, height: 10000 }, { width: 10000, height: 1 }], 600)
  assert.equal(plan.columns, '0.0001fr 10000fr')
  assert.ok(plan.height > 0 && plan.height <= 200)
  assert.equal(planForumImageRow([{}], Number.NaN).height, 200)
  assert.ok(planForumImageRow([square, square, square], 200).width <= 200)
})

test('wide images fit the row without vertical letterboxing', () => {
  for (const width of [320, 600, 900]) {
    const plan = planForumImageRow([{ width: 2400, height: 400 }], width)
    assert.equal(plan.width, width)
    assert.equal(plan.height, width / 6)
  }
  const portrait = planForumImageRow([tall], 600)
  assert.equal(portrait.width, 100)
  assert.equal(portrait.height, 200)
})

test('comment rows use a lower height limit while preserving the actual image ratio', () => {
  const plan = planForumImageRow([{ width: 391, height: 645 }], 448, 160)
  assert.equal(plan.height, 160)
  assert.equal(plan.width, 160 * 391 / 645)
  assert.equal(planForumImageRow([wide], 448, 160).height, 160)
  assert.equal(planForumImageRow([{ width: 2400, height: 400 }], 448, 160).height, 448 / 6)
})

test('two images select the split with less object-cover cropping', () => {
  assert.deepEqual(planForumImageGrid([wide, wide]), { layout: 'two-horizontal', order: [0, 1] })
  assert.deepEqual(planForumImageGrid([tall, tall]), { layout: 'two-vertical', order: [0, 1] })
  assert.deepEqual(planForumImageGrid([square, square]), { layout: 'two-vertical', order: [0, 1] })
})

test('three images feature the best-fitting image while retaining the others original order', () => {
  assert.deepEqual(planForumImageGrid([square, tall, square]), { layout: 'three-left', order: [1, 0, 2] })
  assert.deepEqual(planForumImageGrid([square, wide, square]), { layout: 'three-top', order: [1, 0, 2] })
  assert.deepEqual(planForumImageGrid([tall, square, wide]), { layout: 'three-left', order: [0, 1, 2] })
})

test('single and four-image grids preserve source order', () => {
  assert.deepEqual(planForumImageGrid([wide]), { layout: 'single', order: [0] })
  assert.deepEqual(planForumImageGrid([wide, tall, square, wide]), { layout: 'grid', order: [0, 1, 2, 3] })
  assert.deepEqual(planForumImageGrid([{ width: Number.POSITIVE_INFINITY, height: 0 }, square]), {
    layout: 'two-vertical',
    order: [0, 1],
  })
})

test('the same planner adapts its crop targets to a wide detail-page grid', () => {
  assert.deepEqual(planForumImageGrid([square, square], 2), { layout: 'two-vertical', order: [0, 1] })
  assert.deepEqual(planForumImageGrid([wide, wide], 2), { layout: 'two-vertical', order: [0, 1] })
  assert.deepEqual(planForumImageGrid([wide, { width: 3200, height: 800 }, wide], 2), {
    layout: 'three-top',
    order: [1, 0, 2],
  })
})
