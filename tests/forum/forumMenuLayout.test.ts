import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { menuContentClasses } from '../../src/forum/components/ui/responsive/shared'

test('shared popup layout finds grouped shortcuts and sizes submenus independently', () => {
  assert.equal(menuContentClasses([{ type: 'item', label: 'Action' }]), 'w-max text-nowrap')
  const item = { type: 'item' as const, label: 'Copy', shortcut: 'Ctrl+Shift+C' }
  assert.match(menuContentClasses([{ type: 'group', items: [item] }]), /min-w-/)
  assert.equal(menuContentClasses([{ type: 'submenu', label: 'More', items: [item] }]), 'w-max text-nowrap')
  assert.match(menuContentClasses([item]), /min\(16rem,calc\(100vw-2rem\)\)/)
})
