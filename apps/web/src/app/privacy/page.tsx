import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隱私權政策 — EasyLearn',
}

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '112182ssss@gmail.com'

const PrivacyPage = () => {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 24px 96px',
        lineHeight: 1.8,
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>隱私權政策</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>最後更新：2026-07-13</p>

      <p>
        EasyLearn（以下稱「本服務」，包含網頁版 PWA 與 Android／iOS App）由個人開發者製作與維運。
        本頁說明使用本服務時，我們會蒐集哪些資料、如何使用，以及你可以如何管理或刪除這些資料。
      </p>

      <h2 style={styles.h2}>一、訪客模式（未登入）</h2>
      <p>
        未登入時，你的學習進度（答題紀錄、錯題本、收藏題目、經驗值、連續學習天數等）只會儲存在
        你自己的裝置本機（瀏覽器 localStorage 或 App 的裝置端儲存），不會傳送到我們的伺服器，
        我們也無法看到這些資料。移除瀏覽器資料或解除安裝 App 會一併清除這些本機資料。
      </p>

      <h2 style={styles.h2}>二、登入後蒐集的資料</h2>
      <p>本服務使用第三方服務 Clerk 提供帳號驗證（目前僅支援 Google 登入）。登入後：</p>
      <ul style={styles.ul}>
        <li>
          你的 Google 帳號基本資料（電子郵件、姓名、大頭貼）由 Clerk 代為儲存與管理，
          本服務不會另外複製一份到自己的資料庫。
        </li>
        <li>
          本服務自己的資料庫（PostgreSQL，由 Supabase 代管）只會以 Clerk 配發的帳號 ID 為關聯鍵，
          儲存與學習有關的資料：經驗值、連續學習天數、各關卡最佳成績、錯題本、收藏題目、
          每日/分章節答題統計。這份資料庫不包含你的電子郵件或姓名。
        </li>
        <li>
          若你更換大頭貼，圖片透過 Clerk 的服務上傳與儲存，本服務不會另外保留原始圖檔。
        </li>
        <li>
          首次登入時，會將你在訪客模式下累積的本機學習進度一次性同步上傳到雲端資料庫，
          之後以雲端資料為主。
        </li>
      </ul>

      <h2 style={styles.h2}>三、資料的使用方式</h2>
      <p>
        上述資料僅用於提供「跨裝置同步學習進度」這項功能本身（例如讓你在網頁版與 App
        之間看到同一份進度）。本服務不會將你的資料用於廣告投放，也不會出售或提供給第三方
        行銷使用。目前本服務未整合任何第三方數據分析或廣告 SDK。
      </p>

      <h2 style={styles.h2}>四、資料由誰代管</h2>
      <p>本服務使用以下第三方服務商處理資料，請參考各自的隱私權政策了解其資料處理方式：</p>
      <ul style={styles.ul}>
        <li>
          <a href="https://clerk.com/legal/privacy" target="_blank" rel="noreferrer noopener">
            Clerk
          </a>
          ——帳號驗證、Google 登入、大頭貼儲存
        </li>
        <li>
          <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer noopener">
            Supabase
          </a>
          ——學習進度資料庫代管
        </li>
        <li>
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer noopener">
            Vercel
          </a>
          ——網頁版服務代管
        </li>
      </ul>

      <h2 style={styles.h2}>五、刪除帳號與資料</h2>
      <p>
        你可以隨時在「個人設定」頁面刪除帳號。刪除後，上述儲存在本服務資料庫中與該帳號關聯的
        所有學習資料（進度、錯題本、收藏、統計）會一併永久刪除，且無法復原；Clerk
        代管的帳號本身也會一併刪除。
      </p>

      <h2 style={styles.h2}>六、App 權限（Android／iOS）</h2>
      <p>
        App 版本僅會請求「存取你的相簿」權限，用途是讓你選擇一張既有的照片作為大頭貼。
        本服務不會請求相機、麥克風、定位或聯絡人等其他權限。
      </p>

      <h2 style={styles.h2}>七、聯絡方式</h2>
      <p>
        若對本隱私權政策或你的個人資料有任何疑問，歡迎透過 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
        與我們聯絡。
      </p>
    </main>
  )
}

const styles = {
  h2: { fontSize: '1.1rem', marginTop: 32, marginBottom: 8 },
  ul: { paddingLeft: 20 },
} as const

export default PrivacyPage
