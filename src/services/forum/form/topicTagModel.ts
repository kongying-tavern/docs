import type { Ref } from 'vue'

export function addTagToModel(modelValue: Ref<string[]>, tag: string, max: number): void {
  if (modelValue.value.length >= max || modelValue.value.includes(tag))
    return
  modelValue.value = [...modelValue.value, tag]
}

export function removeTagFromModel(modelValue: Ref<string[]>, tag: string): void {
  modelValue.value = modelValue.value.filter(item => item !== tag)
}
