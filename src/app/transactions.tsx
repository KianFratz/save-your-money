import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { EVENT_TYPE_OPTIONS } from '@/constants/allowance';
import { Spacing } from '@/constants/theme';
import { formatPeriodLabel, isValidIsoDate, todayIsoDate } from '@/domain/allowance';
import type { FinancialEventType } from '@/domain/allowance-types';
import { formatPeso, parsePesoInput } from '@/domain/money';
import {
  useAllowanceData,
  useClearAllowanceErrorOnBlur,
} from '@/features/allowance/allowance-data-provider';
import {
  ActionButton,
  ChoiceChips,
  EventList,
  FormField,
  Section,
  StatusBanner,
} from '@/features/allowance/allowance-ui';

export default function TransactionsScreen() {
  useClearAllowanceErrorOnBlur();
  const { snapshot, isLoading, isSaving, errorMessage, clearError, recordEvent, applyLeftover } =
    useAllowanceData();
  const period = snapshot?.activePeriod ?? null;
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<FinancialEventType>('use');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [savingsSourceId, setSavingsSourceId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [showHeldForm, setShowHeldForm] = useState(false);
  const [sourcePeriodId, setSourcePeriodId] = useState<number | null>(null);
  const [heldAmount, setHeldAmount] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const accountOptions = useMemo(
    () => snapshot?.accounts.map((account) => ({ value: account.id, label: account.name })) ?? [],
    [snapshot?.accounts],
  );
  const currentPeriodCategoryOptions = useMemo(
    () =>
      period?.groups
        .flatMap((group) =>
          group.categories
            .filter((category) => type !== 'refund' || category.usedCents > 0)
            .map((category) => ({
              value: category.categoryId,
              label: category.categoryName,
            })),
        )
        .filter((category) =>
          category.label.toLocaleLowerCase().includes(categorySearch.trim().toLocaleLowerCase()),
        ) ?? [],
    [categorySearch, period, type],
  );
  const savedMoneyTargetOptions = useMemo(
    () =>
      snapshot?.categories
        .filter((category) =>
          category.name.toLocaleLowerCase().includes(categorySearch.trim().toLocaleLowerCase()),
        )
        .map((category) => ({ value: category.id, label: category.name })) ?? [],
    [categorySearch, snapshot?.categories],
  );
  const savingsOptions = useMemo(
    () =>
      snapshot?.categories
        .filter((category) => category.groupKey === 'savings' && category.savedBalanceCents > 0)
        .map((category) => ({
          value: category.id,
          label: `${category.name} · ${formatPeso(category.savedBalanceCents)} saved`,
        })) ?? [],
    [snapshot?.categories],
  );
  const heldPeriodOptions = useMemo(
    () =>
      snapshot?.periods
        .filter((candidate) => candidate.state === 'closed' && candidate.sisterHeldCents > 0)
        .map((candidate) => ({
          value: candidate.id,
          label: `${formatPeriodLabel(candidate.startDate, candidate.endDate)} · ${formatPeso(candidate.sisterHeldCents)}`,
        })) ?? [],
    [snapshot?.periods],
  );
  const needsAccount = type === 'disbursement' || type === 'return';
  const needsCategory = type === 'use' || type === 'refund' || type === 'saved_money_use';
  const dateIssue = getDateIssue(date, type === 'saved_money_use' ? null : period);
  const isValid =
    parsePesoInput(amount) !== null &&
    dateIssue === null &&
    (!needsAccount || accountId !== null) &&
    (!needsCategory || categoryId !== null) &&
    (type !== 'saved_money_use' || savingsSourceId !== null) &&
    (type === 'saved_money_use' || period !== null);

  async function submit() {
    const amountCents = parsePesoInput(amount);
    if (amountCents === null) return;
    try {
      await recordEvent({
        periodId: type === 'saved_money_use' ? undefined : period?.id,
        type,
        amountCents,
        effectiveDate: date,
        accountId: accountId ?? undefined,
        categoryId: categoryId ?? undefined,
        savingsSourceCategoryId: savingsSourceId ?? undefined,
        note,
      });
      setAmount('');
      setNote('');
      setShowForm(false);
    } catch {
      // The provider exposes a contextual error banner.
    }
  }

  async function submitHeldMoney() {
    const amountCents = parsePesoInput(heldAmount);
    if (!period || sourcePeriodId === null || amountCents === null) return;
    try {
      await applyLeftover({
        sourcePeriodId,
        targetPeriodId: period.id,
        amountCents,
        effectiveDate: date,
        note,
      });
      setHeldAmount('');
      setShowHeldForm(false);
    } catch {
      // The provider exposes a contextual error banner.
    }
  }

  if (isLoading && !snapshot) {
    return (
      <ScreenFrame title="Activity" description="Loading your entries…">
        <StateMessage kind="loading" title="Loading activity" message="One moment." />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      title="Activity"
      description="Record every movement without charging your account twice.">
      {errorMessage && !showForm && !showHeldForm ? (
        <StatusBanner tone="error" message={errorMessage} />
      ) : null}
      <ActionButton
        label={showForm ? 'Cancel entry' : 'Add entry'}
        tone={showForm ? 'secondary' : 'primary'}
        onPress={() => {
          clearError();
          setShowForm((shown) => !shown);
        }}
      />
      {heldPeriodOptions.length > 0 ? (
        <ActionButton
          label={showHeldForm ? 'Cancel held money' : 'Apply money already held'}
          tone="secondary"
          onPress={() => setShowHeldForm((shown) => !shown)}
        />
      ) : null}
      {showHeldForm ? (
        <View style={{ gap: Spacing.three }}>
          <ChoiceChips
            label="From closed period"
            options={heldPeriodOptions}
            value={sourcePeriodId}
            onChange={setSourcePeriodId}
          />
          <FormField
            label="Amount to apply"
            value={heldAmount}
            onChangeText={setHeldAmount}
            keyboardType="decimal-pad"
            placeholder="₱0.00"
          />
          <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          {getDateIssue(date, period) ? (
            <StatusBanner message={getDateIssue(date, period) ?? ''} />
          ) : null}
          <ActionButton
            label={isSaving ? 'Applying…' : 'Apply to current allowance'}
            disabled={
              isSaving ||
              !period ||
              sourcePeriodId === null ||
              parsePesoInput(heldAmount) === null ||
              getDateIssue(date, period) !== null
            }
            onPress={() => void submitHeldMoney()}
          />
          {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        </View>
      ) : null}
      {showForm ? (
        <View style={{ gap: Spacing.three }}>
          <ChoiceChips
            label="Entry type"
            options={EVENT_TYPE_OPTIONS}
            value={type}
            onChange={setType}
          />
          {type !== 'saved_money_use' && !period ? (
            <StatusBanner message="Activate an allowance period before recording this entry." />
          ) : null}
          <FormField
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="₱0.00"
          />
          <FormField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          {dateIssue ? <StatusBanner message={dateIssue} /> : null}
          {needsAccount ? (
            <ChoiceChips
              label="Your account"
              options={accountOptions}
              value={accountId}
              onChange={setAccountId}
            />
          ) : null}
          {type === 'saved_money_use' ? (
            <ChoiceChips
              label="Savings source"
              options={savingsOptions}
              value={savingsSourceId}
              onChange={setSavingsSourceId}
            />
          ) : null}
          {needsCategory ? (
            <>
              <FormField
                label="Find category"
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="Type a category name"
              />
              <ChoiceChips
                label={type === 'saved_money_use' ? 'What it funded' : 'Category'}
                options={
                  type === 'saved_money_use'
                    ? savedMoneyTargetOptions
                    : currentPeriodCategoryOptions
                }
                value={categoryId}
                onChange={setCategoryId}
              />
            </>
          ) : null}
          <FormField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Add context"
            multiline
          />
          <ActionButton
            label={isSaving ? 'Saving…' : 'Save entry'}
            disabled={isSaving || !isValid}
            onPress={() => void submit()}
          />
          {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        </View>
      ) : null}
      <Section title="Ledger">
        <EventList events={snapshot?.recentEvents ?? []} />
      </Section>
    </ScreenFrame>
  );
}

function getDateIssue(
  date: string,
  period: { startDate: string; endDate: string } | null,
): string | null {
  if (!isValidIsoDate(date)) return 'Enter a valid calendar date.';
  if (date > todayIsoDate()) return 'Future entries are not allowed.';
  if (period && (date < period.startDate || date > period.endDate)) {
    return `Choose a date from ${period.startDate} to ${period.endDate}.`;
  }
  return null;
}
