export type ThemeId = 'default' | '1a' | '1b' | '1c' | '1e' | '1f'

export interface ThemeOption {
  id: ThemeId
  label: string
  swatch: string
  enabled: boolean
}

// enabled: false 代表這個主題還在製作中，切換器暫時不會顯示，等該主題的 CSS 完成才打開
export const THEMES: ThemeOption[] = [
  { id: 'default', label: '太空艙 HUD', swatch: '#5ff0e0', enabled: true },
  { id: '1a', label: '深空星雲', swatch: '#c9a8ff', enabled: true },
  { id: '1b', label: '極簡星域', swatch: '#8ecbff', enabled: true },
  { id: '1c', label: '極光玻璃', swatch: '#5eead4', enabled: true },
  { id: '1e', label: '星圖', swatch: '#e9c982', enabled: true },
  { id: '1f', label: '霓虹星際', swatch: '#00e5ff', enabled: true },
]

export const DEFAULT_THEME_ID: ThemeId = 'default'

export const isValidThemeId = (id: string): id is ThemeId =>
  THEMES.some((t) => t.id === id && t.enabled)
