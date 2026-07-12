// 題庫自動驗證：實際執行每題的程式碼，比對宣稱的答案
// 純 JS 題用 node 直接跑；JSX 題（check 用 jsx 欄位）先經 esbuild 轉譯再跑，
// 可搭配 react-dom/server 的 renderToStaticMarkup 比對渲染結果
// 用法：node scripts/validate-questions.mjs
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const QUESTIONS_DIR = join(PROJECT_ROOT, 'src/data/questions')
const REQUIRED_FIELDS = ['id', 'type', 'difficulty', 'topic', 'docs', 'story', 'prompt', 'code', 'options', 'answer', 'explanation', 'verify']
const VALID_TYPES = ['predict-output', 'find-bug', 'same-or-not', 'fill-in']
const ALLOWED_DOC_HOSTS = ['developer.mozilla.org', 'react.dev']

let pass = 0
let fail = 0
const failures = []

function runCode(code) {
  const res = spawnSync('node', ['-e', code], { encoding: 'utf8', timeout: 5000 })
  return { stdout: (res.stdout || '').trim(), stderr: (res.stderr || '').trim(), status: res.status }
}

function runJsx(code) {
  // esbuild 轉譯 JSX → 臨時 .mjs 檔（放專案根目錄才解析得到 node_modules 的 react）
  const js = transformSync(code, { loader: 'jsx', jsx: 'automatic', format: 'esm' }).code
  const tmp = join(PROJECT_ROOT, `.validate-tmp-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`)
  writeFileSync(tmp, js)
  try {
    const res = spawnSync('node', [tmp], { encoding: 'utf8', timeout: 10000, cwd: PROJECT_ROOT })
    return { stdout: (res.stdout || '').trim(), stderr: (res.stderr || '').trim(), status: res.status }
  } finally {
    rmSync(tmp, { force: true })
  }
}

function check(cond, label) {
  if (cond) {
    pass++
  } else {
    fail++
    failures.push(label)
  }
}

for (const file of readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const level = JSON.parse(readFileSync(join(QUESTIONS_DIR, file), 'utf8'))
  console.log(`\n📘 ${file}（${level.title}，${level.questions.length} 題）`)

  for (const q of level.questions) {
    const tag = `${q.id}`
    // 欄位完整性
    for (const f of REQUIRED_FIELDS) {
      check(q[f] !== undefined, `${tag}: 缺少欄位 ${f}`)
    }
    check(VALID_TYPES.includes(q.type), `${tag}: 未知題型 ${q.type}`)
    check(q.options.some((o) => o.id === q.answer), `${tag}: answer "${q.answer}" 不在選項中`)
    // 知識依據限定官方文件
    try {
      const host = new URL(q.docs).hostname
      check(ALLOWED_DOC_HOSTS.some((h) => host.endsWith(h)), `${tag}: docs 來源 ${host} 不在允許清單（MDN / react.dev）`)
    } catch {
      check(false, `${tag}: docs 不是合法網址`)
    }
    // fill-in 題必須有空格標記
    if (q.type === 'fill-in') {
      check(q.code.includes('____'), `${tag}: fill-in 題的 code 缺少 ____ 空格標記`)
    }
    // 執行驗證
    const checks = q.verify?.checks ?? []
    if (checks.length === 0) {
      check(typeof q.verify?.manual === 'string', `${tag}: 無自動驗證且未註明 manual 原因`)
      console.log(`  ⚠️  ${tag} 無自動驗證（${q.verify?.manual ?? '未註明'}）→ 必須人工審`)
      continue
    }
    let allOk = true
    for (const [i, c] of checks.entries()) {
      const r = c.jsx !== undefined ? runJsx(c.jsx) : runCode(c.code)
      if (c.expected !== undefined && r.stdout !== c.expected) {
        allOk = false
        check(false, `${tag} check#${i + 1}: 預期輸出 ${JSON.stringify(c.expected)}，實際 ${JSON.stringify(r.stdout)}${r.stderr ? `（stderr: ${r.stderr.split('\n')[0]}）` : ''}`)
      } else if (c.expected !== undefined) {
        check(true, '')
      }
      if (c.expectError !== undefined) {
        const hit = r.status !== 0 && r.stderr.includes(c.expectError)
        if (!hit) allOk = false
        check(hit, `${tag} check#${i + 1}: 預期錯誤含 "${c.expectError}"，實際 status=${r.status} stderr=${JSON.stringify(r.stderr.split('\n')[0] || '')}`)
      }
    }
    console.log(`  ${allOk ? '✅' : '❌'} ${tag}（${q.type}）`)
  }
}

console.log(`\n═══ 驗證結果：${pass} 項通過，${fail} 項失敗 ═══`)
if (failures.length) {
  console.log('\n失敗清單：')
  for (const f of failures.filter(Boolean)) console.log(`  ❌ ${f}`)
  process.exit(1)
}
