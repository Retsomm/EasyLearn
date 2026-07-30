import type { ReactNode } from 'react'

const INLINE_CODE_RE = /`([^`]+)`/g

// 把文字裡用反引號包住的程式碼片段（例如 `useState`）轉成 <code> 樣式節點，其餘維持一般文字
export const renderInlineCode = (text: string): ReactNode[] => {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let key = 0
  for (const match of text.matchAll(INLINE_CODE_RE)) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    parts.push(
      <code key={key++} className="inline-code">
        {match[1]}
      </code>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
