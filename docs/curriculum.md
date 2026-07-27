# EasyLearn 課綱對照表

> 依官方文件的頁面結構規劃關卡主題，確保覆蓋度有依據、擴充有路線圖。
> JavaScript 對照 MDN《JavaScript Guide》，React 對照 react.dev《Learn React》。
> 狀態：✅ 已上線｜🆕 本批新增｜⬜ 待產題

## 第一章 JavaScript 基礎（MDN Guide 前半）

| MDN Guide 頁面 | 關卡 | 狀態 |
|:--|:--|:--|
| Grammar and types（語法與型別） | jsb-1 變數與型別 | ✅ |
| Functions（函式） | jsb-2 函式基礎 | ✅ |
| Indexed collections（索引集合） | jsb-3 陣列操作 | ✅ |
| Working with objects（物件）＋解構 | jsb-4 物件與解構 | ✅ |
| Control flow and error handling（流程控制與錯誤處理） | jsb-5 流程控制與錯誤處理 | ✅ |
| Loops and iteration（迴圈與迭代） | jsb-6 迴圈與迭代 | ✅ |
| Numbers and dates（數字與日期） | jsb-7 數字與日期 | ✅ |
| Text formatting（文字處理） | jsb-8 文字處理 | ✅ |
| Regular expressions（正規表達式） | jsb-9 正規表達式 | ✅ |

## 第二章 JavaScript 進階（MDN Guide 後半＋核心機制）

| MDN 頁面 | 關卡 | 狀態 |
|:--|:--|:--|
| this／Arrow functions／作用域 | jsa-1 this 與作用域 | ✅ |
| Closures（閉包） | jsa-2 closure | ✅ |
| 事件圈／setTimeout／Promise 入門 | jsa-3 非同步基礎 | ✅ |
| Using promises／async function | jsa-4 async / await | ✅ |
| Using classes（類別） | jsa-5 類別（class） | ✅ |
| Keyed collections（Map/Set）＋ JSON | jsa-6 Map、Set 與 JSON | ✅ |
| Modules（模組 import/export） | jsa-7 模組（import/export） | ✅ |
| Iterators and generators（迭代器與產生器） | jsa-8 迭代器與產生器 | ✅ |
| Promise 進階（all/race/allSettled 錯誤傳遞） | jsa-9 Promise 進階 | ✅ |

## 第三章 React（react.dev Learn 四大部）

| react.dev Learn 頁面 | 關卡 | 狀態 |
|:--|:--|:--|
| Your First Component／Writing Markup with JSX／Curly Braces | react-1 元件與 JSX | ✅ |
| Passing Props to a Component | react-2 props 資料流 | ✅ |
| Responding to Events／State: A Component's Memory／State as a Snapshot／Queueing State Updates | react-3 state 與事件 | ✅ |
| Rules of Hooks／Synchronizing with Effects | react-4 hooks 規則與 useEffect | ✅ |
| Conditional Rendering／Rendering Lists | react-5 條件渲染與列表 | ✅ |
| Updating Objects in State／Updating Arrays in State | react-6 更新物件與陣列 state | ✅ |
| Keeping Components Pure | react-7 保持元件純粹 | ✅ |
| Sharing State Between Components（Lifting State Up） | react-8 元件間共享 state | ✅ |
| Preserving and Resetting State | react-9 state 的保留與重置 | ✅ |
| Extracting State Logic into a Reducer／Passing Data Deeply with Context | react-10 Reducer 與 Context | ✅ |
| Manipulating the DOM with Refs／Referencing Values with Refs | react-11 refs | ✅ |

## 第四章 SICP JS（Structure and Interpretation of Computer Programs, JavaScript Edition）

> 全書 5 章，關卡對照書中「章.節」（X.Y）的小節結構，一節一關；ch 3～5 涉及暫存器機器、直譯器等實作，
> 用 JS 小型模擬範例取代真正的完整實作，題目一律不要求讀者背過書中章節，在可行範圍內直接用具體程式碼推理作答；
> 部分純設計理念題（例如成長量級、抽象比較）沒有對應的可執行程式碼，維持 concept 題型、`verify` 用 `manual` 註記。

| 書中小節 | 關卡 | 狀態 |
|:--|:--|:--|
| 1.1 The Elements of Programming | sicp-1-1 程式的元素：代換模型與黑盒抽象 | ✅ |
| 1.2 Functions and the Processes They Generate | sicp-1-2 函式與它們產生的計算過程 | ✅ |
| 1.3 Formulating Abstractions with Higher-Order Functions | sicp-1-3 用高階函式構造抽象 | ✅ |
| 2.1 Introduction to Data Abstraction | sicp-2-1 資料抽象導論 | ✅ |
| 2.2 Hierarchical Data and the Closure Property | sicp-2-2 階層式資料與封閉性質 | ✅ |
| 2.3 Symbolic Data | sicp-2-3 符號資料 | ✅ |
| 2.4 Multiple Representations for Abstract Data | sicp-2-4 抽象資料的多重表示法 | ✅ |
| 2.5 Systems with Generic Operations | sicp-2-5 具有泛用操作的系統 | ✅ |
| 3.1 Assignment and Local State | sicp-3-1 賦值與區域狀態 | ✅ |
| 3.2 The Environment Model of Evaluation | sicp-3-2 求值的環境模型 | ✅ |
| 3.3 Modeling with Mutable Data | sicp-3-3 用可變資料建模 | ✅ |
| 3.4 Concurrency: Time Is of the Essence | sicp-3-4 併行：時間是關鍵 | ✅ |
| 3.5 Streams | sicp-3-5 Stream | ✅ |
| 4.1 The Metacircular Evaluator | sicp-4-1 Metacircular 直譯器 | ✅ |
| 4.2 Lazy Evaluation | sicp-4-2 惰性求值 | ✅ |
| 4.3 Nondeterministic Computing | sicp-4-3 非決定性計算 | ✅ |
| 4.4 Logic Programming | sicp-4-4 邏輯式程式設計 | ✅ |
| 5.1 Designing Register Machines | sicp-5-1 設計暫存器機器 | ✅ |
| 5.2 A Register-Machine Simulator | sicp-5-2 暫存器機器模擬器 | ✅ |
| 5.3 Storage Allocation and Garbage Collection | sicp-5-3 儲存配置與垃圾回收 | ✅ |
| 5.4 The Explicit-Control Evaluator | sicp-5-4 顯式控制直譯器 | ✅ |
| 5.5 Compilation | sicp-5-5 編譯 | ✅ |

## 第五章 Domain Modeling Made Functional（Scott Wlaschin）

> 全書 3 大 Part、13 個 Chapter，沒有像 SICP JS 那種「章.節」數字編號，關卡對照書中每個數字 Chapter，
> 一章一關；Chapter 底下無編號的小節標題，分散變成該關 6 題的各個子主題，不再往下拆更多關卡。
> 內容原著以 F#／DDD 為主，題目在可行範圍內翻譯成 JS 可執行的等價寫法（tagged union、Result 型別等），
> 不要求讀者背過書中章節；部分純設計理念題（例如型別系統保證、架構取捨）沒有對應的可執行程式碼，
> 維持 concept 題型、`verify` 用 `manual` 註記。

| 書中章節 | 關卡 | 狀態 |
|:--|:--|:--|
| Part 1: Understanding the Domain / Chapter 1: Introducing Domain-Driven Design | dmmf-1 領域驅動設計導論 | ✅ |
| Chapter 2: Understanding the Domain | dmmf-2 理解領域 | ✅ |
| Chapter 3: A Functional Architecture | dmmf-3 函數式架構 | ✅ |
| Part 2: Modeling the Domain / Chapter 4: Understanding Types | dmmf-4 理解型別 | ✅ |
| Chapter 5: Domain Modeling with Types | dmmf-5 用型別建模領域 | ✅ |
| Chapter 6: Integrity and Consistency in the Domain | dmmf-6 領域中的完整性與一致性 | ✅ |
| Chapter 7: Modeling Workflows as Pipelines | dmmf-7 把 Workflow 建模成 Pipeline | ✅ |
| Part 3: Implementing the Model / Chapter 8: Understanding Functions | dmmf-8 理解函式 | ✅ |
| Chapter 9: Implementation: Composing a Pipeline | dmmf-9 實作 — 組裝 Pipeline | ✅ |
| Chapter 10: Implementation: Working with Errors | dmmf-10 實作 — 處理錯誤（Railway-Oriented Programming） | ✅ |
| Chapter 11: Serialization | dmmf-11 序列化 | ✅ |
| Chapter 12: Persistence | dmmf-12 持久化 | ✅ |
| Chapter 13: Evolving a Design and Keeping It Clean | dmmf-13 演進設計，保持乾淨 | ✅ |

## 第六章 Functional-Light JavaScript（Kyle Simpson）

> 全書 11 章＋3 個附錄，一樣沒有數字小節編號，關卡對照每個數字 Chapter，一章一關；
> 附錄 A、B 各自也有實質設計概念可以出題，各開一關；附錄 C（FP Libraries）只是書單／
> 第三方函式庫介紹，沒有概念可出題，跳過不排入地圖。本書原著就是 JS，題目多半可以直接
> 執行驗證（predict-output/fill-in），只有少數純設計理念題維持 concept 型別。

| 書中章節 | 關卡 | 狀態 |
|:--|:--|:--|
| Chapter 1. Why Functional Programming? | fljs-1 為什麼要函數式？ | ✅ |
| Chapter 2. The Nature Of Functions | fljs-2 函式的本質 | ✅ |
| Chapter 3. Managing Function Inputs | fljs-3 管理函式的輸入（Currying vs 偏函式應用） | ✅ |
| Chapter 4. Composing Functions | fljs-4 組合函式 | ✅ |
| Chapter 5. Reducing Side Effects | fljs-5 減少副作用 | ✅ |
| Chapter 6. Value Immutability | fljs-6 值的不可變性 | ✅ |
| Chapter 7. Closure vs. Object | fljs-7 Closure 對比物件 | ✅ |
| Chapter 8. Recursion | fljs-8 遞迴 | ✅ |
| Chapter 9. List Operations | fljs-9 走訪清單的操作 | ✅ |
| Chapter 10. Functional Async | fljs-10 函數式非同步 | ✅ |
| Chapter 11. Putting It All Together | fljs-11 整合應用 | ✅ |
| Appendix A. Transducing | fljs-12 Transducing | ✅ |
| Appendix B. The Humble Monad | fljs-13 謙遜的 Monad | ✅ |

## 第七章 Grokking Functional Programming（Michal Plachta）

> 全書 3 大 Part、12 個 Chapter，關卡對照書中每個數字 Chapter，一章一關。原著以 Scala 為主，
> 題目一律翻譯成 JS 可執行的等價寫法；兩個附錄（Scala cheat sheet 純語法對照表、
> Functional gems 是全書各章「THIS IS BIG!」重點方框的彙整摘要，沒有獨立於各章之外的新概念）
> 都跳過不排入地圖。跟 `fp`／`sicp`／`dmmf` 有主題重疊的章節（純函式、不可變性、Stream、
> 併行、Option/Either、ADT）刻意選用不同的具體情境跟切入角度出題，避免重複。

| 書中章節 | 關卡 | 狀態 |
|:--|:--|:--|
| Part 1: The functional toolkit / Ch1 Learning functional programming | gfp-1 學習函數式程式設計 | ✅ |
| Ch2 Pure functions | gfp-2 純函式 | ✅ |
| Ch3 Immutable values | gfp-3 不可變值 | ✅ |
| Ch4 Functions as values | gfp-4 函式作為值 | ✅ |
| Part 2: Functional programs / Ch5 Sequential programs | gfp-5 循序程式 | ✅ |
| Ch6 Error handling | gfp-6 錯誤處理 | ✅ |
| Ch7 Requirements as types | gfp-7 把需求變成型別 | ✅ |
| Ch8 IO as values | gfp-8 IO 視為值 | ✅ |
| Ch9 Streams as values | gfp-9 Stream 視為值 | ✅ |
| Ch10 Concurrent programs | gfp-10 併行程式 | ✅ |
| Part 3: Applied functional programming / Ch11 Designing functional programs | gfp-11 設計函數式程式 | ✅ |
| Ch12 Testing functional programs | gfp-12 測試函數式程式 | ✅ |

## 產題規則備忘

- **以書籍為知識依據的章節**（目前是 `fp`、`sicp`、`dmmf`；未來若再新增其他書籍章節比照辦理）：這些書不是官方線上
  文件，沒有 MDN／react.dev 那種可以附的連結。`concept` 題型（純粹考書中設計概念）`docs` 留空、`verify` 用
  `manual` 註記；若題目本質是在考「真正會執行的 JS 語法／內建方法」（例如 SICP JS 很多題目其實是可執行的
  closure、recursion、generator），才用 `predict-output`/`fill-in`，這時 `docs` 一樣只能是 MDN 連結。

- **題池抽題制**：每關的 questions 是「題池」，進關時隨機抽 `QUIZ_SIZE`（6）題、
  依難度排序作答（`src/utils/quiz.js`）——題池大於 6 題後，重玩才會遇到不同題。
  題池目標每關 12–18 題（**尚未擴池**，目前每關 6 題，抽題等於全上）
- 產題以 6 題為一組：難度遞增、fill-in 佔 1 題；規格見 `question-format.md`
- 純 JS 題全部要過執行驗證；React 渲染類用 jsx check；互動類標 manual 待人工審
- 新關卡一律 append 在章節尾端，不插隊——避免打亂既有玩家的解鎖進度
