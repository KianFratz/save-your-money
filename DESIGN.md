---
name: Save Your Money — Flow of Funds
description: A calm Android budget tracker that makes received, spent, saved, and remaining money visibly distinct.
colors:
  light-text: "#1B1B1F"
  light-background: "#F9F9FF"
  light-surface: "#F0F0F7"
  light-text-secondary: "#46464F"
  light-primary: "#435D92"
  light-on-primary: "#FFFFFF"
  light-primary-container: "#D9E2FF"
  light-outline: "#767680"
  light-outline-variant: "#C6C6D0"
  light-error: "#BA1A1A"
  light-error-container: "#FFDAD6"
  light-on-error-container: "#410002"
  light-warning-container: "#FFE08A"
  light-on-warning-container: "#2A2100"
  light-success-container: "#B9F0C6"
  light-on-success-container: "#072712"
  light-needs: "#5375AF"
  light-wants: "#8B5C99"
  light-savings: "#377A58"
  dark-text: "#E4E1E9"
  dark-background: "#121318"
  dark-surface: "#1E1F25"
  dark-text-secondary: "#C7C5D0"
  dark-primary: "#ADC6FF"
  dark-on-primary: "#112F60"
  dark-primary-container: "#294677"
  dark-outline: "#90909A"
  dark-outline-variant: "#46464F"
  dark-error: "#FFB4AB"
  dark-error-container: "#93000A"
  dark-on-error-container: "#FFDAD6"
  dark-warning-container: "#594700"
  dark-on-warning-container: "#FFE08A"
  dark-success-container: "#18522F"
  dark-on-success-container: "#B9F0C6"
  dark-needs: "#A9C7FF"
  dark-wants: "#E5B6EF"
  dark-savings: "#9AD8B1"
typography:
  screen-title:
    fontFamily: "normal"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.286
  section-heading:
    fontFamily: "normal"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.273
  body:
    fontFamily: "normal"
    fontSize: "16px"
    fontWeight: 500
  small:
    fontFamily: "normal"
    fontSize: "14px"
    fontWeight: 500
  small-bold:
    fontFamily: "normal"
    fontSize: "14px"
    fontWeight: 700
  label:
    fontFamily: "normal"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.333
    letterSpacing: "0.7px"
  money:
    fontFamily: "monospace"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  track: "4px"
  compact: "8px"
  field: "12px"
  surface: "16px"
  pill: "24px"
  flow: "16px"
spacing:
  half: "2px"
  one: "4px"
  two: "8px"
  three: "16px"
  four: "24px"
  five: "32px"
  six: "64px"
components:
  button-primary:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.light-on-primary}"
    typography: "{typography.small-bold}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    typography: "{typography.small-bold}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.light-error-container}"
    textColor: "{colors.light-on-error-container}"
    typography: "{typography.small-bold}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  chip-selected:
    backgroundColor: "{colors.light-primary-container}"
    textColor: "{colors.light-text}"
    typography: "{typography.small-bold}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "48px"
  field:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "8px 16px"
    height: "52px"
  flow-card:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.flow}"
    padding: "24px"
  status-warning:
    backgroundColor: "{colors.light-warning-container}"
    textColor: "{colors.light-on-warning-container}"
    typography: "{typography.small-bold}"
    rounded: "{rounded.field}"
    padding: "16px"
---

# Design System: Save Your Money

## Overview

**Creative North Star: "Flow of Funds"**

Save Your Money is an Android-first operational interface where each received amount becomes an independent Budget card and a clear path from allocation to spending. Broad tonal surfaces, crisp dividers, tabular money figures, and compact status language keep the system calm and factual.

The hierarchy always answers the next money question: which Budgets are current, how much remains, where Needs, Wants, and Savings stand, and what action is available now. Guidance is direct and non-judgmental; warnings describe discrepancies without blocking truthful entries.

**Key Characteristics:**

- Compact Budget cards grouped as Current, Upcoming, Past, or Archived.
- Three persistent group identities: Needs, Wants, and Savings.
- Flat Material-inspired surfaces with generous touch targets and native navigation.
- Explicit financial language that keeps expenditures attached to one Budget.
- Light and dark palettes with the same semantic roles.

## Colors

The palette is a cool, quiet Material family: blue marks the active path, group colors identify allocation lanes, and status containers communicate meaning with both color and words.

### Primary

- **Ledger Blue:** drives primary actions, progress, and selected controls; its light and dark values are paired with dedicated on-primary colors.

### Secondary

- **Needs Blue, Wants Violet, Savings Green:** identify budget groups only. They appear on lane rails and progress fills so the same category keeps its identity across screens.

### Neutral

- **App Background:** the full-screen canvas in each scheme.
- **Tonal Surface:** cards, unselected chips, fields, native-tab indicators, and state containers.
- **Primary and Secondary Text:** preserves a clear two-level reading hierarchy.
- **Outline and Outline Variant:** fields use the stronger outline; dividers and quiet controls use the softer variant.

### Named Rules

**The One Active Path Rule.** Primary blue is reserved for the current flow, selected state, and primary action; group colors do not compete for general emphasis.

**The Words With Color Rule.** Error, warning, success, and group meaning must remain understandable from labels, values, icons, or structure when color is unavailable.

## Typography

**Display Font:** Android system sans-serif  
**Body Font:** Android system sans-serif  
**Money Font:** Android system monospace

**Character:** sturdy and utilitarian. Weight, size, and alignment carry hierarchy; the monospace money role makes amounts easy to compare while the rest of the interface stays native.

### Hierarchy

- **Screen title** (700, 28dp/36dp): one title at the start of each destination.
- **Section heading** (700, 22dp/28dp): separates the flow, budget groups, savings, and activity.
- **Body** (500, 16dp): descriptions, guidance, and form text.
- **Small / Small Bold** (500/700, 14dp): metadata, button labels, list rows, and status messages.
- **Label** (700, 12dp/16dp, 0.7dp tracking, uppercase): field labels and compact financial metadata.
- **Money** (700 monospace, 20dp/28dp): planned, funded, remaining, and saved amounts.

### Named Rules

**The Amount Alignment Rule.** Use the money role for high-value totals and align paired amounts to opposing edges; use small bold text for row-level amounts.

## Layout

Screens use a single scrolling column with a maximum content width of 800dp, 24dp horizontal/top padding, 16dp vertical gaps, and 120dp bottom breathing room above native tabs and floating actions. A floating primary action sits 24dp from the right and bottom of the safe area.

Flow rows, lane headers, chips, and summaries wrap instead of clipping. The same structure therefore serves narrow phones, larger Android windows, and increased font sizes. React Native text keeps platform font scaling enabled; do not fix text containers to single-line heights. Controls retain at least 48dp touch height, while fields use 52dp.

The five labeled native destinations remain Home, Budget, Activity, Reports, and Settings. Home shows one Budget covering today directly. When periods overlap, it adds compact across-Budget context above the independently navigable Budget cards; it keeps cumulative Savings separate from current-period money. Budget owns creation and detail; Activity owns the complete ledger; Reports inspects one selected Budget; Settings manages categories.

## Elevation & Depth

The system is flat by default and defines no custom shadows. Depth comes from tonal contrast, rounded containers, group rails, hairline dividers, progress tracks, and the platform presentation of the quick-entry sheet.

**The Tonal Depth Rule.** Add hierarchy with surface color and spacing before adding elevation. Custom shadows are outside the implemented vocabulary.

## Shapes

Shapes move from compact to expressive with purpose: 4dp progress tracks, 8dp compact actions, 12dp fields and banners, 16dp Budget/state surfaces, and 24dp pill controls. Group lanes stay mostly open, using a small color marker and a hairline bottom divider instead of card outlines.

Pills belong to actions and choices; large rounded surfaces belong to period-level summaries. Do not turn every row into a floating card.

## Components

### Buttons

- **Primary:** blue pill, on-primary text, 48dp minimum height, and 24dp horizontal padding.
- **Secondary:** tonal-surface pill with a quiet outline; used for cancel, close, copy, and reversible supporting actions.
- **Danger:** error-container pill; consequential actions still require a native confirmation alert.
- **State:** pressed and disabled controls fade to 55% opacity. Saving states replace the label with an active verb such as “Saving…” and remain disabled.

### Chips

Choice chips form labeled radio groups. They wrap with 8dp gaps, retain a 48dp minimum height, and pair a primary-container fill with primary outline when selected; unselected chips use tonal surface and outline variant.

### Cards / Containers

The signature Budget card shows cadence, date range, derived timing, received amount, spent amount, remaining amount, and a progress track. Detail screens add Needs, Wants, and Savings lanes with group allocation, spending, remaining, the three newest group records, filtered full-activity links when more records exist, and explicit 80%/over-plan messages. Reports summarize net category activity without category-level budgets or caps.

### Inputs / Fields

Fields use tonal fill, a 1dp outline, 12dp corners, 16dp horizontal padding, and explicit uppercase labels. Amounts use the decimal keyboard; dates expose their expected `YYYY-MM-DD` format. Validation appears adjacent in a warning or error banner and does not rely on border color alone.

### Navigation

Use the platform-native labeled bottom tabs with Material icons. Android labels are 10dp; inactive labels use secondary text and selected labels use primary text. Preserve all five destinations rather than hiding low-frequency screens.

### Status and State Patterns

Status banners use semantic containers plus concise text and a polite live region. Empty, loading, validation, warning, recoverable-error, and unrecoverable-error states use a neutral 16dp container, an explicit state label, a heading, supporting copy, and an optional 48dp action. Current, Upcoming, Past, and Archived states are written in text; destructive transitions use native confirmation.

### Modal Quick Entry

“Add expenditure” opens as a sliding native page sheet with its own safe area and scroll container. The header keeps title and explanation beside a secondary Close action; the sequence is record type, Budget when needed, category, amount, date, optional description, then Save. Keyboard drag dismissal and persistent taps keep the form usable during entry.

**The One Budget Rule.** Every expenditure and refund belongs to exactly one Budget; a Savings withdrawal is periodless and reduces the chosen Savings category’s cumulative balance.

## Do's and Don'ts

### Do:

- **Do** lead Budget screens with received, spent, and remaining before allocation detail.
- **Do** preserve whole labels, wrapping, safe areas, screen-reader roles/states, polite live regions, and 48dp targets under Android font scaling.
- **Do** show overspending and invalid dates in factual language without blocking recorded reality.
- **Do** use native Android tabs, page sheets, alerts, keyboard behavior, and light/dark scheme selection.

### Don't:

- **Don't** collapse received, spent, saved, and remaining money into one ambiguous balance.
- **Don't** use color alone for warnings, group identity, selection, or status.
- **Don't** introduce metric-card grids, decorative shadows, or extra accent colors that weaken the flow hierarchy.
- **Don't** hide historical Budgets by deleting their records; use archive and restore.
