import { ScrollView, StyleSheet, Text } from 'react-native';

interface CodeBlockProps {
  code: string;
}

// Phase 3 MVP：純等寬字體顯示，不做 web 版 CodeBlock.tsx 那種語法上色
export default function CodeBlock({ code }: CodeBlockProps) {
  if (!code) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap}>
      <Text style={styles.code}>{code}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    marginVertical: 10,
  },
  code: {
    color: '#e2e2f0',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
});
