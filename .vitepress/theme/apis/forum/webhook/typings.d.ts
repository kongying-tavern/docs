declare namespace GITEE_WEBHOOK {
  type OPTIONS = {
    owner?: string
    repo?: string
    number: string | number
  }

  type PARAMS = {
    rawContent: string
    sanitizedContent: string
    json: Record<string, unknown>
  }
}
