import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  BUDGET_GROUP_LABELS,
  BUDGET_GROUPS,
  CADENCE_OPTIONS,
  DEFAULT_GROUP_PERCENTAGES,
} from '@/constants/budget';
import { Spacing } from '@/constants/theme';
import {
  formatBudgetPeriod,
  getBudgetBounds,
  isValidIsoDate,
  todayIsoDate,
  validateGroupPercentages,
} from '@/domain/budget';
import type {
  Budget,
  BudgetCadence,
  BudgetGroupKey,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '@/domain/budget-types';
import { formatPesoInput, parsePesoInput } from '@/domain/money';
import { ActionButton, ChoiceChips, FormField, StatusBanner } from './budget-ui';

type BudgetFields = {
  amount: string;
  cadence: BudgetCadence;
  startDate: string;
  percentages: Record<BudgetGroupKey, string>;
};

export function NewBudgetForm({
  isSaving,
  onSubmit,
}: {
  isSaving: boolean;
  onSubmit: (input: CreateBudgetInput) => Promise<void>;
}) {
  const [fields, setFields] = useState<BudgetFields>(() => defaultFields());
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const parsed = parseBudgetFields(fields);

  async function submit() {
    if (!parsed) {
      setValidationMessage('Enter a valid amount, date, and whole percentages totaling 100%.');
      return;
    }
    setValidationMessage(null);
    await onSubmit({
      cadence: fields.cadence,
      startDate: fields.startDate,
      receivedCents: parsed.receivedCents,
      needsPercentage: parsed.percentages.needs,
      wantsPercentage: parsed.percentages.wants,
      savingsPercentage: parsed.percentages.savings,
    });
  }

  return (
    <View style={{ gap: Spacing.three }}>
      {validationMessage ? <StatusBanner tone="error" message={validationMessage} /> : null}
      <BudgetCoreFields fields={fields} onChange={setFields} />
      {parsed ? (
        <ThemedText type="small" themeColor="textSecondary">
          Period: {formatBudgetPeriod(parsed.startDate, parsed.endDate)}
        </ThemedText>
      ) : null}
      <ActionButton
        label={isSaving ? 'Creating…' : 'Create budget'}
        disabled={isSaving}
        onPress={() => void submit()}
      />
    </View>
  );
}

export function EditBudgetForm({
  budget,
  isSaving,
  onSubmit,
}: {
  budget: Budget;
  isSaving: boolean;
  onSubmit: (input: UpdateBudgetInput) => Promise<void>;
}) {
  const [fields, setFields] = useState<BudgetFields>(() => ({
    amount: formatPesoInput(budget.receivedCents),
    cadence: budget.cadence,
    startDate: budget.startDate,
    percentages: {
      needs: String(budget.needsPercentage),
      wants: String(budget.wantsPercentage),
      savings: String(budget.savingsPercentage),
    },
  }));
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  async function submit() {
    const parsed = parseBudgetFields(fields);
    if (!parsed) {
      setValidationMessage('Enter a valid amount, date, and whole percentages totaling 100%.');
      return;
    }
    setValidationMessage(null);
    await onSubmit({
      budgetId: budget.id,
      cadence: fields.cadence,
      startDate: fields.startDate,
      receivedCents: parsed.receivedCents,
      needsPercentage: parsed.percentages.needs,
      wantsPercentage: parsed.percentages.wants,
      savingsPercentage: parsed.percentages.savings,
    });
  }

  return (
    <View style={{ gap: Spacing.three }}>
      {validationMessage ? <StatusBanner tone="error" message={validationMessage} /> : null}
      <BudgetCoreFields fields={fields} onChange={setFields} />
      <ThemedText type="small" themeColor="textSecondary">
        Existing records must remain inside the edited date range.
      </ThemedText>
      <ActionButton
        label={isSaving ? 'Saving…' : 'Save budget'}
        disabled={isSaving}
        onPress={() => void submit()}
      />
    </View>
  );
}

function BudgetCoreFields({
  fields,
  onChange,
}: {
  fields: BudgetFields;
  onChange: (fields: BudgetFields) => void;
}) {
  return (
    <>
      <FormField
        label="Received amount"
        value={fields.amount}
        onChangeText={(amount) => onChange({ ...fields, amount })}
        keyboardType="decimal-pad"
        placeholder="₱0.00"
      />
      <ChoiceChips
        label="Budget frequency"
        options={CADENCE_OPTIONS}
        value={fields.cadence}
        onChange={(cadence) => onChange({ ...fields, cadence })}
      />
      <FormField
        label="Start date"
        value={fields.startDate}
        onChangeText={(startDate) => onChange({ ...fields, startDate })}
        placeholder="YYYY-MM-DD"
      />
      {BUDGET_GROUPS.map((groupKey) => (
        <FormField
          key={groupKey}
          label={`${BUDGET_GROUP_LABELS[groupKey]} percentage`}
          value={fields.percentages[groupKey]}
          onChangeText={(value) =>
            onChange({
              ...fields,
              percentages: { ...fields.percentages, [groupKey]: value },
            })
          }
          keyboardType="number-pad"
        />
      ))}
    </>
  );
}

function defaultFields(): BudgetFields {
  return {
    amount: '',
    cadence: 'biweekly',
    startDate: todayIsoDate(),
    percentages: {
      needs: String(DEFAULT_GROUP_PERCENTAGES.needs),
      wants: String(DEFAULT_GROUP_PERCENTAGES.wants),
      savings: String(DEFAULT_GROUP_PERCENTAGES.savings),
    },
  };
}

function parseBudgetFields(fields: BudgetFields) {
  const receivedCents = parsePesoInput(fields.amount);
  const percentages = {
    needs: Number(fields.percentages.needs),
    wants: Number(fields.percentages.wants),
    savings: Number(fields.percentages.savings),
  };
  if (
    !receivedCents ||
    !isValidIsoDate(fields.startDate) ||
    !validateGroupPercentages(percentages)
  ) {
    return null;
  }
  return { receivedCents, percentages, ...getBudgetBounds(fields.cadence, fields.startDate) };
}
