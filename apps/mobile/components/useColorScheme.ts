// 目前整個 app 先強制走深色主題（不看裝置系統設定），Phase 5/6 做完整視覺前的過渡措施
export const useColorScheme = () => {
  return 'dark' as const;
};
