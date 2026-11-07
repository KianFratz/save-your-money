import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentRef, Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();
  return (
    <Tabs style={[styles.tabs, { backgroundColor: theme.background }]}>
      <TabList asChild>
        <View style={styles.tabList}>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="budget" href="/budget" asChild>
            <TabButton>Budget</TabButton>
          </TabTrigger>
          <TabTrigger name="transactions" href="/transactions" asChild>
            <TabButton>Activity</TabButton>
          </TabTrigger>
          <TabTrigger name="reports" href="/reports" asChild>
            <TabButton>Reports</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </View>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

function TabButton({ children, isFocused, ref, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  // Expo Router's slot still exposes the pre-strict-API View ref type in SDK 58.
  const pressableRef = ref as unknown as Ref<ComponentRef<typeof Pressable>>;

  return (
    <Pressable
      {...props}
      ref={pressableRef}
      accessibilityRole="tab"
      accessibilityLabel={`${children} tab`}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        {
          backgroundColor: isFocused ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: isFocused ? theme.text : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <ThemedText type="smallBold">{children}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  tabList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    padding: Spacing.two,
  },
  tabButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    justifyContent: 'center',
  },
  slot: { flex: 1 },
});
