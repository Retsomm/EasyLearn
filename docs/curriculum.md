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

## 產題規則備忘

- 每關 6 題，難度遞增，fill-in 佔 1 題；規格見 `question-format.md`
- 純 JS 題全部要過執行驗證；React 渲染類用 jsx check；互動類標 manual 待人工審
- 新關卡一律 append 在章節尾端，不插隊——避免打亂既有玩家的解鎖進度
