// 吉祥物：一顆行星的成長史。XP 累積推動它從星際塵埃一路演化到宇宙的最終型態，
// 曲線拉得夠長（0～7000 XP），長期刷題都能感覺到它在變化
export const STAGES = [
  { min: 0, emoji: '🌌', name: '星際塵埃', hint: '答題可以幫它慢慢凝聚' },
  { min: 80, emoji: '☄️', name: '凝聚的微行星', hint: '塵埃開始繞著核心打轉' },
  { min: 200, emoji: '🪨', name: '岩石胚胎', hint: '撞出了第一顆堅硬的核' },
  { min: 380, emoji: '🌑', name: '荒蕪行星', hint: '表面佈滿撞擊坑，安靜運行' },
  { min: 620, emoji: '🌋', name: '熔岩行星', hint: '地心開始沸騰，岩漿四溢' },
  { min: 950, emoji: '🌍', name: '藍色行星', hint: '誕生了海洋，生命的溫床' },
  { min: 1400, emoji: '🪐', name: '環系行星', hint: '周圍凝聚出美麗的星環' },
  { min: 2000, emoji: '⭐', name: '年輕恆星', hint: '自身開始發光發熱' },
  { min: 2800, emoji: '🌟', name: '閃耀恆星', hint: '光芒照亮整個星系一角' },
  { min: 3800, emoji: '💫', name: '超新星爆發', hint: '能量達到頂點，即將蛻變' },
  { min: 5200, emoji: '🌀', name: '絢麗星雲', hint: '爆發後留下的星雲，孕育新生' },
  { min: 7000, emoji: '🕳️', name: '奇異黑洞', hint: '宇宙盡頭的謎，最終型態' },
]

export const getStage = (xp: number) => STAGES.reduce((current, s) => (xp >= s.min ? s : current), STAGES[0])

export const getNextStage = (xp: number) => STAGES.find((s) => s.min > xp) ?? null
