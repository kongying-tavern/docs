import { useData } from 'vitepress'
import { computed, ref, watch } from 'vue'

export type AuthStepKey = 'init' | 'token' | 'session' | 'sso' | 'redirect'

export interface AuthStep {
  key: AuthStepKey
  label: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

const stepOrder: AuthStepKey[] = ['init', 'token', 'session', 'sso', 'redirect']

export function useAuthProgress() {
  const { theme } = useData()

  const currentStep = ref<AuthStepKey>('init')
  const errorStep = ref<AuthStepKey | null>(null)
  const isRetrying = ref(false)

  const steps = computed<AuthStep[]>(() => {
    const authTexts = theme.value.forum.auth.callback

    return stepOrder.map((key) => {
      let status: AuthStep['status'] = 'pending'

      if (errorStep.value === key) {
        status = 'failed'
      }
      else if (key === currentStep.value) {
        status = 'processing'
      }
      else if (stepOrder.indexOf(key) < stepOrder.indexOf(currentStep.value)) {
        status = 'completed'
      }

      return {
        key,
        label: authTexts.steps[key],
        status,
      }
    })
  })

  const progress = computed(() => {
    if (errorStep.value) {
      return stepOrder.indexOf(errorStep.value) * 20
    }

    const currentIndex = stepOrder.indexOf(currentStep.value)
    const completedSteps = currentIndex
    const baseProgress = completedSteps * 20

    if (currentStep.value === 'redirect' && steps.value.find(s => s.key === 'redirect')?.status === 'completed') {
      return 100
    }

    return Math.min(baseProgress + 20, 100)
  })

  const isComplete = computed(() => {
    return currentStep.value === 'redirect'
      && steps.value.find(s => s.key === 'redirect')?.status === 'completed'
  })

  const hasError = computed(() => {
    return errorStep.value !== null
  })

  const title = computed(() => {
    const authTexts = theme.value.forum.auth.callback

    if (hasError.value) {
      return authTexts.error.title
    }

    if (isComplete.value) {
      return authTexts.status.completed
    }

    // Show current step name
    return authTexts.steps[currentStep.value]
  })

  function setStep(step: AuthStepKey) {
    if (errorStep.value) {
      errorStep.value = null
    }
    currentStep.value = step
  }

  function completeStep(step: AuthStepKey) {
    const currentIndex = stepOrder.indexOf(step)
    const nextIndex = currentIndex + 1

    if (nextIndex < stepOrder.length) {
      currentStep.value = stepOrder[nextIndex]
    }
    else {
      currentStep.value = step
    }
  }

  function setError(step: AuthStepKey) {
    errorStep.value = step
    currentStep.value = step
  }

  function retry() {
    if (errorStep.value) {
      isRetrying.value = true
      const failedStep = errorStep.value
      errorStep.value = null
      currentStep.value = failedStep

      setTimeout(() => {
        isRetrying.value = false
      }, 1000)
    }
  }

  function reset() {
    currentStep.value = 'init'
    errorStep.value = null
    isRetrying.value = false
  }

  watch(currentStep, (newStep) => {
    if (newStep === 'redirect') {
      setTimeout(() => {
        completeStep('redirect')
      }, 500)
    }
  })

  return {
    steps,
    progress,
    currentStep: computed(() => currentStep.value),
    isComplete,
    hasError,
    title,
    isRetrying: computed(() => isRetrying.value),
    setStep,
    completeStep,
    setError,
    retry,
    reset,
  }
}
