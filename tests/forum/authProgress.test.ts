import { afterEach, expect, test, vi } from 'vitest'
import { useAuthProgress } from '~/forum/hooks/useAuthProgress'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key.split('.').at(-1) }),
}))

afterEach(() => vi.useRealTimers())

test('redirect stays processing until navigation actually completes', async () => {
  vi.useFakeTimers()
  const progress = useAuthProgress()
  progress.setStep('redirect')
  await vi.advanceTimersByTimeAsync(1000)
  expect(progress.isComplete.value).toBe(false)
  expect(progress.steps.value.at(-1)?.status).toBe('processing')
  progress.completeStep('redirect')
  expect(progress.isComplete.value).toBe(true)
  expect(progress.title.value).toBe('completed')
  progress.setError('redirect')
  expect(progress.isComplete.value).toBe(false)
  expect(progress.steps.value.at(-1)?.status).toBe('failed')
  progress.reset()
  expect(progress.currentStep.value).toBe('init')
  expect(progress.hasError.value).toBe(false)
})
