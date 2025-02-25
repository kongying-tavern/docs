declare namespace GITEE_WEBHOOK {
  interface OPTIONS {
    owner?: string
    repo?: string
    number: string | number
  }

  interface PARAMS {
    rawContent: string
    sanitizedContent: string
    json: Record<string, unknown>
  }
}
