import { useState } from 'react';
import { View } from 'react-native';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { BUDGET_GROUP_LABELS, BUDGET_GROUP_OPTIONS, BUDGET_GROUPS } from '@/constants/budget';
import { Spacing } from '@/constants/theme';
import type { BudgetGroupKey } from '@/domain/budget-types';
import { useBudgetData, useClearBudgetErrorOnBlur } from '@/features/budget/budget-data-provider';
import {
  ActionButton,
  ChoiceChips,
  FormField,
  Section,
  StatusBanner,
} from '@/features/budget/budget-ui';

export default function SettingsScreen() {
  const { snapshot, isSaving, errorMessage, createCategory } = useBudgetData();
  const [categoryName, setCategoryName] = useState('');
  const [groupKey, setGroupKey] = useState<BudgetGroupKey>('needs');
  useClearBudgetErrorOnBlur();

  async function addNewCategory() {
    await createCategory({ name: categoryName, groupKey });
    setCategoryName('');
  }

  return (
    <ScreenFrame title="Settings" description="Manage the categories available in new budgets.">
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      <StateMessage
        kind="warning"
        title="Your data stays on this device"
        message="Save Your Money works offline and does not require an account. Removing the app can remove its local data."
      />
      <Section title="Categories">
        {BUDGET_GROUPS.map((group) => (
          <View key={group} style={{ gap: Spacing.one }}>
            <ThemedText type="label" themeColor="textSecondary">
              {BUDGET_GROUP_LABELS[group]}
            </ThemedText>
            <ThemedText>
              {snapshot?.categories
                .filter((category) => category.groupKey === group && !category.archived)
                .map((category) => category.name)
                .join(' · ') || 'No categories'}
            </ThemedText>
          </View>
        ))}
        <FormField
          label="New category name"
          value={categoryName}
          onChangeText={setCategoryName}
          placeholder="e.g. School supplies"
        />
        <ChoiceChips
          label="Budget group"
          options={BUDGET_GROUP_OPTIONS}
          value={groupKey}
          onChange={setGroupKey}
        />
        <ActionButton
          label={isSaving ? 'Adding…' : 'Add category'}
          disabled={isSaving || !categoryName.trim()}
          onPress={() => void addNewCategory()}
        />
      </Section>
    </ScreenFrame>
  );
}
