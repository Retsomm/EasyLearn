import type { IconName, QuestionType } from '@easylearn/core'

export const TYPE_META: Record<QuestionType, { icon: IconName; label: string }> = {
  'predict-output': { icon: 'eye', label: '預測輸出' },
  'find-bug': { icon: 'bug', label: '抓蟲' },
  'same-or-not': { icon: 'search', label: '改壞了嗎' },
  'fill-in': { icon: 'pencil', label: '動手填空' },
}
