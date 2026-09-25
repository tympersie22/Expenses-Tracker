# Expenses Tracker design system

Expenses Tracker uses a distinctive global-finance design language inspired by Wise’s clarity, pace, and recognisable green, while keeping its own name, data model, and product voice. The production web app and native SwiftUI app are the source of truth.

## Product principles

- Lead with the amount a person can safely spend, then explain every deduction.
- Keep balances, goals, bills, and activity one tap away.
- Use direct language that tells people what happened and what they can do next.
- Keep every currency separate unless a dated exchange rate is explicitly available.
- Make manual data, imports, and future provider connections clear about their limits.

## Visual foundations

- Accent: acid green `#9FE870` for the primary balance surface and decisive actions.
- Ink: deep forest `#0E1B0C` for high-contrast text and marks on green.
- Canvas: warm off-white `#F7F8F2` in light mode and green-black in dark mode.
- Shapes: pill controls, circular quick actions, and continuous card corners.
- Typography: native sans-serif with large, tabular financial values and compact labels.
- Motion: short spring entrances, numeric transitions, matched tab movement, and press feedback. Reduced Motion disables nonessential movement.

The system uses one accent family and one neutral family. It avoids decorative gradients, faux banking claims, and ornamental dashboard charts. Icons are SF Symbols on iOS and Lucide on web.

## Core surfaces

Home presents available-to-spend, its component balances, three frequent actions, upcoming bills, and recent activity. Activity supports search, type filters, record detail, CSV import, and export. Plan contains goals, monthly budgets, and bills. Accounts keeps native-currency balances and source limitations visible. Settings contains language, appearance, security, and integration status.

## Accessibility

Controls target at least 44 points, semantic labels remain visible to assistive technology, focus states are explicit on web, financial values use tabular digits, Dynamic Type is supported, and light/dark appearances preserve contrast.
