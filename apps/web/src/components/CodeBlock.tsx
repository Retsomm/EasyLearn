import type { ReactNode } from 'react'

// 輕量語法上色：註解、字串、關鍵字、數字（零依賴，題目片段夠用）
const TOKEN_RE =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|of|in|new|typeof|class|import|export|from|true|false|null|undefined)\b|(\b\d+(?:\.\d+)?\b)/g

const highlight = (code: string): ReactNode[] => {
  const matches = Array.from(code.matchAll(TOKEN_RE))
  const { parts, last } = matches.reduce<{ parts: ReactNode[]; last: number }>(
    (acc, m, i) => {
      const [text, comment, string, keyword, number] = m
      const cls = comment ? 'tok-comment' : string ? 'tok-string' : keyword ? 'tok-keyword' : number ? 'tok-number' : ''
      if (m.index > acc.last) acc.parts.push(code.slice(acc.last, m.index))
      acc.parts.push(
        <span key={i} className={cls}>
          {text}
        </span>,
      )
      acc.last = m.index + text.length
      return acc
    },
    { parts: [], last: 0 },
  )
  return last < code.length ? [...parts, code.slice(last)] : parts
}

interface CodeBlockProps {
  code: string
}

const CodeBlock = ({ code }: CodeBlockProps) => (
  <pre className="code-block">
    <code>{highlight(code)}</code>
  </pre>
)

export default CodeBlock
