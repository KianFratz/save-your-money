import { useState } from 'react';
import { Alert } from 'react-native';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { RECORD_TYPE_LABELS } from '@/constants/budget';
import type { BudgetRecord, BudgetRecordType, SaveBudgetRecordInput } from '@/domain/budget-types';
import { formatBudgetIdentity } from '@/domain/budget';
import { useBudgetData, useClearBudgetErrorOnBlur } from '@/features/budget/budget-data-provider';
import { BudgetRecordForm } from '@/features/budget/budget-record-form';
import {
  ActionButton,
  ChoiceChips,
  FormField,
  ModalFrame,
  RecordList,
  Section,
  StatusBanner,
} from '@/features/budget/budget-ui';

type TypeFilter = BudgetRecordType | 'all';

export default function ActivityScreen() {
  const { snapshot, isLoading, isSaving, errorMessage, saveRecord, removeRecord } = useBudgetData();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BudgetRecord | undefined>();
  const [budgetFilter, setBudgetFilter] = useState<number>(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  useClearBudgetErrorOnBlur();

  const records = (snapshot?.records ?? []).filter((record) => {
    if (budgetFilter !== 0 && record.budgetId !== budgetFilter) return false;
    if (typeFilter !== 'all' && record.type !== typeFilter) return false;
    if (fromDate && record.effectiveDate < fromDate) return false;
    if (toDate && record.effectiveDate > toDate) return false;
    return true;
  });

  async function submit(input: SaveBudgetRecordInput) {
    await saveRecord(input);
    setShowForm(false);
    setEditingRecord(undefined);
  }

  function confirmDelete(record: BudgetRecord) {
    if (
      record.budgetId &&
      snapshot?.budgets.find((budget) => budget.id === record.budgetId)?.archived
    ) {
      Alert.alert('Archived budget', 'Restore this budget before changing its records.');
      return;
    }
    Alert.alert('Delete this record?', 'Budget and savings totals will update immediately.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeRecord(record.id) },
    ]);
  }

  return (
    <ScreenFrame
      title="Activity"
      description="One ledger for expenditures, refunds, and Savings withdrawals."
      floatingAction={
        <ActionButton
          label="Add"
          accessibilityLabel="Add record"
          onPress={() => setShowForm(true)}
        />
      }>
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      {isLoading && !snapshot ? (
        <StateMessage kind="loading" title="Loading activity" message="Reading your ledger." />
      ) : null}
      <Section title="Filters">
        <ChoiceChips
          label="Budget"
          options={[
            { value: 0, label: 'All budgets' },
            ...(snapshot?.budgets ?? []).map((budget) => ({
              value: budget.id,
              label: formatBudgetIdentity(budget.cadence, budget.startDate, budget.endDate),
            })),
          ]}
          value={budgetFilter}
          onChange={setBudgetFilter}
        />
        <ChoiceChips
          label="Record type"
          options={[
            { value: 'all' as const, label: 'All types' },
            ...Object.entries(RECORD_TYPE_LABELS).map(([value, label]) => ({
              value: value as BudgetRecordType,
              label,
            })),
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <FormField
          label="From date (optional)"
          value={fromDate}
          onChangeText={setFromDate}
          placeholder="YYYY-MM-DD"
        />
        <FormField
          label="To date (optional)"
          value={toDate}
          onChangeText={setToDate}
          placeholder="YYYY-MM-DD"
        />
      </Section>
      <Section title="Ledger">
        <RecordList
          records={records}
          onEdit={(record) => {
            if (
              record.budgetId &&
              snapshot?.budgets.find((budget) => budget.id === record.budgetId)?.archived
            ) {
              Alert.alert('Archived budget', 'Restore this budget before changing its records.');
              return;
            }
            setEditingRecord(record);
            setShowForm(true);
          }}
          onDelete={confirmDelete}
          emptyMessage="No records match these filters."
        />
      </Section>
      <ModalFrame
        visible={showForm}
        title={editingRecord ? 'Edit record' : 'Add record'}
        description="Every expenditure and refund belongs to one budget."
        onClose={() => {
          setShowForm(false);
          setEditingRecord(undefined);
        }}>
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        <BudgetRecordForm
          key={editingRecord?.id ?? 'new'}
          budgets={snapshot?.budgets ?? []}
          categories={snapshot?.categories ?? []}
          initialRecord={editingRecord}
          isSaving={isSaving}
          onSubmit={submit}
        />
      </ModalFrame>
    </ScreenFrame>
  );
}
