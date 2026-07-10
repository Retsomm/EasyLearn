// 題庫自動驗證：實際執行每題的程式碼，比對宣稱的答案
// 用法：node scripts/validate-questions.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUESTIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/data/questions')
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
      const r = runCode(c.code)
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
