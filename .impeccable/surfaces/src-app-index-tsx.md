---
version: 1
slug: "src-app-index-tsx"
primary_target: "src/app/index.tsx"
related_targets: ["src/app/budget.tsx","src/app/transactions.tsx","src/app/reports.tsx","src/app/settings.tsx"]
---

# Home allowance dashboard

Mode: Operate. The sole user needs to understand the active allowance and log the next use quickly on an Android phone. The surface must expose discrepancies between planned, given, and used money without judgment, preserve the native five-destination navigation, and keep the primary Log use action reachable.

## Direction contract

**THESIS:** The allowance is a visible flow of funds, not a pile of disconnected metric cards. Refuse the generic dashboard grid: every section answers where the planned money has reached.

**OWN-WORLD:** Inherit the Android Material structure and existing light/dark theme. Use broad tonal bands, crisp dividers, tabular money figures, compact status chips, and one primary color role for the active path; warnings use explicit labels and icons, never color alone.

**STORY:** The user sees the active period, compares planned with given, follows money into Needs, Wants, and Savings, notices categories needing attention, then logs a use or reviews recent activity.

**FIRST VIEWPORT:** A concise top app bar sits above a full-width planned-to-given flow. Three proportional group lanes fill the middle with allocation, used, and remaining values. The Log use FAB stays above native navigation; category warnings begin below the fold.

**FORM:** Flow of Funds, ranked structural candidate 2 and selected from surface seed `cc267015`. Its signature interaction is a shared-axis transition from a group lane into its category detail while the chosen group keeps its color role and context.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
