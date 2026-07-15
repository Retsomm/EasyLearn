# Grokking Simplicity 各章節練習題

> 題型包含【觀念】【選擇】【程式實作】【情境分析】，題數依章節難易度配置。

---

## Part 1：Actions、Calculations、Data

### Ch1 歡迎來到 Grokking Simplicity（★ 入門，3 題）

1. 【觀念】本書如何定義函數式程式設計（FP）？它和「避免副作用」的傳統定義有什麼不同？
2. 【觀念】為什麼作者說「副作用是我們寫程式的目的之一」，卻又要學會控制它？
3. 【選擇】下列何者是 pure function 的特性？
   (A) 每次呼叫結果可能不同 (B) 相同輸入永遠得到相同輸出 (C) 會修改全域變數 (D) 依賴呼叫時間

### Ch2 功能全覽（★ 入門，3 題)

1. 【觀念】本書 Part 1 與 Part 2 各自的核心技能是什麼？
2. 【觀念】什麼是「分層設計（stratified design）」？用一句話描述它想解決的問題。
3. 【觀念】timeline diagram（時間線圖）用來分析什麼樣的程式問題？

### Ch3 區分 Actions、Calculations、Data（★★ 基礎，5 題）

1. 【觀念】請分別定義 Action、Calculation、Data，並各舉一個 JavaScript 的例子。
2. 【選擇】下列何者是 Action？
   (A) `sum(a, b)` (B) `sendEmail(to, body)` (C) 字串 `"best"` (D) `arr.slice(0, 3)`
3. 【觀念】為什麼說「Action 會傳染（擴散）」？呼叫 Action 的函式會變成什麼？
4. 【情境分析】規劃一個「訂閱者優惠券寄送」流程，哪些步驟是 Data、哪些是 Calculation、哪些是 Action？
5. 【觀念】為什麼函數式程式設計師偏好 Data > Calculation > Action 這個順序？

### Ch4 從 Actions 中萃取 Calculations（★★★ 中等，6 題）

1. 【觀念】什麼是「隱性輸入（implicit input）」與「隱性輸出（implicit output）」？各舉一例。
2. 【觀念】把隱性輸入/輸出改成顯性的方式分別是什麼？
3. 【程式實作】重構下列程式，將計算從 Action 中萃取出來：
   ```js
   var shopping_cart_total = 0;
   function calc_total() {
     shopping_cart_total = 0;
     for (var i = 0; i < shopping_cart.length; i++)
       shopping_cart_total += shopping_cart[i].price;
   }
   ```
4. 【觀念】萃取 Calculation 之後，程式在「可測試性」與「可重用性」上各有什麼具體改善？
5. 【選擇】一個函式讀取全域變數但不修改任何東西，它是？
   (A) Calculation (B) Action (C) Data (D) 視回傳值而定
6. 【情境分析】MegaMart 的「免運費圖示」功能：為什麼直接在 `calc_cart_total()` 裡塞 DOM 更新會讓程式難以測試？該怎麼拆？

### Ch5 改善 Actions 的設計（★★ 基礎，5 題）

1. 【觀念】「讓隱性輸入輸出愈少愈好」這個原則，即使函式仍是 Action，為什麼還是值得做？
2. 【程式實作】將下列函式的全域變數改成參數傳入：
   ```js
   function add_item_to_cart(name, price) {
     shopping_cart = add_item(shopping_cart, name, price);
     calc_cart_total();
   }
   ```
3. 【觀念】什麼是「依照使用情境拆分函式」？為什麼把大函式拆小有助於重用？
4. 【觀念】函式名稱中出現「隱含參數（implicit argument in function name）」是什麼壞味道？例如 `setPriceByName`、`setQuantityByName`。
5. 【情境分析】cart 相關函式和 business rule 相關函式為什麼應該分開放？

### Ch6 在可變語言中保持不可變：Copy-on-Write（★★★ 中等，6 題）

1. 【觀念】copy-on-write 的三步驟是什麼？（複製 → ？ → ？）
2. 【程式實作】用 copy-on-write 實作 `add_element_last(array, elem)`，不能修改原陣列。
3. 【程式實作】寫一個 copy-on-write 版本的 `removeItems(array, idx, count)`。
4. 【觀念】「讀取（read）」與「寫入（write）」對不可變資料結構而言，為什麼讀取會變成 Calculation？
5. 【觀念】什麼是結構共享（structural sharing）？為什麼淺拷貝（shallow copy）搭配結構共享是安全又有效率的？
6. 【選擇】一個函式同時「讀取並寫入」同一筆資料（例如 `array.shift()`），copy-on-write 的處理策略是？
   (A) 直接禁用 (B) 拆成讀取函式與寫入函式，或回傳兩個值 (C) 深拷貝整個物件 (D) 加上鎖

### Ch7 與不可信任的程式碼共處：Defensive Copying（★★ 基礎，5 題）

1. 【觀念】defensive copying 的兩條規則是什麼？（資料進入/離開安全區時各要做什麼？）
2. 【觀念】copy-on-write 和 defensive copying 的使用時機有什麼不同？
3. 【程式實作】某個 legacy 函式 `black_friday_promotion(cart)` 會直接修改傳入的 cart，請用 defensive copying 包裝它。
4. 【選擇】對於包含可變巢狀結構（nested mutable structures）的資料，defensive copying 跨越信任邊界時通常使用的是？
   (A) 淺拷貝 (B) 深拷貝 (C) 結構共享 (D) 視資料結構與修改範圍而定
5. 【觀念】為什麼深拷貝比淺拷貝昂貴？什麼情況下才值得用？

### Ch8 分層設計（一）（★★★ 中等，6 題）

1. 【觀念】什麼是分層設計（stratified design）？「層」是依照什麼來劃分的？
2. 【觀念】「函式體的長度和複雜度」如何暗示這個函式所在的抽象層級是否恰當？
3. 【觀念】呼叫圖（call graph）中，箭頭「長短不一」代表什麼設計問題？
4. 【情境分析】`freeTieClip()` 直接操作陣列 index 和 for 迴圈，為什麼是層級混雜的訊號？該怎麼改？
5. 【觀念】「同一層的函式應該服務同一個目的」——請說明這條設計原則。
6. 【程式實作】給定 cart 操作散落在各處的程式，請規劃一組「cart 基本操作層」的函式清單（只需列出函式簽名）。

### Ch9 分層設計（二）（★★★ 中等，6 題）

1. 【觀念】什麼是抽象屏障（abstraction barrier）？它讓屏障上下的工程師各自忽略什麼？
2. 【觀念】什麼時候「該用」抽象屏障？什麼時候是過度設計？
3. 【情境分析】若把 cart 的實作從陣列換成物件（hash map），抽象屏障如何讓上層程式碼完全不用改？
4. 【觀念】「愈下層的程式碼應該愈穩定、愈少改動」——為什麼？這和測試策略有什麼關係？
5. 【觀念】呼叫圖中，函式的位置（高度）如何影響它的「可測試價值」與「重用價值」？
6. 【選擇】下列何者最適合放在最底層？
   (A) 商業促銷規則 (B) 陣列的 copy-on-write 基本操作 (C) 行銷活動流程 (D) UI 更新

---

## Part 2：First-Class 抽象

### Ch10 First-Class Functions（一）（★★★ 中等，6 題）

1. 【觀念】「first-class」是什麼意思？JavaScript 中哪些東西是 first-class？哪些不是（例如 `+`、`if`）？
2. 【觀念】什麼是「函式名稱中的隱含參數」壞味道？對應的重構手法「將隱含參數顯性化（express implicit argument）」怎麼做？
3. 【程式實作】把 `setPriceByName`、`setQuantityByName`、`setShippingByName` 重構成一個 `setFieldByName(cart, name, field, value)`。
4. 【觀念】什麼是高階函式（higher-order function）？它可以做到一般函式做不到的什麼事？
5. 【程式實作】用「將程式碼包成函式再傳入」的手法（replace body with callback），寫一個 `withLogging(f)` 讓任何程式碼片段都被 try/catch 包住。
6. 【選擇】把字串當欄位名傳入（如 `'price'`）會不會破壞抽象屏障？作者的看法是？
   (A) 一定會，禁止 (B) 不會，欄位名本來就是 API 的一部分，可搭配檢查 (C) 要改用 enum (D) 要用 symbol

### Ch11 First-Class Functions（二）：回傳函式（★★★ 中等，6 題）

1. 【觀念】「回傳函式的函式」（function factory）解決了什麼重複問題？
2. 【程式實作】寫一個 `wrapLogging(f)`，回傳一個「執行 f 並在出錯時記 log」的新函式。
3. 【程式實作】用 copy-on-write 的共通模式，寫出 `wrapArrayCopyOnWrite(f)`：複製陣列 → 執行 f 修改副本 → 回傳副本。
4. 【觀念】比較「傳入函式」與「回傳函式」兩種高階函式用法的差別與適用場景。
5. 【選擇】`function makeAdder(n) { return function(x) { return n + x; }; }` 中，內層函式能存取 `n` 是因為？
   (A) 全域變數 (B) closure（閉包） (C) this 綁定 (D) hoisting
6. 【情境分析】團隊常忘記幫新函式加上錯誤處理，你會如何用高階函式建立「自動加上錯誤處理」的機制？

### Ch12 走訪陣列的函數式工具（★★★★ 進階，7 題）

1. 【觀念】`map()`、`filter()`、`reduce()` 各自的輸入、輸出、適用時機是什麼？
2. 【程式實作】不用內建方法，自己實作 `map(array, f)`。
3. 【程式實作】不用內建方法，自己實作 `filter(array, f)`。
4. 【程式實作】不用內建方法，自己實作 `reduce(array, init, f)`。
5. 【程式實作】用 `reduce()` 實作出 `map()` 和 `filter()`。
6. 【選擇】`map()` 回傳的陣列長度、`filter()` 回傳的陣列長度，與原陣列的關係分別是？
   (A) 相同／相同 (B) 相同／小於等於 (C) 小於等於／相同 (D) 不一定／不一定
7. 【情境分析】給定顧客清單，找出「只下過一筆訂單的顧客的 email」——請用 map/filter 組合完成，並說明每一步的資料形狀。

### Ch13 串連函數式工具（★★★★ 進階，7 題）

1. 【觀念】什麼是「鏈式呼叫（chaining）」？多步驟串連時，如何讓每一步的意圖清楚（命名中間結果 vs 內嵌 callback）？
2. 【程式實作】找出「每位最佳顧客（訂單 ≥ 3 筆）金額最大的一筆訂單」，請用 filter + map（內含 reduce）完成。
3. 【觀念】什麼是 stream fusion？它解決 chaining 的什麼效能疑慮？
4. 【程式實作】實作 `frequenciesBy(array, f)`：回傳以 `f(item)` 為 key、出現次數為 value 的物件。
5. 【程式實作】實作 `groupBy(array, f)`：回傳以 `f(item)` 為 key、符合項目陣列為 value 的物件。
6. 【觀念】「把迴圈重構成函數式工具」的兩個訣竅是什麼？（提示：拆出資料、一次做一件事）
7. 【情境分析】有一段 60 行的 for 迴圈同時做了篩選、轉換、加總三件事，請描述你的重構步驟與最終樣貌。

### Ch14 處理巢狀資料的函數式工具（★★★★ 進階，7 題）

1. 【程式實作】實作 `update(object, key, modify)`：回傳 key 對應值被 `modify` 處理過的新物件（copy-on-write）。
2. 【程式實作】用 `update()` 重構：`incrementField(item, field)`、`decrementField(item, field)` 等重複函式。
3. 【程式實作】實作 `update2(object, key1, key2, modify)` 處理兩層巢狀。
4. 【程式實作】實作遞迴版 `nestedUpdate(object, keys, modify)` 處理任意深度。
5. 【觀念】遞迴的三個安全守則是什麼？（基本情況、遞迴呼叫、往基本情況前進）
6. 【觀念】深層巢狀路徑（如 `['shirt', 'options', 'color']`）會造成什麼理解負擔？抽象屏障如何緩解？
7. 【選擇】`nestedUpdate(obj, [], f)` 的基本情況應該回傳什麼？
   (A) `obj` (B) `f(obj)` (C) `undefined` (D) 拋出錯誤

### Ch15 時間線拆解：分析執行順序（★★★★★ 困難，8 題）

1. 【觀念】timeline diagram 的兩條基本規則是什麼？（同一時間線上的動作順序執行；不同時間線上的動作可能交錯）
2. 【觀念】哪些東西會建立新的時間線？（提示：非同步 callback、event handler、其他執行緒…）
3. 【程式實作】畫出（用文字描述即可）以下程式的時間線圖：按鈕 click handler 呼叫 `add_item_to_cart()`，其中 `cost_ajax()` 與 `shipping_ajax()` 是非同步請求。
4. 【觀念】為什麼「快速連點兩次購買鈕」會導致總金額錯誤？請用時間線交錯來解釋。
5. 【觀念】簡化時間線圖的原則有哪些？（合併同一時間線的連續動作、去除不影響共享資源的步驟…）
6. 【程式實作】把 handler 中的全域變數改成區域變數與參數傳遞，減少時間線之間的共享資源。請重構：
   ```js
   var total = 0;
   function add_item_to_cart(item) {
     cart = add_item(cart, item);
     update_total_queue(cart);
   }
   ```
7. 【選擇】JavaScript 是單執行緒、事件迴圈模型，這代表？
   (A) 不會有時序問題 (B) 同步程式碼不會被打斷，但非同步 callback 之間仍可能交錯 (C) 不需要時間線圖 (D) 所有 Action 都安全
8. 【情境分析】列出你目前專案中一個「非同步造成的 bug」，用時間線圖的概念解釋它的成因。

### Ch16 在時間線之間共享資源（★★★★★ 困難，8 題）

1. 【觀念】什麼是並行原語（concurrency primitive）？為什麼 JavaScript 需要自己動手建？
2. 【觀念】Queue（佇列）如何保證「共享資源一次只被一條時間線使用」？
3. 【程式實作】實作一個基本的 `Queue()`：`push(task)` 傳入的 `task` 是一個回傳 `Promise<void>` 的函式；佇列依序執行，前一個 `task` 的 promise resolve 後才跑下一個。若某個 `task` reject，說明你的佇列是繼續處理後續任務，還是中斷／記錄錯誤。
4. 【程式實作】把上一題泛化成可重用的 `Queue(worker)`：`worker(task)` 是呼叫端傳入、回傳 `Promise<void>` 的函式，佇列對每個 `push` 進來的 `task` 依序呼叫 `worker(task)` 並等待其 resolve/reject 後才處理下一個；worker reject 時佇列應記錄錯誤但繼續處理後續任務，不能整條佇列卡死。
5. 【觀念】什麼是「skip queue」（只保留最後一筆任務的佇列）？什麼情境適用？
6. 【程式實作】實作 `DroppingQueue(max, worker)`：`worker` 的非同步契約與上題相同，佇列中尚未執行的任務超過 max 筆時丟棄最舊的任務。
7. 【選擇】購物車 DOM 更新用 Queue 排隊後，解決的是哪一種時間線問題？
   (A) 動作太慢 (B) 不同時間線對共享資源（DOM/全域 cart）的交錯寫入 (C) 記憶體洩漏 (D) callback hell
8. 【情境分析】前端有個「自動儲存」功能，使用者連續輸入會發出多個儲存請求且可能亂序完成。你會用哪種 queue？為什麼？

### Ch17 協調時間線（★★★★★ 困難，8 題）

1. 【觀念】什麼是 race condition？用「兩個 ajax 回應順序不定」的例子說明。
2. 【程式實作】實作 `Cut(num, callback)`：回傳一個「完成通知函式」`done(result)`，`num` 條時間線各自完成時呼叫一次；等所有 `num` 條時間線都呼叫過 `done` 後，才執行一次 `callback(results)`，其中 `results` 依呼叫順序收集成陣列。說明若某條時間線出錯或逾時、從未呼叫 `done`，你的實作會怎麼處理（避免永久等待）。
3. 【程式實作】用 `Cut()` 改寫：`cost_ajax()` 與 `shipping_ajax()` 平行發出，兩者都完成後才更新 DOM。
4. 【程式實作】實作 `JustOnce(action)`：不管被呼叫幾次，action 只會執行第一次。
5. 【觀念】「顯性的時間模型 vs 隱性的時間模型」是什麼意思？Cut/Queue/JustOnce 各自改變了時間模型的哪個面向（順序/重複）？
6. 【觀念】什麼是冪等（idempotent）？為什麼冪等的 Action 比較安全？
7. 【選擇】平行執行兩個非同步請求再彙整結果，若不用書中的 `Cut()`，現代 JavaScript 對應的原生做法是？
   (A) `setTimeout` (B) `Promise.all` (C) `for await` (D) `Array.map`
8. 【情境分析】分析「多次點擊 + 平行請求 + 順序不定」三種情況下，你設計的結帳流程分別會發生什麼事？如何各個擊破？

### Ch18 反應式架構與洋蔥架構（★★★ 中等，6 題）

1. 【觀念】什麼是反應式架構（reactive architecture）？「把『改了 X 之後要做什麼』反轉成『當 X 改變時自動做什麼』」帶來什麼好處？
2. 【程式實作】實作 `ValueCell(initialValue)`：具有 `val()`、`update(f)`、`addWatcher(f)` 三個方法。
3. 【程式實作】基於 ValueCell 實作 `FormulaCell(upstreamCell, f)`：上游改變時自動重算。
4. 【觀念】洋蔥架構（onion architecture）的三層是什麼？每一層放什麼東西？（互動層／領域層／語言層）
5. 【觀念】「領域層應該全部是 Calculation」——為什麼？「讀資料庫」為什麼被歸在互動層？
6. 【情境分析】你的 React 專案中，state 管理（如 signals、observable）和 ValueCell 的概念有何相似之處？

### Ch19 前往函數式未來之路（★ 入門，3 題）

1. 【觀念】本書的兩大核心技能（Part 1 / Part 2）分別是什麼？各解鎖了哪些延伸技能？
2. 【觀念】作者建議的後續學習方向有哪些？（提示：學一門 FP 語言如 Haskell/Clojure/Elixir/Swift…、經典書籍如 SICP）
3. 【情境分析】回顧你目前的專案，列出三個可以立即套用本書技巧的地方，並說明用哪一章的手法。

---

## 使用建議

- **入門章節**：讀完直接口頭回答即可。
- **程式實作題**：建議實際打開編輯器動手寫，寫完可以貼回來讓我批改。
- **情境分析題**：沒有標準答案，重點是套用書中的思考框架。

需要任何一章的「詳解與參考答案」，隨時告訴我章節編號即可。
