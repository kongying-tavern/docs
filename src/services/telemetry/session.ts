import { identifyClarityUser } from './clarity'
import { randomId, readStorage, writeStorage } from './util'

const INSTALL_ID_KEY = 'telemetry:install-id:v1'
const SUPPORT_CODE_KEY = 'telemetry:support-code:v1'

/** 与 Clarity 会话切分对齐:约 30 分钟无活动后轮换会话标识,使标识至多对应一个录制会话 */
export const SESSION_IDLE_MS = 30 * 60_000

interface SupportCodeRecord {
  id: string
  expiresAt: number
}

/** 设备级匿名标识:作 identify 的 custom-id(必填),由 Clarity 端哈希后存储 */
export function getInstallId(): string {
  const existing = readStorage<string>(INSTALL_ID_KEY)
  if (existing)
    return existing
  const id = randomId(16)
  writeStorage(INSTALL_ID_KEY, id)
  return id
}

function issueSupportCode(): string {
  const id = randomId(10)
  writeStorage(SUPPORT_CODE_KEY, { id, expiresAt: Date.now() + SESSION_IDLE_MS } satisfies SupportCodeRecord)
  return id
}

/** 强制轮换会话标识,用于停用后重新启用等场景 */
export function rotateSupportCode(): string {
  return issueSupportCode()
}

/**
 * 读取会话标识,过期即轮换并立即补一次 identify;
 * 返回当前标识与是否发生轮换,供上报路径决定是否单独重发 identify。
 */
export function ensureSession(): { code: string, rotated: boolean } {
  const record = readStorage<SupportCodeRecord>(SUPPORT_CODE_KEY)
  if (record?.id && record.expiresAt > Date.now()) {
    writeStorage(SUPPORT_CODE_KEY, { ...record, expiresAt: Date.now() + SESSION_IDLE_MS } satisfies SupportCodeRecord)
    return { code: record.id, rotated: false }
  }

  const code = issueSupportCode()
  identifyClarityUser(getInstallId(), code)
  return { code, rotated: true }
}

/** 页面级 identify:官方建议每页调用,便于按 custom session ID 串联整页会话 */
export function identifySession(): void {
  const { code, rotated } = ensureSession()
  if (!rotated)
    identifyClarityUser(getInstallId(), code)
}
