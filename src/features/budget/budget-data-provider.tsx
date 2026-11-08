import { useFocusEffect } from 'expo-router';
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
  addCategory,
  createBudget,
  deleteBudgetRecord,
  deleteEmptyBudget,
  loadBudgetSnapshot,
  saveBudgetRecord,
  setBudgetArchived,
  updateBudget,
} from '@/data/repositories/budget-repository';
import type {
  BudgetGroupKey,
  BudgetSnapshot,
  CreateBudgetInput,
  SaveBudgetRecordInput,
  UpdateBudgetInput,
} from '@/domain/budget-types';

type BudgetDataContextValue = {
  snapshot: BudgetSnapshot | null;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
  create: (input: CreateBudgetInput) => Promise<number>;
  update: (input: UpdateBudgetInput) => Promise<void>;
  archive: (budgetId: number) => Promise<void>;
  restore: (budgetId: number) => Promise<void>;
  removeEmpty: (budgetId: number) => Promise<void>;
  saveRecord: (input: SaveBudgetRecordInput) => Promise<void>;
  removeRecord: (recordId: number) => Promise<void>;
  createCategory: (input: { name: string; groupKey: BudgetGroupKey }) => Promise<void>;
};

const BudgetDataContext = createContext<BudgetDataContextValue | null>(null);

export function BudgetDataProvider({ children }: PropsWithChildren) {
  const database = useSQLiteContext();
  const [snapshot, setSnapshot] = useState<BudgetSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const clearError = useCallback(() => setErrorMessage(null), []);

  const load = useCallback(async () => {
    const nextSnapshot = await loadBudgetSnapshot(database);
    setSnapshot(nextSnapshot);
    setErrorMessage(null);
    return nextSnapshot;
  }, [database]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await load();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void loadBudgetSnapshot(database)
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [database]);

  const execute = useCallback(
    async <Result,>(operation: () => Promise<Result>): Promise<Result> => {
      setIsSaving(true);
      setErrorMessage(null);
      try {
        const result = await operation();
        await load();
        return result;
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        setErrorMessage(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [load],
  );

  const value = useMemo<BudgetDataContextValue>(
    () => ({
      snapshot,
      isLoading,
      isSaving,
      errorMessage,
      refresh,
      clearError,
      create: (input) => execute(() => createBudget(database, input)),
      update: (input) => execute(() => updateBudget(database, input)),
      archive: (budgetId) => execute(() => setBudgetArchived(database, budgetId, true)),
      restore: (budgetId) => execute(() => setBudgetArchived(database, budgetId, false)),
      removeEmpty: (budgetId) => execute(() => deleteEmptyBudget(database, budgetId)),
      saveRecord: (input) => execute(() => saveBudgetRecord(database, input)),
      removeRecord: (recordId) => execute(() => deleteBudgetRecord(database, recordId)),
      createCategory: (input) => execute(() => addCategory(database, input)),
    }),
    [clearError, database, errorMessage, execute, isLoading, isSaving, refresh, snapshot],
  );

  return <BudgetDataContext.Provider value={value}>{children}</BudgetDataContext.Provider>;
}

export function useBudgetData(): BudgetDataContextValue {
  const context = useContext(BudgetDataContext);
  if (!context) throw new Error('useBudgetData must be used within BudgetDataProvider.');
  return context;
}

export function useClearBudgetErrorOnBlur(): void {
  const { clearError } = useBudgetData();
  useFocusEffect(useCallback(() => clearError, [clearError]));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return 'A budget with that cadence and date range already exists.';
    }
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return 'This item is still used by financial history and cannot be removed.';
    }
    return error.message;
  }
  return 'Something went wrong. Try again.';
}
