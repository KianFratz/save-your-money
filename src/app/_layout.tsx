import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { migrateDatabase } from '@/data/migrations/migrate-database';
import { AllowanceDataProvider } from '@/features/allowance/allowance-data-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="save-your-money.db" onInit={migrateDatabase}>
        <AllowanceDataProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <AppTabs />
        </AllowanceDataProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
