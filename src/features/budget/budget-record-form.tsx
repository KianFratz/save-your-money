import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { RECORD_TYPE_OPTIONS } from '@/constants/budget';
import { Spacing } from '@/constants/theme';
import { formatBudgetIdentity, isValidIsoDate, todayIsoDate } from '@/domain/budget';
import type {
  Budget,
  BudgetRecord,
  BudgetRecordType,
  Category,
  SaveBudgetRecordInput,
} from '@/domain/budget-types';
import { formatPeso, formatPesoInput, parsePesoInput } from '@/domain/money';
import { ActionButton, ChoiceChips, FormField, StatusBanner } from './budget-ui';

export function BudgetRecordForm({
  budgets,
  categories,
  lockedBudget,
  initialRecord,
  isSaving,
  onSubmit,
}: {
  budgets: Budget[];
  categories: Category[];
  lockedBudget?: Budget;
  initialRecord?: BudgetRecord;
  isSaving: boolean;
  onSubmit: (input: SaveBudgetRecordInput) => Promise<void>;
}) {
  const availableBudgets = useMemo(
    () => budgets.filter((budget) => !budget.archived && budget.startDate <= todayIsoDate()),
    [budgets],
  );
  const initialBudgetId =
    lockedBudget?.id ??
    initialRecord?.budgetId ??
    availableBudgets.find((budget) => budget.timing === 'current')?.id ??
    availableBudgets[0]?.id;
  const [type, setType] = useState<BudgetRecordType>(initialRecord?.type ?? 'expenditure');
  const [budgetId, setBudgetId] = useState<number | null>(initialBudgetId ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(initialRecord?.categoryId ?? null);
  const [savingsSourceId, setSavingsSourceId] = useState<number | null>(
    initialRecord?.savingsSourceCategoryId ?? null,
  );
  const [amount, setAmount] = useState(
    initialRecord ? formatPesoInput(initialRecord.amountCents) : '',
  );
  const [effectiveDate, setEffectiveDate] = useState(
    initialRecord?.effectiveDate ?? todayIsoDate(),
  );
  const [description, setDescription] = useState(initialRecord?.description ?? '');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const selectedBudget = lockedBudget ?? availableBudgets.find((budget) => budget.id === budgetId);
  const budgetCategories = selectedBudget?.groups.flatMap((group) => group.categories) ?? [];
  const savingsCategories = categories.filter(
    (category) =>
      !category.archived &&
      category.groupKey === 'savings' &&
      (category.savedBalanceCents > 0 || category.id === initialRecord?.savingsSourceCategoryId),
  );
  const typeOptions = lockedBudget
    ? RECORD_TYPE_OPTIONS.filter((option) => option.value !== 'savings_withdrawal')
    : RECORD_TYPE_OPTIONS;

  async function submit() {
    const amountCents = parsePesoInput(amount);
    if (!amountCents || !isValidIsoDate(effectiveDate) || effectiveDate > todayIsoDate()) {
      setValidationMessage('Enter a valid amount and a date that is not in the future.');
      return;
    }
    if (type === 'savings_withdrawal') {
      if (!savingsSourceId) {
        setValidationMessage('Select the Savings category to withdraw from.');
        return;
      }
      setValidationMessage(null);
      await onSubmit({
        id: initialRecord?.id,
        type,
        amountCents,
        effectiveDate,
        categoryId: savingsSourceId,
        savingsSourceCategoryId: savingsSourceId,
        description,
      });
      return;
    }
    if (!selectedBudget || !categoryId) {
      setValidationMessage('Select a budget and category.');
      return;
    }
    if (effectiveDate < selectedBudget.startDate || effectiveDate > selectedBudget.endDate) {
      setValidationMessage(
        `Choose a date from ${selectedBudget.startDate} to ${selectedBudget.endDate}.`,
      );
      return;
    }
    setValidationMessage(null);
    await onSubmit({
      id: initialRecord?.id,
      budgetId: selectedBudget.id,
      type,
      amountCents,
      effectiveDate,
      categoryId,
      description,
    });
  }

  return (
    <View style={{ gap: Spacing.three }}>
      {validationMessage ? <StatusBanner tone="error" message={validationMessage} /> : null}
      <ChoiceChips label="Record type" options={typeOptions} value={type} onChange={setType} />
      {type !== 'savings_withdrawal' && !lockedBudget ? (
        <ChoiceChips
          label="Budget"
          options={availableBudgets.map((budget) => ({
            value: budget.id,
            label: formatBudgetIdentity(budget.cadence, budget.startDate, budget.endDate),
          }))}
          value={budgetId}
          onChange={(value) => {
            setBudgetId(value);
            setCategoryId(null);
          }}
        />
      ) : null}
      {type === 'savings_withdrawal' ? (
        <ChoiceChips
          label="Savings source"
          options={savingsCategories.map((category) => ({
            value: category.id,
            label: `${category.name} · ${formatPeso(category.savedBalanceCents)}`,
          }))}
          value={savingsSourceId}
          onChange={setSavingsSourceId}
        />
      ) : selectedBudget ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {formatBudgetIdentity(
              selectedBudget.cadence,
              selectedBudget.startDate,
              selectedBudget.endDate,
            )}
          </ThemedText>
          <ChoiceChips
            label="Category"
            options={budgetCategories.map((category) => ({
              value: category.categoryId,
              label: category.categoryName,
            }))}
            value={categoryId}
            onChange={setCategoryId}
          />
        </>
      ) : (
        <StatusBanner message="Create a budget before adding an expenditure or refund." />
      )}
      <FormField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="₱0.00"
      />
      <FormField
        label="Date"
        value={effectiveDate}
        onChangeText={setEffectiveDate}
        placeholder="YYYY-MM-DD"
      />
      <FormField
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <ActionButton
        label={isSaving ? 'Saving…' : initialRecord ? 'Save changes' : 'Add record'}
        disabled={isSaving}
        onPress={() => void submit()}
      />
    </View>
  );
}
