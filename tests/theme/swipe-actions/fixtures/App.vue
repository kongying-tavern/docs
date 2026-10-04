<script setup lang="ts">
import { ref } from 'vue'
import { SwipeActions, SwipeActionsRow } from '../../../../.vitepress/theme/components/ui/swipe-actions/index'

const items = ref([1, 2, 3])
const selected = ref('')
const errors = ref(0)
const fullSwipe = ref(true)
const disabled = ref(false)
const slow = ref(false)
function leading(id: number) {
  return [{ id: 'read', label: 'Mark read', keepRow: true, onSelect: async () => {
    selected.value = `read:${id}`
    if (slow.value)
      await new Promise(resolve => setTimeout(resolve, 400))
  } }]
}
function trailing(id: number) {
  return [
    { id: 'fail', label: 'Fail', onSelect: async () => { throw new Error('Expected failure') } },
    { id: 'disabled', label: 'Disabled', disabled: true, onSelect: () => { selected.value = 'unexpected' } },
    { id: 'delete', label: 'Delete', tone: 'danger' as const, onSelect: () => {
      selected.value = `delete:${id}`
      items.value = items.value.filter(item => item !== id)
    } },
  ]
}
</script>

<template>
  <main style="max-width: 480px; margin: 40px auto; padding: 16px">
    <h1>Swipe actions test</h1>
    <label><input v-model="fullSwipe" type="checkbox"> Full swipe</label>
    <label><input v-model="disabled" type="checkbox"> Disable rows</label>
    <label><input v-model="slow" type="checkbox"> Slow action</label>
    <SwipeActions label="Inbox">
      <SwipeActionsRow
        v-for="item in items"
        :key="item"
        :label="`Message ${item}`"
        :menu-label="`More actions for Message ${item}`"
        :leading="leading(item)"
        :trailing="trailing(item)"
        :full-swipe="fullSwipe"
        :disabled="disabled"
        @action-error="errors++"
      >
        <strong>Message {{ item }}</strong>
        <p>Swipe right to mark read; swipe left to reveal actions.</p>
        <a href="#link">Slotted link</a>
      </SwipeActionsRow>
    </SwipeActions>
    <output>{{ selected }}</output>
    <p data-errors>
      Errors: {{ errors }}
    </p>
    <button type="button" data-outside>
      Outside
    </button>
    <div style="height: 1000px" />
  </main>
</template>
