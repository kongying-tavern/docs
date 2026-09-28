/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { planForumImageGrid } from '../../src/forum/services/imageLayout'

const wide = { width: 1600, height: 800 }
const tall = { width: 800, height: 1600 }
const square = { width: 800, height: 800 }

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
