import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { migrateDatabase } from '@/data/migrations/migrate-database';
import { BudgetDataProvider } from '@/features/budget/budget-data-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="save-your-money.db" onInit={migrateDatabase}>
        <BudgetDataProvider>
          <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
          <AppTabs />
        </BudgetDataProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
