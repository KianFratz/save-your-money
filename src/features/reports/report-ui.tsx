import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BUDGET_GROUP_LABELS,
  GROUP_ACTIVITY_PREVIEW_LIMIT,
  WARNING_THRESHOLD,
} from '@/constants/budget';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { formatBudgetIdentity } from '@/domain/budget';
import type {
  Budget,
  BudgetGroupKey,
  BudgetRecord,
  GroupSummary,
  PeriodCategorySummary,
} from '@/domain/budget-types';
import { formatPeso } from '@/domain/money';
import { RecordList, Section, TextAction } from '@/features/budget/budget-ui';
import { useTheme } from '@/hooks/use-theme';

const DONUT_SIZE = 164;
const DONUT_STROKE_WIDTH = 22;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE_WIDTH) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_SEGMENT_GAP = 4;

type RecordsByGroup = Readonly<Record<BudgetGroupKey, readonly BudgetRecord[]>>;

export function BudgetReport({
  budget,
  recordsByGroup,
  onViewAll,
}: {
  budget: Budget;
  recordsByGroup: RecordsByGroup;
  onViewAll: (groupKey: BudgetGroupKey) => void;
}) {
  const revealStyle = useReportRevealAnimation();
  const hasActivity = Object.values(recordsByGroup).some((records) => records.length > 0);

  return (
    <Animated.View style={[styles.report, revealStyle]}>
      <ReportOverview budget={budget} hasActivity={hasActivity} />
      <Section title="Group performance">
        {budget.groups.map((group) => (
          <ReportGroup
            key={group.groupKey}
            group={group}
            records={recordsByGroup[group.groupKey]}
            onViewAll={() => onViewAll(group.groupKey)}
          />
        ))}
      </Section>
    </Animated.View>
  );
}

function ReportOverview({ budget, hasActivity }: { budget: Budget; hasActivity: boolean }) {
  const theme = useTheme();
  const spentRatio = getProgressRatio(budget.spentCents, budget.receivedCents);
  const overspentCents = Math.max(budget.spentCents - budget.receivedCents, 0);

  return (
    <ThemedView type="backgroundElement" style={styles.overview}>
      <View style={styles.overviewHeader}>
        <View style={styles.overviewTitle}>
          <ThemedText type="section" accessibilityRole="header">
            Budget health
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatBudgetIdentity(budget.cadence, budget.startDate, budget.endDate)}
          </ThemedText>
        </View>
        <ThemedText type="money" themeColor={overspentCents > 0 ? 'error' : undefined}>
          {overspentCents > 0
            ? `${formatPeso(overspentCents)} over`
            : `${formatPeso(budget.remainingCents)} left`}
        </ThemedText>
      </View>

      <View style={styles.allocationLayout}>
        <AllocationDonut budget={budget} />
        <View style={styles.allocationDetails}>
          <ThemedText type="label" themeColor="textSecondary">
            Planned allocation
          </ThemedText>
          {budget.groups.map((group) => {
            const groupColor = theme[group.groupKey as ThemeColor];
            return (
              <View key={group.groupKey} style={styles.allocationRow}>
                <View style={styles.allocationLabel}>
                  <View style={[styles.groupMarker, { backgroundColor: groupColor }]} />
                  <ThemedText type="smallBold">
                    {BUDGET_GROUP_LABELS[group.groupKey]} · {group.percentage}%
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">{formatPeso(group.allocatedCents)}</ThemedText>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.metrics}>
        <ReportMetric label="Received" value={budget.receivedCents} />
        <ReportMetric label="Spent" value={budget.spentCents} />
        <ReportMetric
          label={overspentCents > 0 ? 'Over plan' : 'Remaining'}
          value={overspentCents > 0 ? overspentCents : budget.remainingCents}
          tone={overspentCents > 0 ? 'error' : undefined}
        />
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressHeading}>
          <ThemedText type="smallBold">Overall spending</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatProgressPercent(budget.spentCents, budget.receivedCents)}
          </ThemedText>
        </View>
        <ProgressBar
          label={`Overall spending: ${formatPeso(budget.spentCents)} of ${formatPeso(budget.receivedCents)}`}
          ratio={spentRatio}
          color={overspentCents > 0 ? theme.error : theme.primary}
        />
        {overspentCents > 0 ? (
          <ThemedText type="smallBold" themeColor="error">
            {formatPeso(overspentCents)} over this Budget
          </ThemedText>
        ) : !hasActivity ? (
          <ThemedText type="small" themeColor="textSecondary">
            No spending recorded yet.
          </ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

function AllocationDonut({ budget }: { budget: Budget }) {
  const theme = useTheme();
  const segments = budget.groups.map((group, index) => {
    const startLength = budget.groups
      .slice(0, index)
      .reduce(
        (total, precedingGroup) => total + (DONUT_CIRCUMFERENCE * precedingGroup.percentage) / 100,
        0,
      );
    const segmentLength = (DONUT_CIRCUMFERENCE * group.percentage) / 100;
    return {
      group,
      startLength,
      visibleLength: Math.max(segmentLength - DONUT_SEGMENT_GAP, 0),
    };
  });
  const accessibilityLabel = budget.groups
    .map(
      (group) =>
        `${BUDGET_GROUP_LABELS[group.groupKey]} ${group.percentage} percent, ${formatPeso(group.allocatedCents)}`,
    )
    .join('; ');

  return (
    <View style={styles.donutContainer}>
      <Svg
        accessible
        accessibilityLabel={`Planned allocation. ${accessibilityLabel}`}
        accessibilityRole="image"
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
        <Circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={DONUT_RADIUS}
          fill="none"
          stroke={theme.outlineVariant}
          strokeWidth={DONUT_STROKE_WIDTH}
        />
        {segments.map(({ group, startLength, visibleLength }) => (
          <Circle
            key={group.groupKey}
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={DONUT_RADIUS}
            fill="none"
            rotation={-90}
            origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}
            stroke={theme[group.groupKey as ThemeColor]}
            strokeDasharray={[visibleLength, DONUT_CIRCUMFERENCE - visibleLength]}
            strokeDashoffset={-startLength}
            strokeWidth={DONUT_STROKE_WIDTH}
          />
        ))}
      </Svg>
      <View pointerEvents="none" style={styles.donutCenter}>
        <ThemedText type="label" themeColor="textSecondary">
          Received
        </ThemedText>
        <ThemedText type="smallBold" style={styles.donutAmount}>
          {formatPeso(budget.receivedCents)}
        </ThemedText>
      </View>
    </View>
  );
}

function ReportMetric({ label, value, tone }: { label: string; value: number; tone?: ThemeColor }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="money" themeColor={tone}>
        {formatPeso(value)}
      </ThemedText>
    </View>
  );
}

function ReportGroup({
  group,
  records,
  onViewAll,
}: {
  group: GroupSummary;
  records: readonly BudgetRecord[];
  onViewAll: () => void;
}) {
  const theme = useTheme();
  const groupColor = theme[group.groupKey as ThemeColor];
  const groupLabel = BUDGET_GROUP_LABELS[group.groupKey];
  const activityVerb = group.groupKey === 'savings' ? 'saved' : 'spent';
  const activityNoun = group.groupKey === 'savings' ? 'saving' : 'spending';
  const overspentCents = Math.max(group.spentCents - group.allocatedCents, 0);
  const categoryRows = useMemo(() => getReportCategories(group, records), [group, records]);
  const previewRecords = records.slice(0, GROUP_ACTIVITY_PREVIEW_LIMIT);

  return (
    <View style={[styles.groupSection, { borderBottomColor: theme.outlineVariant }]}>
      <View style={styles.groupHeader}>
        <View style={styles.groupIdentity}>
          <View style={[styles.groupMarker, { backgroundColor: groupColor }]} />
          <View style={styles.groupTitle}>
            <ThemedText type="section" accessibilityRole="header">
              {groupLabel}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {group.percentage}% of received money
            </ThemedText>
          </View>
        </View>
        <View style={styles.groupRemaining}>
          <ThemedText type="money" themeColor={overspentCents > 0 ? 'error' : undefined}>
            {overspentCents > 0 ? formatPeso(overspentCents) : formatPeso(group.remainingCents)}
          </ThemedText>
          <ThemedText type="small" themeColor={overspentCents > 0 ? 'error' : 'textSecondary'}>
            {overspentCents > 0 ? 'over' : 'remaining'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressHeading}>
          <ThemedText type="smallBold">
            {formatPeso(group.spentCents)} of {formatPeso(group.allocatedCents)} {activityVerb}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatProgressPercent(group.spentCents, group.allocatedCents)}
          </ThemedText>
        </View>
        <ProgressBar
          label={`${groupLabel} ${activityNoun}: ${formatPeso(group.spentCents)} of ${formatPeso(group.allocatedCents)}`}
          ratio={getProgressRatio(group.spentCents, group.allocatedCents)}
          color={overspentCents > 0 ? theme.error : groupColor}
        />
        {overspentCents > 0 ? (
          <ThemedText type="smallBold" themeColor="error">
            {formatPeso(overspentCents)} over this group plan
          </ThemedText>
        ) : getProgressRatio(group.spentCents, group.allocatedCents) >= WARNING_THRESHOLD ? (
          <ThemedText type="smallBold" themeColor="textSecondary">
            80% of this group is already {activityVerb}
          </ThemedText>
        ) : records.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No {activityNoun} recorded yet.
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.categoryBreakdown}>
        <ThemedText type="label" themeColor="textSecondary">
          Category breakdown
        </ThemedText>
        {categoryRows.length > 0 ? (
          categoryRows.map((category) => (
            <CategoryActivity
              key={category.categoryId}
              category={category}
              activityVerb={activityVerb}
            />
          ))
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            No category activity yet.
          </ThemedText>
        )}
      </View>

      <View style={styles.activity}>
        <ThemedText type="label" themeColor="textSecondary">
          Recent activity
        </ThemedText>
        <RecordList
          records={previewRecords}
          emptyMessage="No expenses logged in this group yet."
          showBudgetIdentity={false}
        />
        {records.length > GROUP_ACTIVITY_PREVIEW_LIMIT ? (
          <TextAction label={`View all ${groupLabel} activity`} onPress={onViewAll} />
        ) : null}
      </View>
    </View>
  );
}

function CategoryActivity({
  category,
  activityVerb,
}: {
  category: PeriodCategorySummary;
  activityVerb: 'saved' | 'spent';
}) {
  return (
    <View style={styles.categoryRow}>
      <ThemedText type="smallBold" style={styles.categoryName}>
        {category.categoryName}
      </ThemedText>
      <ThemedText type="smallBold">
        {formatPeso(category.spentCents)} {activityVerb}
      </ThemedText>
    </View>
  );
}

function ProgressBar({ label, ratio, color }: { label: string; ratio: number; color: string }) {
  const theme = useTheme();
  const progressPercent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: progressPercent,
        text: `${Math.max(Math.round(ratio * 100), 0)}%`,
      }}
      style={[styles.track, { backgroundColor: theme.outlineVariant }]}>
      <View style={[styles.trackFill, { width: `${progressPercent}%`, backgroundColor: color }]} />
    </View>
  );
}

function getReportCategories(
  group: GroupSummary,
  records: readonly BudgetRecord[],
): PeriodCategorySummary[] {
  const spendingByCategory = new Map<
    number,
    { categoryId: number; categoryName: string; spentCents: number }
  >();
  const categories = new Map<number, PeriodCategorySummary>();

  for (const record of records) {
    const existing = spendingByCategory.get(record.categoryId);
    const recordImpact =
      record.type === 'refund'
        ? -record.amountCents
        : record.type === 'expenditure'
          ? record.amountCents
          : 0;
    spendingByCategory.set(record.categoryId, {
      categoryId: record.categoryId,
      categoryName: record.categoryName,
      spentCents: (existing?.spentCents ?? 0) + recordImpact,
    });
  }

  for (const category of group.categories) {
    if (category.spentCents === 0 && !spendingByCategory.has(category.categoryId)) {
      continue;
    }
    categories.set(category.categoryId, category);
  }

  for (const categorySpending of spendingByCategory.values()) {
    if (categories.has(categorySpending.categoryId)) continue;
    categories.set(categorySpending.categoryId, {
      categoryId: categorySpending.categoryId,
      categoryName: categorySpending.categoryName,
      groupKey: group.groupKey,
      spentCents: categorySpending.spentCents,
      displayOrder: Number.MAX_SAFE_INTEGER,
    });
  }

  return [...categories.values()].sort(
    (left, right) =>
      left.displayOrder - right.displayOrder || left.categoryName.localeCompare(right.categoryName),
  );
}

function getProgressRatio(spentCents: number, allocatedCents: number): number {
  if (allocatedCents <= 0) return 0;
  return Math.max(spentCents / allocatedCents, 0);
}

function formatProgressPercent(spentCents: number, allocatedCents: number): string {
  if (allocatedCents <= 0) return '0%';
  return `${Math.max(Math.round((spentCents / allocatedCents) * 100), 0)}%`;
}

function useReportRevealAnimation() {
  const [revealProgress] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let isMounted = true;
    let animation: Animated.CompositeAnimation | null = null;

    const reveal = (reduceMotionEnabled: boolean) => {
      if (!isMounted) return;
      animation?.stop();
      if (reduceMotionEnabled) {
        revealProgress.setValue(1);
        return;
      }
      revealProgress.setValue(0.88);
      animation = Animated.timing(revealProgress, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      });
      animation.start();
    };

    void AccessibilityInfo.isReduceMotionEnabled().then(reveal);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reveal);

    return () => {
      isMounted = false;
      animation?.stop();
      subscription.remove();
    };
  }, [revealProgress]);

  return {
    opacity: revealProgress,
    transform: [
      {
        translateY: revealProgress.interpolate({
          inputRange: [0.88, 1],
          outputRange: [6, 0],
        }),
      },
    ],
  };
}

const styles = StyleSheet.create({
  report: { gap: Spacing.four },
  overview: { gap: Spacing.four, borderRadius: 16, padding: Spacing.four },
  overviewHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  overviewTitle: { flex: 1, minWidth: 200, gap: Spacing.one },
  allocationLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  donutContainer: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    width: DONUT_SIZE - DONUT_STROKE_WIDTH * 2 - Spacing.two,
    alignItems: 'center',
    gap: Spacing.half,
  },
  donutAmount: { textAlign: 'center' },
  allocationDetails: { flex: 1, minWidth: 190, gap: Spacing.two },
  allocationRow: {
    minHeight: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  allocationLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  groupMarker: { width: 10, height: 10, borderRadius: 5 },
  metrics: { gap: Spacing.two },
  metric: {
    minHeight: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  progressBlock: { gap: Spacing.two },
  progressHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  track: { height: 12, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4 },
  groupSection: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  groupIdentity: { flex: 1, minWidth: 180, flexDirection: 'row', gap: Spacing.two },
  groupTitle: { flex: 1, gap: Spacing.half },
  groupRemaining: { alignItems: 'flex-end' },
  categoryBreakdown: { gap: Spacing.three },
  categoryRow: {
    minHeight: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  categoryName: { flex: 1, minWidth: 140 },
  activity: { gap: Spacing.one, paddingTop: Spacing.one },
});
