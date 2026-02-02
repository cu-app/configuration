# STRIP & REBUILD PLAN: Old cuapp → Clean Base App with cu_ui

## Goal
Take the old Suncoast cuapp (Flutter web app), strip out ALL Symitar/core banking calls, replace UI with cu_ui components, create a clean base app that uses mock data.

---

## PHASE 1: IDENTIFY & REMOVE CORE BANKING INTEGRATIONS

### 🔴 DELETE - GraphQL/Backend Calls

**Files to DELETE or STRIP:**

1. **GraphQL Queries in Repositories:**
   - `lib/infrastructure/repositories/overview/overview_repository.dart` - Remove GraphQL query (lines 22-114)
   - `lib/infrastructure/repositories/account_detail/account_detail_repository.dart` - Remove GraphQL call (line 191)
   - `lib/infrastructure/repositories/transfers/transfers_repository.dart` - Remove all GraphQL calls (lines 59, 114, 156, 348)
   - `lib/infrastructure/repositories/documents/documents_repository.dart` - Remove GraphQL calls
   - `lib/infrastructure/services/documents/eula_data_provider.dart` - Remove GraphQL calls (lines 40, 71)

2. **Backend API Services:**
   - `lib/infrastructure/services/http/secure_api_service.dart` - **KEEP STRUCTURE, REPLACE IMPLEMENTATION**
   - `lib/infrastructure/services/http/api_service.dart` - **KEEP STRUCTURE, REPLACE IMPLEMENTATION**
   - `lib/infrastructure/services/http/http_service.dart` - **KEEP AS IS** (generic HTTP, no CU-specific)

3. **Authentication (OIDC/Identity Server):**
   - `lib/infrastructure/services/authentication/authentication_repository.dart` - **REPLACE WITH MOCK AUTH**
   - Remove OIDC flow, Identity Server calls
   - Keep authentication state management
   - Replace with simple mock login

4. **GraphQL Models:**
   - `lib/infrastructure/models/graphql/transfers/share_account_viewmodel_filter_input.dart` - **DELETE**

5. **App Config (Backend URLs):**
   - `lib/infrastructure/models/app_config/app_config.dart` - **STRIP BACKEND URLS**
   - Keep structure, remove: `baseAuthUrl`, `baseApiUrl`, `tokenRoute`, etc.
   - Keep: feature flags, theme config, app metadata

---

## PHASE 2: REPLACE WITH MOCK DATA LAYER

### ✅ CREATE - Mock Repository Implementations

**New Structure:**

```
lib/infrastructure/
├── repositories/
│   ├── overview/
│   │   ├── overview_repository.dart          # KEEP - refactor to use mock
│   │   └── mock_overview_repository.dart     # NEW - mock implementation
│   ├── account_detail/
│   │   ├── account_detail_repository.dart    # KEEP - refactor to use mock
│   │   └── mock_account_detail_repository.dart # NEW
│   ├── move_money/
│   │   ├── move_money_repository.dart        # KEEP - refactor
│   │   └── mock_move_money_repository.dart   # NEW
│   ├── transfers/
│   │   ├── transfers_repository.dart         # KEEP - refactor
│   │   └── mock_transfers_repository.dart    # NEW
│   └── documents/
│       ├── documents_repository.dart         # KEEP - refactor
│       └── mock_documents_repository.dart  # NEW
│
├── services/
│   ├── authentication/
│   │   ├── authentication_repository.dart    # KEEP - refactor to mock
│   │   └── mock_authentication_repository.dart # NEW
│   └── http/
│       ├── api_service.dart                  # KEEP - generic HTTP
│       ├── http_service.dart                  # KEEP - generic HTTP
│       └── secure_api_service.dart           # REFACTOR - remove bearer token logic
│
└── mock_data/                                # KEEP - already exists!
    ├── overview_mock_data.dart
    ├── move_money/
    ├── documents/
    └── statements/
```

### Mock Repository Pattern

**Example: OverviewRepository**

**BEFORE (GraphQL):**
```dart
class OverviewRepository extends CacheMasterRepository<OverviewViewModel?> {
  Future<OverviewViewModel?> _networkCallImplementation() async {
    // GraphQL query to backend
    var query = { "query": "..." };
    var result = await _secureApiService.postData('graphql', ...);
    return OverviewViewModel.fromJson(result.body["data"]["overview"]);
  }
}
```

**AFTER (Mock):**
```dart
class OverviewRepository extends CacheMasterRepository<OverviewViewModel?> {
  final MockDataService _mockData;
  
  OverviewRepository({
    required super.ttlInSeconds,
    required this._mockData,
  });
  
  Future<OverviewViewModel?> _networkCallImplementation() async {
    // Simulate network delay
    await Future.delayed(Duration(milliseconds: 500));
    
    // Return mock data
    return _mockData.getOverviewData();
  }
}
```

---

## PHASE 3: REPLACE UI WITH cu_ui COMPONENTS

### 🔄 REPLACE - All UI Components

**Component Mapping:**

| Old cuapp Widget | cu_ui Component | Location |
|-----------------|-----------------|----------|
| Custom buttons | `CuButton` | All feature screens |
| Custom text fields | `CuInput` | Forms, search |
| Custom cards | `CuCard`, `CuAccountCard` | Overview, account lists |
| Custom app bars | `CuAppBar`, `CuSliverAppBar` | All screens |
| Custom scaffolds | `CuScaffold` | All screens |
| Custom navigation | `CuBottomNav`, `CuTabs` | Main navigation |
| Custom loaders | `CuSpinner`, `CuLoading` | Loading states |
| Custom skeletons | `CuSkeleton`, `CuShimmer` | Loading placeholders |
| Custom toasts | `CuToast` | Error/success messages |
| Custom lists | `CuListTile` | Transaction lists |
| Custom tables | `CuTable` | Account details |
| Custom badges | `CuBadge` | Status indicators |

### Theme Migration

**BEFORE:**
```dart
// lib/app/theme/shift/shift_light_theme.dart
ThemeData shiftLightTheme = ThemeData(...);
```

**AFTER:**
```dart
// lib/app/theme/app_theme.dart
import 'package:cu_ui/cu_ui.dart';

final appTheme = CuThemeData.light(
  colors: CuColorTokens.light(
    primary: Color(0xFF000000), // From config
    // ...
  ),
  // ...
);
```

---

## PHASE 4: REFACTOR REPOSITORIES TO USE MOCK DATA

### Step-by-Step Repository Refactoring

#### 1. OverviewRepository

**DELETE:**
- GraphQL query (lines 22-114)
- SecureApiService initialization
- Network call implementation

**REPLACE WITH:**
```dart
class OverviewRepository extends CacheMasterRepository<OverviewViewModel?> {
  final MockDataService _mockData;
  
  OverviewRepository({
    required super.ttlInSeconds,
    required this._mockData,
  });
  
  Future<OverviewViewModel?> _networkCallImplementation() async {
    await Future.delayed(Duration(milliseconds: 500));
    return _mockData.getOverviewData();
  }
  
  Future<OverviewViewModel?> retrieveOverviewData() async {
    if (!super.isCacheValid()) {
      super.writeCache(await _networkCallImplementation());
    }
    return super.readCache();
  }
}
```

#### 2. AccountDetailRepository

**DELETE:**
- GraphQL call
- SecureApiService

**REPLACE WITH:**
```dart
Future<AccountDetailBase> retrieveAccountDetail(String accountId) async {
  await Future.delayed(Duration(milliseconds: 300));
  return _mockData.getAccountDetail(accountId);
}
```

#### 3. TransfersRepository

**DELETE:**
- All GraphQL mutations
- SecureApiService calls

**REPLACE WITH:**
```dart
Future<void> transferMoney({
  required String fromAccountId,
  required String toAccountId,
  required double amount,
}) async {
  await Future.delayed(Duration(milliseconds: 800));
  // Simulate success
  return;
}
```

#### 4. AuthenticationRepository

**DELETE:**
- OIDC flow
- Identity Server calls
- Token refresh logic
- PKCE implementation

**REPLACE WITH:**
```dart
class AuthenticationRepository {
  bool _isAuthenticated = false;
  
  Future<AuthenticationStatus> signIn(String username, String password) async {
    await Future.delayed(Duration(milliseconds: 500));
    _isAuthenticated = true;
    return AuthenticationStatus.authenticated;
  }
  
  Future<AuthenticationStatus> signOut() async {
    _isAuthenticated = false;
    return AuthenticationStatus.unauthenticated;
  }
  
  bool get isAuthenticated => _isAuthenticated;
}
```

---

## PHASE 5: UPDATE APP CONFIG

### Strip Backend URLs

**BEFORE:**
```dart
class AppConfig {
  final String baseAuthUrl;
  final String baseApiUrl;
  final String tokenRoute;
  final String redirectUriWeb;
  final String redirectUriMobile;
  final String baseAuthUrlCFId;
  final String baseAuthUrlCFSecret;
  // ...
}
```

**AFTER:**
```dart
class AppConfig {
  // Remove all backend URLs
  // Keep only:
  final String appName;
  final Map<String, bool> featureFlags;
  final ThemeConfig themeConfig;
  final String? logoUrl;
  // ...
}
```

---

## PHASE 6: UPDATE DEPENDENCIES

### pubspec.yaml Changes

**REMOVE:**
- Any Symitar-specific packages
- GraphQL client packages (if any)

**ADD:**
```yaml
dependencies:
  cu_ui:
    path: ../cu-app-monorepo/cu_ui  # or pub.dev when published
  flutter_bloc: ^8.1.0              # KEEP
  go_router: ^9.0.0                 # KEEP
  # ... other existing deps
```

**REMOVE:**
- Any backend-specific packages
- OIDC-specific packages (if not needed)

---

## PHASE 7: UPDATE FEATURE SCREENS

### Replace UI in Each Feature

#### Overview Screen
- Replace custom widgets with `CuCard`, `CuAccountCard`
- Use `CuScaffold`, `CuAppBar`
- Use `CuText` for typography
- Use `CuSkeleton` for loading states

#### Account Detail Screen
- Replace with `CuTable` for transactions
- Use `CuCard` for account info
- Use `CuButton` for actions

#### Move Money Screens
- Replace forms with `CuInput`, `CuSelect`
- Use `CuButton` for submit
- Use `CuToast` for success/error

#### All Other Screens
- Same pattern: Replace custom widgets with cu_ui equivalents

---

## FILE-BY-FILE ACTION PLAN

### DELETE These Files:
- [ ] `lib/infrastructure/models/graphql/transfers/share_account_viewmodel_filter_input.dart`
- [ ] `lib/infrastructure/services/backend_call_sample.dart` (if exists)

### REFACTOR These Files:

#### Infrastructure Layer:
- [ ] `lib/infrastructure/repositories/overview/overview_repository.dart` - Remove GraphQL, add mock
- [ ] `lib/infrastructure/repositories/account_detail/account_detail_repository.dart` - Remove GraphQL, add mock
- [ ] `lib/infrastructure/repositories/transfers/transfers_repository.dart` - Remove GraphQL, add mock
- [ ] `lib/infrastructure/repositories/documents/documents_repository.dart` - Remove GraphQL, add mock
- [ ] `lib/infrastructure/repositories/move_money/move_money_repository.dart` - Remove backend calls, add mock
- [ ] `lib/infrastructure/services/authentication/authentication_repository.dart` - Replace OIDC with mock
- [ ] `lib/infrastructure/services/http/secure_api_service.dart` - Remove bearer token logic
- [ ] `lib/infrastructure/models/app_config/app_config.dart` - Strip backend URLs

#### Theme:
- [ ] `lib/app/theme/shift/*.dart` - DELETE ALL
- [ ] Create `lib/app/theme/app_theme.dart` - Use cu_ui theme

#### UI Features (Replace widgets):
- [ ] `lib/ui/overview/` - Replace all custom widgets
- [ ] `lib/ui/account_detail/` - Replace all custom widgets
- [ ] `lib/ui/move_money/` - Replace all custom widgets
- [ ] `lib/ui/my_cards/` - Replace all custom widgets
- [ ] `lib/ui/documents/` - Replace all custom widgets
- [ ] `lib/ui/transaction_details/` - Replace all custom widgets
- [ ] `lib/ui/account_ownership/` - Replace all custom widgets
- [ ] `lib/ui/account_annual_summary/` - Replace all custom widgets
- [ ] `lib/ui/authentication/` - Replace all custom widgets
- [ ] `lib/ui/app_startup/` - Replace all custom widgets

### KEEP These Files (as-is):
- [ ] `lib/app/router/` - Keep router structure
- [ ] `lib/app/l10n/` - Keep localization
- [ ] `lib/infrastructure/mock_data/` - Keep mock data
- [ ] `lib/infrastructure/services/http/http_service.dart` - Generic HTTP, keep
- [ ] All BLoC files - Keep state management
- [ ] All view models - Keep data models

---

## MIGRATION CHECKLIST

### Week 1: Strip Backend
- [ ] Remove all GraphQL queries from repositories
- [ ] Replace SecureApiService with mock implementation
- [ ] Replace AuthenticationRepository with mock auth
- [ ] Strip backend URLs from AppConfig
- [ ] Test: App should run with mock data

### Week 2: Theme Migration
- [ ] Delete old Shift theme files
- [ ] Set up cu_ui theme system
- [ ] Create theme provider
- [ ] Update main.dart to use cu_ui theme
- [ ] Test: App should use cu_ui theme

### Week 3: Component Migration (Core)
- [ ] Replace all buttons with CuButton
- [ ] Replace all inputs with CuInput
- [ ] Replace all scaffolds with CuScaffold
- [ ] Replace all app bars with CuAppBar
- [ ] Test: Core UI should use cu_ui

### Week 4: Component Migration (Features)
- [ ] Migrate overview screen
- [ ] Migrate account detail screen
- [ ] Migrate move money screens
- [ ] Migrate remaining features
- [ ] Test: All features should use cu_ui

### Week 5: Polish & Testing
- [ ] Update all tests
- [ ] Fix any remaining issues
- [ ] Update documentation
- [ ] Final testing
- [ ] Deploy

---

## EXPECTED RESULT

### Clean Base App Structure:
```
cu-app-base/
├── lib/
│   ├── app/
│   │   ├── config/              # App config (no backend URLs)
│   │   ├── router/              # Navigation (KEEP)
│   │   ├── theme/               # cu_ui theme (NEW)
│   │   └── l10n/                # Localization (KEEP)
│   │
│   ├── infrastructure/
│   │   ├── repositories/        # Mock implementations
│   │   ├── services/            # Mock services
│   │   ├── models/              # Data models (KEEP)
│   │   └── mock_data/           # Mock data (KEEP)
│   │
│   ├── features/                # All features (UI refactored)
│   │   ├── overview/
│   │   ├── account_detail/
│   │   ├── move_money/
│   │   └── ...
│   │
│   └── shared/                  # Shared utilities (KEEP)
│
├── pubspec.yaml                 # cu_ui dependency added
└── assets/                      # Assets (KEEP)
```

### What You Get:
✅ Clean Flutter web app
✅ All features working with mock data
✅ Modern cu_ui components throughout
✅ No Symitar/core banking dependencies
✅ Ready to connect to Configuration Matrix
✅ Ready for adapter pattern (later)

---

## NOTES

- **Don't delete files immediately** - Comment out GraphQL calls first, test, then remove
- **Keep BLoC architecture** - It's good, just update data sources
- **Mock data already exists** - Use `lib/infrastructure/mock_data/`
- **Test after each phase** - Don't break everything at once
- **Use git branches** - One branch per phase

---

## NEXT STEPS AFTER STRIPPING

1. **Connect to Configuration Matrix** - Load config from Supabase
2. **Add Adapter Pattern** - Create interface for core banking (Symitar, Jack Henry, etc.)
3. **Add Real Auth** - Connect to your auth system
4. **Add Real API** - Connect to your backend (when ready)

But for now: **STRIP EVERYTHING, USE MOCK DATA, BUILD WITH cu_ui**
