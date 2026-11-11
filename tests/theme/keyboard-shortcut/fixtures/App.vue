<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import KeyboardShortcut from '@/components/ui/KeyboardShortcut.vue'

const DeferredShortcut = defineAsyncComponent(async () => {
  if (!import.meta.env.SSR)
    await new Promise(resolve => setTimeout(resolve, 80))
  return KeyboardShortcut
})
const platform = ref<'mac' | 'windows' | 'linux'>('windows')
</script>

<template>
  <main>
    <h1>Keyboard shortcuts</h1>
    <p id="auto">
      Automatic: <KeyboardShortcut :sequence="[['Mod', 'K']]" />
    </p>
    <p id="explicit">
      Explicit: <KeyboardShortcut :sequence="[['Ctrl', 'Meta', 'K']]" />
    </p>
    <p id="deferred">
      Deferred: <DeferredShortcut :sequence="[['Mod', 'K']]" />
    </p>
    <p id="fixed">
      Fixed: <KeyboardShortcut :sequence="[['Mod', 'Alt', 'P']]" :platform="platform" />
    </p>
    <label>Platform
      <select v-model="platform">
        <option value="windows">Windows</option>
        <option value="mac">macOS</option>
        <option value="linux">Linux</option>
      </select>
    </label>
    <p id="sequence" class="narrow">
      <KeyboardShortcut :sequence="[['Ctrl', 'Shift', 'A'], ['Ctrl', 'Shift', 'D'], ['ArrowUp']]" platform="windows" />
    </p>
    <p id="mixed">
      <KeyboardShortcut :sequence="[['Ctrl', 'K'], ['M']]" platform="windows" />
    </p>
    <p id="chords">
      <KeyboardShortcut :sequence="[['Ctrl', 'K'], ['Ctrl', 'Alt', 'C']]" platform="windows" />
    </p>
  </main>
</template>

<style>
:root {
  --site-ui-scale: 1;
}

body {
  margin: 24px;
  background: oklch(var(--background));
  color: oklch(var(--foreground));
  font: 16px/1.6 system-ui;
}
main {
  max-width: 640px;
}
.narrow {
  width: 170px;
}
</style>
