import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { DEFAULT_THEME_ID, isValidThemeId, type ThemeId } from '@/lib/themes'

const STORAGE_KEY = 'easylearn-theme-v1'

const load = (): ThemeId => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw && isValidThemeId(raw) ? raw : DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

const applyToDocument = (theme: ThemeId) => {
  document.documentElement.dataset.theme = theme
}

const postJson = async (url: string, body: unknown): Promise<ThemeId> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`theme request failed: ${res.status}`)
  const data = (await res.json()) as { theme?: string }
  if (!data.theme || !isValidThemeId(data.theme)) throw new Error('invalid theme response')
  return data.theme
}

export const useTheme = () => {
  const { isSignedIn, isLoaded } = useUser()
  // 初始值固定用 DEFAULT_THEME_ID，掛載後才讀 localStorage，避免 SSR 跟 CSR 首輪渲染不一致
  // 造成 hydration mismatch（比照 useProgress.ts 的作法）。<html> 上的 data-theme 屬性則是靠
  // layout.tsx 內的 inline script 在畫面繪製前就先設好，不受這裡的兩輪渲染影響。
  const [theme, setThemeState] = useState(DEFAULT_THEME_ID)
  const [hydrated, setHydrated] = useState(false)
  const syncedRef = useRef(false)

  useEffect(() => {
    const local = load()
    setThemeState(local)
    applyToDocument(local)
    setHydrated(true)
  }, [])

  // 訪客模式：主題變動就寫回 localStorage
  useEffect(() => {
    if (!hydrated || isSignedIn) return
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, isSignedIn, hydrated])

  // 登入狀態切換：登入時去資料庫拿主題設定；若資料庫還是預設值、但本機已經手動選過別的主題，
  // 視為訪客模式時設定的偏好，同步上去一次。登出則換回讀本機 localStorage。
  useEffect(() => {
    if (!isLoaded || !hydrated) return
    if (!isSignedIn) {
      syncedRef.current = false
      const local = load()
      setThemeState(local)
      applyToDocument(local)
      return
    }
    if (syncedRef.current) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/theme')
        if (!res.ok) throw new Error(`theme fetch failed: ${res.status}`)
        const data = (await res.json()) as { theme?: string }
        const remoteTheme = data.theme && isValidThemeId(data.theme) ? data.theme : DEFAULT_THEME_ID
        const localTheme = load()
        const resolved =
          remoteTheme === DEFAULT_THEME_ID && localTheme !== DEFAULT_THEME_ID
            ? await postJson('/api/theme', { theme: localTheme })
            : remoteTheme
        if (cancelled) return
        setThemeState(resolved)
        applyToDocument(resolved)
        syncedRef.current = true
      } catch (err) {
        if (!cancelled) console.error('theme load/sync failed', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, hydrated])

  const setTheme = (next: string) => {
    if (!isValidThemeId(next)) return
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
    applyToDocument(next)
    if (isSignedIn) {
      postJson('/api/theme', { theme: next }).catch((err) => console.error('theme save failed', err))
    }
  }

  return { theme, setTheme }
}
