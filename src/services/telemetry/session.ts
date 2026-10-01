import { shallowRef } from 'vue'
import { identifyClarityUser } from './clarity'
import { randomId, readStorage, writeStorage } from './util'

const INSTALL_ID_KEY = 'telemetry:install-id:v1'
const SUPPORT_CODE_KEY = 'telemetry:support-code:v1'

/** 约 30 分钟没有诊断事件或页面导航时轮换支持标识。 */
export const SESSION_IDLE_MS = 30 * 60_000

interface SupportCodeRecord {
  id: string
  expiresAt: number
}

let installId: string | undefined
let supportRecord: SupportCodeRecord | undefined
let storageAvailable = true
export const currentSupportCode = shallowRef<string | null>(null)

/** 设备级匿名标识:作 identify 的 custom-id(必填),由 Clarity 端哈希后存储 */
export function getInstallId(): string {
  const existing = storageAvailable ? readStorage<string>(INSTALL_ID_KEY) : null
  if (typeof existing === 'string' && existing)
    installId = existing
  const id = installId ?? randomId(16)
  installId = id
  storageAvailable = writeStorage(INSTALL_ID_KEY, id) && storageAvailable
  return id
}

function issueSupportCode(): string {
  const id = randomId(10)
  supportRecord = { id, expiresAt: Date.now() + SESSION_IDLE_MS }
  currentSupportCode.value = id
  storageAvailable = writeStorage(SUPPORT_CODE_KEY, supportRecord) && storageAvailable
  return id
}

/** 强制轮换会话标识,用于停用后重新启用等场景 */
export function rotateSupportCode(): string {
  return issueSupportCode()
}

/** 过期时轮换并 identify；调用方可据 rotated 避免重复 identify。 */
export function ensureSession(): { code: string, rotated: boolean } {
  const record = (storageAvailable ? readStorage<SupportCodeRecord>(SUPPORT_CODE_KEY) : null) ?? supportRecord
  if (typeof record?.id === 'string' && record.id && typeof record.expiresAt === 'number' && record.expiresAt > Date.now()) {
    const changed = supportRecord?.id !== record.id
    supportRecord = { ...record, expiresAt: Date.now() + SESSION_IDLE_MS }
    currentSupportCode.value = record.id
    storageAvailable = writeStorage(SUPPORT_CODE_KEY, supportRecord) && storageAvailable
    if (changed)
      identifyClarityUser(getInstallId(), record.id)
    return { code: record.id, rotated: changed }
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
