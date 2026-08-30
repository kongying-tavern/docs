import type { FontSubsetConfig, PythonEnvironment } from './config'
import { spawn } from 'node:child_process'

export interface ProcessOutputHandlers {
  stderr?: (output: string) => void
  stdout?: (output: string) => void
}

export function runProcess(
  command: string,
  args: string[],
  cwd: string,
  stdio: 'ignore' | 'inherit' | ProcessOutputHandlers,
): Promise<number> {
  return new Promise((resolveCode) => {
    const child = spawn(command, args, {
      cwd,
      stdio: typeof stdio === 'string' ? stdio : 'pipe',
    })
    if (typeof stdio !== 'string') {
      child.stdout?.setEncoding('utf8')
      child.stderr?.setEncoding('utf8')
      child.stdout?.on('data', output => stdio.stdout?.(output))
      child.stderr?.on('data', output => stdio.stderr?.(output))
    }
    child.on('error', () => resolveCode(-1))
    child.on('close', code => resolveCode(code ?? -1))
  })
}

export async function detectPython(
  projectRoot: string,
  config: FontSubsetConfig['python'],
): Promise<PythonEnvironment | null> {
  const imports = config.requiredModules.join(', ')
  for (const candidate of config.candidates) {
    const code = await runProcess(
      candidate.command,
      [...candidate.args, '-c', `import ${imports}`],
      projectRoot,
      'ignore',
    )
    if (code === 0)
      return candidate
  }
  return null
}
