# EasyLearn 題庫格式規範

> 題庫是靜態 JSON 檔，放在 `src/data/questions/`，一個關卡一個檔案。
> 產題流程：AI 依官方文件生成 → `node scripts/validate-questions.mjs` 自動驗證 → 人工審核。

## 知識依據（硬性規定）

- JavaScript 題目：只能依據 **MDN**（developer.mozilla.org），每題必附 `docs` 連結
- React 題目：只能依據 **react.dev**，每題必附 `docs` 連結
- W3Schools 僅作白話補充參考，不作為知識點依據

## 關卡檔案結構

```json
{
  "id": "jsb-1",
  "title": "變數與型別",
  "questions": [ ...題目物件... ]
}
```

## 題目物件欄位

| 欄位 | 必填 | 說明 |
|:--|:--|:--|
| `id` | ✅ | 題目唯一代號，格式 `{關卡id}-q{序號}` |
| `type` | ✅ | 題型：`predict-output`（預測輸出）、`find-bug`（抓 bug）、`same-or-not`（改壞了嗎）、`fill-in`（微量手寫填空）、`concept`（純概念題，無需執行驗證） |
| `difficulty` | ✅ | 1–3，同一關內由易到難排列 |
| `topic` | ✅ | 知識點名稱（顯示用） |
| `docs` | ✅ | 對應的 MDN / react.dev 文件連結（答題後顯示「延伸閱讀」），`concept` 題若無明確對應文件可留空字串 |
| `story` | ✅ | 劇情包裝文字，MVP 一律空字串 `""`（二期職場敘事預留欄位） |
| `prompt` | ✅ | **只放題目問句**，不放程式碼；即使要比較「版本一／版本二」兩段程式碼，也一律放進 `code` 欄位，`prompt` 只問「這兩者的差異說明了什麼」 |
| `code` | ✅ | 展示給學員看的程式碼；`fill-in` 題用 `____` 標記空格；比較多個版本時用 `// 版本一` / `// 版本二` 註解分隔（同一 `code` 欄位可多行），沒有程式碼可展示的 `concept` 題留空字串 `""` |
| `options` | ✅ | 選項陣列 `[{ "id": "a", "text": "...", "code": "..." }]`，2–4 個；`code` 為選填，只有當這個選項本身是一段完整程式碼（例如「哪一種重構寫法正確」）時才用，`text` 留給簡短說明，不要把整段函式定義塞進 `text` 字串 |
| `answer` | ✅ | 正確選項的 id |
| `explanation` | ✅ | 白話解釋——先講「發生了什麼」，再講規則；語氣鼓勵、不說教；用文字描述程式碼行為，不要在 `explanation` 裡內嵌完整程式碼（沒有對應的 code 欄位可以承載，會被當純文字擠成一行） |
| `verify` | ✅ | 自動驗證設定，見下 |

## verify 欄位（自動驗證）

```json
"verify": {
  "checks": [
    { "code": "實際執行的完整程式碼", "expected": "預期的完整 stdout（trim 後比對）" },
    { "code": "...", "expectError": "預期錯誤訊息需包含的字串" }
  ]
}
```

- 一個 check 可同時有 `expected`（比對錯誤發生前的輸出）與 `expectError`
- `fill-in` 題：check 的 code 必須是「空格填入正確選項後」的完整程式碼
- `find-bug` 題：建議兩個 check——原始碼呈現 bug 行為＋修正版呈現正確行為
- **React/JSX 題**：check 改用 `jsx` 欄位（取代 `code`），驗證腳本會用 esbuild 轉譯後執行；
  搭配 `import { renderToStaticMarkup } from 'react-dom/server'` 把元件渲染成 HTML 字串
  console.log 出來比對 `expected`。渲染結果類題目一律要這樣驗
- 無法自動驗證的題目（需要點擊互動、useEffect 時序等瀏覽器行為）：`"checks": []` 並加
  `"manual": "原因"`，這類題**必須**人工審

## 題型比例

- 每關 6 題：`fill-in` 佔 1 題（≈17%，符合「微量手寫」約 20% 的定位），其餘三種題型混搭
- 難度排列：前 2 題 difficulty 1，中間 2–3 題 difficulty 2，最後 1–2 題 difficulty 3

## 章節地圖

章節與關卡順序定義在 `src/data/chapters.js`。目前規劃：

1. **JS 基礎**：變數與型別 → 函式基礎 → 陣列操作 → 物件與解構
2. **JS 進階**（待產題）：this 與作用域 → closure → 非同步（callback/Promise/async-await）
3. **React**（待產題）：元件與 JSX → props → state 與事件 → hooks 規則
