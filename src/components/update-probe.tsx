import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

async function openProbeDatabase() {
  const db = await SQLite.openDatabaseAsync('update-probe.db');
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS update_probe (id INTEGER PRIMARY KEY CHECK (id = 1), value TEXT NOT NULL)',
  );
  return db;
}

export function UpdateProbe() {
  const theme = useTheme();
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('Loading saved value…');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const db = await openProbeDatabase();
        const row = await db.getFirstAsync<{ value: string }>(
          'SELECT value FROM update_probe WHERE id = 1',
        );
        if (mounted) {
          setSavedValue(row?.value ?? null);
          setStatus(row ? 'Saved on this installation' : 'No saved value yet');
        }
      } catch {
        if (mounted) setStatus('Could not load the saved value');
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      const db = await openProbeDatabase();
      await db.runAsync(
        'INSERT INTO update_probe (id, value) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value',
        draft,
      );
      setSavedValue(draft);
      setDraft('');
      setStatus('Saved on this installation');
    } catch {
      setStatus('Could not save the value');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold">APK update probe</ThemedText>
      <ThemedText type="small">
        Save a value in the first APK, then check it after updating.
      </ThemedText>
      <ThemedText accessibilityLabel={`Saved probe value: ${savedValue ?? 'none'}`}>
        Saved value: {savedValue ?? 'none'}
      </ThemedText>
      <TextInput
        accessibilityLabel="Probe value"
        placeholder="Enter a visible probe value"
        placeholderTextColor={theme.textSecondary}
        value={draft}
        onChangeText={setDraft}
        style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save probe value"
        disabled={!draft.trim() || saving}
        onPress={() => void save()}
        style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">Save value</ThemedText>
      </Pressable>
      <ThemedText type="small" accessibilityLiveRegion="polite">
        {status}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    borderRadius: Spacing.four,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  button: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
});
