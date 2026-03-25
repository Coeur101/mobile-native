/**
 * dasv-mock 项目 PostToolUse Hook 脚本
 * 根据修改的文件路径自动运行对应项目的代码检查和单元测试
 *
 * 环境变量:
 *   CLAUDE_FILE_PATHS - 被修改的文件路径（空格分隔）
 *
 * 检查内容:
 *   后端 (dasv-mock-app/src/) -> ESLint + Jest
 *   前端 (dasv-mock-portal/src/) -> Biome + vue-tsc
 */

const { execSync } = require('child_process')
const path = require('path')

const filePaths = (process.env.CLAUDE_FILE_PATHS || '').trim()
if (!filePaths) {
  process.exit(0)
}

// 项目根目录
const projectRoot = path.resolve(__dirname, '..', '..')

// 规范化路径并判断属于哪个子项目
const files = filePaths.split(/\s+/).filter(Boolean)
let runBackend = false
let runFrontend = false

for (const f of files) {
  const normalized = f.replace(/\\/g, '/')
  if (normalized.includes('dasv-mock-app/src/')) runBackend = true
  if (normalized.includes('dasv-mock-portal/src/')) runFrontend = true
}

if (!runBackend && !runFrontend) {
  // 非源码文件修改，跳过
  process.exit(0)
}

let exitCode = 0

function run(label, cmd, cwd) {
  console.log(`[${label}] ${cmd}`)
  try {
    const output = execSync(cmd, {
      cwd,
      encoding: 'utf8',
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    if (output.trim()) {
      // 只输出最后几行
      const lines = output.trim().split('\n')
      const tail = lines.slice(-10).join('\n')
      console.log(tail)
    }
    console.log(`[${label}] 通过`)
    return true
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '')
    if (output.trim()) {
      const lines = output.trim().split('\n')
      const tail = lines.slice(-15).join('\n')
      console.log(tail)
    }
    console.log(`[${label}] 失败 (exit: ${err.status})`)
    return false
  }
}

// 后端检查
if (runBackend) {
  const backendDir = path.join(projectRoot, 'dasv-mock-app')
  console.log('=== 后端代码检查 ===')

  // ESLint
  if (!run('后端 ESLint', 'npx eslint --no-fix src/', backendDir)) {
    exitCode = 1
  }

  // Jest（仅当存在测试文件时）
  const fs = require('fs')
  const glob = require('path')
  // 简单检测是否有 .spec.ts 文件
  try {
    const result = execSync('dir /s /b src\\*.spec.ts 2>nul', {
      cwd: backendDir,
      encoding: 'utf8',
      shell: true,
    }).trim()
    if (result) {
      if (!run('后端 Jest', 'npx jest --passWithNoTests --no-coverage', backendDir)) {
        exitCode = 1
      }
    } else {
      console.log('[后端 Jest] 跳过（未找到 .spec.ts 文件）')
    }
  } catch {
    console.log('[后端 Jest] 跳过（未找到 .spec.ts 文件）')
  }
}

// 前端检查
if (runFrontend) {
  const frontendDir = path.join(projectRoot, 'dasv-mock-portal')
  console.log('=== 前端代码检查 ===')

  // Biome check（不自动修复）
  if (!run('前端 Biome', 'npx biome check --no-errors-on-unmatched src/', frontendDir)) {
    exitCode = 1
  }

  // vue-tsc 类型检查
  if (!run('前端 TypeScript', 'npx vue-tsc --build --noEmit', frontendDir)) {
    exitCode = 1
  }

  // Vitest（仅当存在测试文件时）
  try {
    const result = execSync('dir /s /b src\\*.spec.ts src\\*.test.ts 2>nul', {
      cwd: frontendDir,
      encoding: 'utf8',
      shell: true,
    }).trim()
    if (result) {
      if (!run('前端 Vitest', 'npx vitest run --no-coverage', frontendDir)) {
        exitCode = 1
      }
    } else {
      console.log('[前端 Vitest] 跳过（未找到测试文件）')
    }
  } catch {
    console.log('[前端 Vitest] 跳过（未找到测试文件）')
  }
}

process.exit(exitCode)
