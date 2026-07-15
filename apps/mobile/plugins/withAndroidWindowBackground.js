const { withAndroidStyles } = require('expo/config-plugins');

// Theme.App.SplashScreen／AppTheme 都沒設 android:windowBackground，DayNight 主題會 fallback
// 成白色。Android 冷啟動流程是「靜態 Starting Window（純用 theme 資源畫，不跑任何程式碼）
// → Activity 真正 onCreate 後 installSplashScreen() 疊上 SplashScreenView」，這兩層之間、
// 以及後續切到 AppTheme 那一瞬間，只要任何一層沒有明確的 windowBackground，都會露出系統預設白色，
// 造成「開機圖→白屏→開機圖」這種看起來像閃兩次的效果。把兩個 theme 的 windowBackground 都指到
// 跟啟動畫面同一個顏色（splashscreen_background），讓整段轉場不會露出白色。
function setWindowBackground(style) {
  style.item = [
    ...(style.item ?? []).filter((item) => item.$.name !== 'android:windowBackground'),
    { $: { name: 'android:windowBackground' }, _: '@color/splashscreen_background' },
  ];
}

function withAndroidWindowBackground(config) {
  return withAndroidStyles(config, (config) => {
    for (const name of ['AppTheme', 'Theme.App.SplashScreen']) {
      const style = config.modResults.resources.style?.find((s) => s.$.name === name);
      if (style) {
        setWindowBackground(style);
      }
    }
    return config;
  });
}

module.exports = withAndroidWindowBackground;
