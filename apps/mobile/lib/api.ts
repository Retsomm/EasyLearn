const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  token?: string | null
}

// 打 apps/web 既有的 API routes，帶 Clerk session token 當 Authorization: Bearer <token>。
// token 是短命的，每次呼叫前用 useAuth().getToken() 即時拿，不要存進 state 快取。
export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL：請在 apps/mobile/.env.local 設定成能連到 apps/web 的網址（手機模擬器不能用 localhost，要用 LAN IP 或 Expo tunnel）',
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`API ${path} 回傳 ${res.status}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}
