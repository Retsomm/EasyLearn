import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

interface CodeBlockProps {
  code: string;
  // 選項按鈕（Pressable）內部不能放 ScrollView，iOS 上 touchable 會搶走捲動手勢，
  // 這種情境改用 scroll={false} 讓長行直接換行，不強制水平捲動
  scroll?: boolean;
}

// 對照 apps/web CodeBlock.tsx 的輕量語法上色：註解、字串、關鍵字、數字（同一份 regex）
const TOKEN_RE =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|of|in|new|typeof|class|import|export|from|true|false|null|undefined)\b|(\b\d+(?:\.\d+)?\b)/g;

const highlight = (code: string): ReactNode[] => {
  const matches = Array.from(code.matchAll(TOKEN_RE));
  const { parts, last } = matches.reduce<{ parts: ReactNode[]; last: number }>(
    (acc, m, i) => {
      const [text, comment, string, keyword, number] = m;
      const style = comment
        ? styles.tokComment
        : string
          ? styles.tokString
          : keyword
            ? styles.tokKeyword
            : number
              ? styles.tokNumber
              : undefined;
      if (m.index > acc.last) acc.parts.push(code.slice(acc.last, m.index));
      acc.parts.push(
        <Text key={i} style={style}>
          {text}
        </Text>,
      );
      acc.last = m.index + text.length;
      return acc;
    },
    { parts: [], last: 0 },
  );
  return last < code.length ? [...parts, code.slice(last)] : parts;
};

export default function CodeBlock({ code, scroll = true }: CodeBlockProps) {
  if (!code) return null;
  if (!scroll) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.code}>{highlight(code)}</Text>
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap}>
      <Text style={styles.code}>{highlight(code)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.codeBg,
    borderWidth: 1,
    borderColor: 'rgba(95, 240, 224, 0.15)',
    marginVertical: 8,
  },
  code: {
    color: colors.ink,
    fontFamily: fonts.mono.regular,
    fontSize: 13,
    lineHeight: 23,
    padding: 16,
  },
  tokKeyword: { color: '#c792ea' },
  tokString: { color: '#c3e88d' },
  tokNumber: { color: colors.primary },
  tokComment: { color: colors.inkFaint },
});
