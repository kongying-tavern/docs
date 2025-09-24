<script setup lang="ts">
import type { EmojiItem, EmojiPickerProps } from './types'

const {
  noResults = 'No emojis found',
  categories,
} = defineProps<EmojiPickerProps>()

const emit = defineEmits<{
  select: [emoji: EmojiItem]
}>()

function handleEmojiSelect(emoji: EmojiItem) {
  emit('select', emoji)
}
</script>

<template>
  <div class="emoji-picker">
    <!-- Emoji picker implementation -->
    <div v-if="categories?.length" class="emoji-categories">
      <div v-for="category in categories" :key="category.name" class="emoji-category">
        <h3>{{ category.name }}</h3>
        <div class="emoji-grid">
          <button
            v-for="emoji in category.emojis"
            :key="emoji.emoji"
            :title="emoji.name"
            class="emoji-button"
            @click="handleEmojiSelect(emoji)"
          >
            {{ emoji.emoji }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="no-emojis">
      {{ noResults }}
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
}

.emoji-category {
  margin-bottom: 16px;
}

.emoji-category h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.emoji-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: background-color 0.2s;
}

.emoji-button:hover {
  background-color: #f3f4f6;
}

.no-emojis {
  text-align: center;
  color: #6b7280;
  padding: 20px;
}
</style>
