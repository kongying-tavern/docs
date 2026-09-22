/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import assert from 'node:assert/strict'
import test from 'node:test'
import { isTextPlausibleForLanguage } from '../../src/services/forum/forumLanguage'

test('与正文文字不符的声明语言会被否决', () => {
  // 中文正文里夹带英文词，仍应判定为中文正文，不能当作英语
  const chinese = '这是一条中文反馈，正文里可能出现 UI、BUG 之类的英文词。'
  assert.equal(isTextPlausibleForLanguage(chinese, 'en'), false)
  assert.equal(isTextPlausibleForLanguage(chinese, 'zh'), true)

  assert.equal(isTextPlausibleForLanguage('This is an English feedback body.', 'en'), true)
  assert.equal(isTextPlausibleForLanguage('This is an English feedback body.', 'zh'), false)

  assert.equal(isTextPlausibleForLanguage('Это отзыв на русском языке.', 'ru'), true)
  assert.equal(isTextPlausibleForLanguage('Это отзыв на русском языке.', 'en'), false)
})

test('假名可以否决中文声明，纯汉字不能否决日语', () => {
  assert.equal(isTextPlausibleForLanguage('これは日本語のフィードバックです。', 'zh'), false)
  assert.equal(isTextPlausibleForLanguage('これは日本語のフィードバックです。', 'ja'), true)
  assert.equal(isTextPlausibleForLanguage('日本語漢字本文', 'ja'), true)
  assert.equal(isTextPlausibleForLanguage('日本語漢字本文', 'zh'), true)
})

test('无法判定时保留声明语言', () => {
  assert.equal(isTextPlausibleForLanguage('123 45 !!!', 'en'), true)
  assert.equal(isTextPlausibleForLanguage('这是一条反馈', undefined), true)
  assert.equal(isTextPlausibleForLanguage('', 'en'), true)
  assert.equal(isTextPlausibleForLanguage('Some text', 'not-a-language'), true)
  // Intl 会把无法识别的语言代码回落到 Latn，此时 CJK 正文仍会被否决：
  // 宁可跳过翻译，也不要把中文当英文喂给翻译器
  assert.equal(isTextPlausibleForLanguage('这是一条反馈', 'not-a-language'), false)
})
