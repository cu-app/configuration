# QUICK START: Strip & Rebuild Plan

## 🎯 GOAL
Take old Suncoast cuapp → Strip ALL Symitar/core banking calls → Rebuild with cu_ui → Clean base app

---

## 📋 THE PLAN (5 Phases)

### PHASE 1: STRIP BACKEND (Week 1)
**Remove all GraphQL and core banking calls**

1. **Repositories** - Replace GraphQL with mock data
   - `overview_repository.dart` - Remove GraphQL query, use mock
   - `account_detail_repository.dart` - Remove GraphQL, use mock
   - `transfers_repository.dart` - Remove all GraphQL mutations, use mock
   - `documents_repository.dart` - Remove GraphQL, use mock
   - `move_money_repository.dart` - Remove backend calls, use mock

2. **Authentication** - Replace OIDC with simple mock
   - `authentication_repository.dart` - Remove OIDC flow, add simple sign in/out

3. **App Config** - Strip backend URLs
   - `app_config.dart` - Remove: `baseAuthUrl`, `baseApiUrl`, `tokenRoute`, etc.

4. **API Services** - Simplify or remove
   - `secure_api_service.dart` - Remove bearer token logic
   - `api_service.dart` - Keep generic HTTP or remove

**RESULT:** App runs with mock data, no backend calls

---

### PHASE 2: REPLACE THEME (Week 2)
**Replace Shift theme with cu_ui**

1. **Delete old theme:**
   ```
   lib/app/theme/shift/*.dart  ❌ DELETE ALL
   ```

2. **Create new theme:**
   ```dart
   lib/app/theme/app_theme.dart  ✅ CREATE
   ```
   - Use `CuThemeData` from cu_ui
   - Light/dark themes

3. **Update main.dart:**
   - Replace `ShiftTheme` with `AppTheme`
   - Use cu_ui theme system

**RESULT:** App uses cu_ui theme system

---

### PHASE 3: REPLACE UI COMPONENTS - CORE (Week 3)
**Replace all basic UI components**

1. **Scaffolds** → `CuScaffold`
2. **App Bars** → `CuAppBar`, `CuSliverAppBar`
3. **Buttons** → `CuButton`
4. **Inputs** → `CuInput`, `CuSelect`
5. **Cards** → `CuCard`, `CuAccountCard`
6. **Loading** → `CuSpinner`, `CuSkeleton`
7. **Text** → `CuText`

**RESULT:** Core UI uses cu_ui components

---

### PHASE 4: REPLACE UI COMPONENTS - FEATURES (Week 4)
**Update all feature screens**

1. **Overview** - Replace all widgets
2. **Account Detail** - Replace all widgets
3. **Move Money** - Replace all widgets
4. **My Cards** - Replace all widgets
5. **Documents** - Replace all widgets
6. **All other features** - Replace all widgets

**RESULT:** All features use cu_ui components

---

### PHASE 5: POLISH & TEST (Week 5)
**Final testing and cleanup**

1. Update all tests
2. Fix any remaining issues
3. Update documentation
4. Final testing
5. Deploy

**RESULT:** Clean, production-ready base app

---

## 🔥 CRITICAL FILES TO MODIFY

### Must Change:
1. ✅ All repository files - Remove GraphQL
2. ✅ `authentication_repository.dart` - Mock auth
3. ✅ `app_config.dart` - Strip backend URLs
4. ✅ All theme files - Replace with cu_ui
5. ✅ All UI feature files - Replace widgets

### Can Delete:
- ❌ `lib/infrastructure/models/graphql/*` - Delete GraphQL models
- ❌ `lib/app/theme/shift/*` - Delete old theme
- ❌ `lib/infrastructure/services/backend_call_sample.dart` - Delete if exists

### Keep As-Is:
- ✅ `lib/app/router/` - Keep navigation
- ✅ `lib/app/l10n/` - Keep localization
- ✅ `lib/infrastructure/mock_data/` - Keep mock data
- ✅ All BLoC files - Keep state management
- ✅ All view models - Keep data models

---

## 📝 QUICK REFERENCE

### Replace GraphQL with Mock:
```dart
// BEFORE
var result = await _secureApiService.postData('graphql', query);
return OverviewViewModel.fromJson(result.body["data"]["overview"]);

// AFTER
await Future.delayed(Duration(milliseconds: 500));
return OverviewMockData.getOverviewViewModel();
```

### Replace Theme:
```dart
// BEFORE
MaterialApp(theme: ShiftTheme.light)

// AFTER
MaterialApp(theme: AppTheme.light().toMaterialTheme())
```

### Replace Components:
```dart
// BEFORE
ElevatedButton(child: Text('Submit'))

// AFTER
CuButton.primary(child: CuText('Submit'))
```

---

## ✅ CHECKLIST

### Week 1: Strip Backend
- [ ] Remove GraphQL from all repositories
- [ ] Replace with mock data
- [ ] Replace authentication with mock
- [ ] Strip backend URLs from config
- [ ] Test: App runs with mock data

### Week 2: Theme
- [ ] Delete old Shift theme
- [ ] Create cu_ui theme
- [ ] Update main.dart
- [ ] Test: Theme works

### Week 3: Core Components
- [ ] Replace scaffolds
- [ ] Replace app bars
- [ ] Replace buttons
- [ ] Replace inputs
- [ ] Test: Core UI works

### Week 4: Feature Components
- [ ] Migrate all features
- [ ] Replace all widgets
- [ ] Test: All features work

### Week 5: Polish
- [ ] Update tests
- [ ] Fix issues
- [ ] Documentation
- [ ] Final testing

---

## 🎯 FINAL RESULT

**Clean base app with:**
- ✅ All features working (with mock data)
- ✅ Modern cu_ui components
- ✅ No Symitar/core banking dependencies
- ✅ Ready for Configuration Matrix
- ✅ Ready for adapter pattern (later)

---

## 📚 DETAILED GUIDES

- **Full Plan:** `STRIP_AND_REBUILD_PLAN.md`
- **File-by-File:** `FILE_BY_FILE_ACTIONS.md`
- **Integration:** `INTEGRATION_SUMMARY.md`

---

## 🚀 START HERE

1. **Read:** `STRIP_AND_REBUILD_PLAN.md` for full context
2. **Follow:** `FILE_BY_FILE_ACTIONS.md` for specific changes
3. **Reference:** This file for quick checks

**Let's strip it down and rebuild it right! 🔥**
