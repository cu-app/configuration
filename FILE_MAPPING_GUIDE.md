# File Mapping Guide: Old cuapp → New Base App

## Component Replacements

### Theme System

| Old cuapp | New cu_ui | Action |
|-----------|-----------|--------|
| `lib/app/theme/shift/shift_*.dart` | `cu_ui` theme system | ❌ Delete - Use `CuThemeData` |
| `lib/app/theme/shift/shift_colors.dart` | `cu_ui` color tokens | ❌ Delete - Use `colors` from theme |
| `lib/app/theme/shift/shift_typography.dart` | `cu_ui` typography tokens | ❌ Delete - Use `typography` from theme |
| `lib/app/theme/shift/shift_sizes.dart` | `cu_ui` spacing tokens | ❌ Delete - Use `spacing` from theme |

### Button Components

| Old cuapp | New cu_ui | Action |
|-----------|-----------|--------|
| Custom button widgets | `CuButton` | ✅ Replace all instances |
| `lib/ui/shared/widgets/buttons/*` | `cu_ui/lib/src/components/buttons/` | ✅ Replace |

### Input Components

| Old cuapp | New cu_ui | Action |
|-----------|-----------|--------|
| Custom text fields | `CuInput` | ✅ Replace |
| Custom dropdowns | `CuSelect` | ✅ Replace |
| Custom checkboxes | `CuCheckbox` | ✅ Replace |
| Custom toggles | `CuToggle` | ✅ Replace |
| Custom radio buttons | `CuRadio` | ✅ Replace |

### Layout Components

| Old cuapp | New cu_ui | Action |
|-----------|-----------|--------|
| Custom scaffolds | `CuScaffold` | ✅ Replace |
| Custom app bars | `CuAppBar`, `CuSliverAppBar` | ✅ Replace |
| Custom navigation | `CuBottomNav`, `CuTabs` | ✅ Replace |

### Data Display

| Old cuapp | New cu_ui | Action |
|-----------|-----------|--------|
| Account cards | `CuAccountCard` | ✅ Replace or enhance |
| Custom lists | `CuListTile` | ✅ Replace |
| Custom tables | `CuTable` | ✅ Replace |
| Custom badges | `CuBadge` | ✅ Replace |

### Feedback Components

| Old cuapp | New cu_ui | Action |
|-----------|-----------|--------|
| Custom loaders | `CuSpinner`, `CuLoading` | ✅ Replace |
| Custom skeletons | `CuSkeleton`, `CuShimmer` | ✅ Replace |
| Custom toasts | `CuToast` | ✅ Replace |
| Custom progress | `CuProgress` | ✅ Replace |

---

## Features to Keep (All from Old cuapp)

### ✅ Keep These Feature Modules

```
lib/ui/overview/                    → lib/features/overview/
lib/ui/account_detail/              → lib/features/account_detail/
lib/ui/move_money/                  → lib/features/move_money/
lib/ui/my_cards/                    → lib/features/my_cards/
lib/ui/documents/                   → lib/features/documents/
lib/ui/transaction_details/         → lib/features/transaction_details/
lib/ui/account_ownership/           → lib/features/account_ownership/
lib/ui/account_annual_summary/      → lib/features/account_annual_summary/
lib/ui/authentication/              → lib/features/authentication/
lib/ui/app_startup/                 → lib/features/app_startup/
```

### ✅ Keep Infrastructure Layer

```
lib/infrastructure/repositories/    → lib/infrastructure/repositories/
lib/infrastructure/services/        → lib/infrastructure/services/
lib/infrastructure/models/          → lib/infrastructure/models/
lib/infrastructure/mock_data/       → lib/infrastructure/mock_data/
```

### ✅ Keep App Architecture

```
lib/app/router/                     → lib/app/router/ (refactor to use cu_ui nav)
lib/app/l10n/                       → lib/app/l10n/ (keep as-is)
lib/app/utilities/                  → lib/shared/utils/ (keep as-is)
lib/app/messaging/                  → lib/app/messaging/ (keep as-is)
```

### ✅ Keep Assets

```
assets/animations/                   → assets/animations/ (keep as-is)
assets/icons/                       → assets/icons/ (keep as-is)
assets/images/                      → assets/images/ (keep as-is)
assets/google_fonts/                → assets/fonts/ (keep as-is)
assets/app_configs/                 → assets/configs/ (enhance for Matrix)
```

---

## Specific File Replacements

### Theme Migration

**Before:**
```dart
// lib/app/theme/shift/shift_light_theme.dart
ThemeData shiftLightTheme = ThemeData(
  colorScheme: ColorScheme.light(...),
  // ...
);
```

**After:**
```dart
// Use cu_ui theme
import 'package:cu_ui/cu_ui.dart';

final theme = CuThemeData.light(
  colors: CuColorTokens.light(...),
  // ...
);
```

### Button Migration

**Before:**
```dart
// Old custom button
ElevatedButton(
  onPressed: () {},
  child: Text('Submit'),
)
```

**After:**
```dart
// New cu_ui button
CuButton.primary(
  onPressed: () {},
  child: CuText('Submit'),
)
```

### Input Migration

**Before:**
```dart
// Old custom input
TextField(
  decoration: InputDecoration(...),
)
```

**After:**
```dart
// New cu_ui input
CuInput(
  placeholder: 'Enter amount',
  // Uses design tokens automatically
)
```

---

## New Files to Create

### Configuration Integration

```
lib/app/config/
  ├── config_loader.dart          # Load from Configuration Matrix
  ├── config_model.dart            # Config data models
  └── config_provider.dart         # Provider for config access
```

### Theme Bridge

```
lib/app/theme/
  ├── theme_bridge.dart            # Bridge old → new theme
  └── theme_provider.dart          # Theme provider
```

### Feature Flags

```
lib/app/features/
  └── feature_flags.dart           # Feature flag system from config
```

---

## Migration Order (Recommended)

### Phase 1: Foundation (Week 1)
1. ✅ Set up new project structure
2. ✅ Add cu_ui dependency
3. ✅ Create theme bridge
4. ✅ Migrate app.dart and main.dart
5. ✅ Migrate router to use cu_ui navigation

### Phase 2: Core Components (Week 2)
1. ✅ Replace all buttons
2. ✅ Replace all inputs
3. ✅ Replace all cards
4. ✅ Replace all layouts
5. ✅ Replace all feedback components

### Phase 3: Features (Week 3-4)
1. ✅ Migrate overview feature
2. ✅ Migrate authentication feature
3. ✅ Migrate account_detail feature
4. ✅ Migrate move_money feature
5. ✅ Migrate remaining features

### Phase 4: Integration (Week 5-6)
1. ✅ Connect to Configuration Matrix
2. ✅ Add multi-tenant support
3. ✅ Add feature flags
4. ✅ Update tests
5. ✅ Documentation

---

## Testing Strategy

### Unit Tests
- Keep all existing BLoC tests
- Update widget tests to use cu_ui components
- Add tests for config loading

### Integration Tests
- Keep existing integration tests
- Update to use cu_ui components
- Add config-based feature tests

### Visual Regression
- Use cu_ui reference screenshots
- Compare old vs new screens
- Document visual changes

---

## Common Patterns

### Accessing Theme

**Before:**
```dart
Theme.of(context).colorScheme.primary
```

**After:**
```dart
context.cu.colors.primary
// or
CuComponentMixin → this.colors.primary
```

### Responsive Design

**Before:**
```dart
MediaQuery.of(context).size.width
```

**After:**
```dart
context.cuBreakpoint
// or
CuComponentMixin → this.breakpoint
```

### Component Sizing

**Before:**
```dart
SizedBox(height: 16)
```

**After:**
```dart
SizedBox(height: spacing.md)
// or
CuSpacer.md
```

---

## Notes

- **Don't delete old files immediately** - Keep as reference during migration
- **Migrate feature by feature** - Don't try to do everything at once
- **Test after each migration** - Ensure nothing breaks
- **Document changes** - Help future developers understand decisions
- **Use git branches** - One branch per feature migration
