import { useState } from 'react';
import { View } from 'react-native';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import {
  ACCOUNT_TYPE_OPTIONS,
  BUDGET_GROUPS,
  BUDGET_GROUP_LABELS,
  BUDGET_GROUP_OPTIONS,
} from '@/constants/allowance';
import { Spacing } from '@/constants/theme';
import type { AccountType, BudgetGroupKey } from '@/domain/allowance-types';
import { formatPeso, parsePesoInput } from '@/domain/money';
import {
  useAllowanceData,
  useClearAllowanceErrorOnBlur,
} from '@/features/allowance/allowance-data-provider';
import {
  ActionButton,
  ChoiceChips,
  FormField,
  Section,
  StatusBanner,
} from '@/features/allowance/allowance-ui';

export default function SettingsScreen() {
  useClearAllowanceErrorOnBlur();
  const { snapshot, isSaving, errorMessage, createAccount, createCategory } = useAllowanceData();
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('cash');
  const [openingBalance, setOpeningBalance] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [groupKey, setGroupKey] = useState<BudgetGroupKey>('needs');

  async function addNewAccount() {
    const openingBalanceCents = openingBalance ? parsePesoInput(openingBalance) : 0;
    if (openingBalanceCents === null) return;
    try {
      await createAccount({ name: accountName, type: accountType, openingBalanceCents });
      setAccountName('');
      setOpeningBalance('');
    } catch {
      // The provider exposes a contextual error banner.
    }
  }

  async function addNewCategory() {
    try {
      await createCategory({ name: categoryName, groupKey });
      setCategoryName('');
    } catch {
      // The provider exposes a contextual error banner.
    }
  }

  return (
    <ScreenFrame title="Settings" description="Manage the labels behind your allowance plan.">
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      <StateMessage
        kind="warning"
        title="Your data stays on this device"
        message="Save Your Money works offline and does not require an account. Removing the app can remove its local data."
      />
      <Section title="Your accounts">
        {snapshot?.accounts.map((account) => (
          <View key={account.id} style={{ gap: Spacing.one }}>
            <ThemedText type="smallBold">
              {account.name} · {account.type}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Available {formatPeso(account.balanceCents)}
            </ThemedText>
          </View>
        ))}
        <FormField
          label="New account name"
          value={accountName}
          onChangeText={setAccountName}
          placeholder="e.g. MariBank"
        />
        <ChoiceChips
          label="Account type"
          options={ACCOUNT_TYPE_OPTIONS}
          value={accountType}
          onChange={setAccountType}
        />
        <FormField
          label="Opening balance (optional)"
          value={openingBalance}
          onChangeText={setOpeningBalance}
          keyboardType="decimal-pad"
          placeholder="₱0.00"
        />
        <ActionButton
          label={isSaving ? 'Adding…' : 'Add account'}
          disabled={isSaving || !accountName.trim()}
          onPress={() => void addNewAccount()}
        />
      </Section>
      <Section title="Categories">
        {BUDGET_GROUPS.map((group) => (
          <View key={group} style={{ gap: Spacing.one }}>
            <ThemedText type="label" themeColor="textSecondary">
              {BUDGET_GROUP_LABELS[group]}
            </ThemedText>
            <ThemedText>
              {snapshot?.categories
                .filter((category) => category.groupKey === group)
                .map((category) => category.name)
                .join(' · ')}
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
