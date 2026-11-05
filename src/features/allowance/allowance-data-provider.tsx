import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  activatePeriod,
  addAccount,
  addCategory,
  closePeriod,
  createPeriodDraft,
  loadAllowanceSnapshot,
  recordFinancialEvent,
  reopenPeriod,
  updateCategoryAllocation,
} from '@/data/repositories/allowance-repository';
import type {
  AccountType,
  AllowanceSnapshot,
  BudgetGroupKey,
  CreatePeriodInput,
  RecordEventInput,
} from '@/domain/allowance-types';

type AllowanceDataContextValue = {
  snapshot: AllowanceSnapshot | null;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
  createDraft: (input: CreatePeriodInput) => Promise<void>;
  activate: (periodId: number) => Promise<void>;
  close: (periodId: number) => Promise<void>;
  reopen: (periodId: number) => Promise<void>;
  setCategoryAllocation: (
    periodId: number,
    categoryId: number,
    allocatedCents: number,
  ) => Promise<void>;
  recordEvent: (input: RecordEventInput) => Promise<void>;
  createAccount: (input: {
    name: string;
    type: AccountType;
    openingBalanceCents: number;
  }) => Promise<void>;
  createCategory: (input: { name: string; groupKey: BudgetGroupKey }) => Promise<void>;
};

const AllowanceDataContext = createContext<AllowanceDataContextValue | null>(null);

export function AllowanceDataProvider({ children }: PropsWithChildren) {
  const database = useSQLiteContext();
  const [snapshot, setSnapshot] = useState<AllowanceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setSnapshot(await loadAllowanceSnapshot(database));
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [database]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const execute = useCallback(
    async (operation: () => Promise<void>) => {
      setIsSaving(true);
      setErrorMessage(null);
      try {
        await operation();
        setSnapshot(await loadAllowanceSnapshot(database));
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        setErrorMessage(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [database],
  );

  const value = useMemo<AllowanceDataContextValue>(
    () => ({
      snapshot,
      isLoading,
      isSaving,
      errorMessage,
      refresh,
      clearError: () => setErrorMessage(null),
      createDraft: (input) => execute(() => createPeriodDraft(database, input).then(() => undefined)),
      activate: (periodId) => execute(() => activatePeriod(database, periodId)),
      close: (periodId) => execute(() => closePeriod(database, periodId)),
      reopen: (periodId) => execute(() => reopenPeriod(database, periodId)),
      setCategoryAllocation: (periodId, categoryId, allocatedCents) =>
        execute(() => updateCategoryAllocation(database, periodId, categoryId, allocatedCents)),
      recordEvent: (input) => execute(() => recordFinancialEvent(database, input)),
      createAccount: (input) => execute(() => addAccount(database, input)),
      createCategory: (input) => execute(() => addCategory(database, input)),
    }),
    [database, errorMessage, execute, isLoading, isSaving, refresh, snapshot],
  );

  return <AllowanceDataContext.Provider value={value}>{children}</AllowanceDataContext.Provider>;
}

export function useAllowanceData(): AllowanceDataContextValue {
  const context = useContext(AllowanceDataContext);
  if (!context) {
    throw new Error('useAllowanceData must be used within AllowanceDataProvider.');
  }
  return context;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return 'That name or allowance period already exists.';
    }
    return error.message;
  }
  return 'Something went wrong. Try again.';
}
