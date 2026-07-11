import type { ReactNode } from 'react'

// 輕量語法上色：註解、字串、關鍵字、數字（零依賴，題目片段夠用）
const TOKEN_RE =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|of|in|new|typeof|class|import|export|from|true|false|null|undefined)\b|(\b\d+(?:\.\d+)?\b)/g

const highlight = (code: string): ReactNode[] => {
  const parts: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = TOKEN_RE.exec(code)) !== null) {
    if (m.index > last) parts.push(code.slice(last, m.index))
    const [text, comment, string, keyword, number] = m
    const cls = comment ? 'tok-comment' : string ? 'tok-string' : keyword ? 'tok-keyword' : number ? 'tok-number' : ''
    parts.push(
      <span key={key++} className={cls}>
        {text}
      </span>
    )
    last = m.index + text.length
  }
  if (last < code.length) parts.push(code.slice(last))
  return parts
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
