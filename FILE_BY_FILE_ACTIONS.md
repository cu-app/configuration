# FILE-BY-FILE ACTION PLAN: Strip Core Banking & Rebuild with cu_ui

## CRITICAL FILES TO MODIFY

### 1. REPOSITORIES - Remove GraphQL, Add Mock

#### `lib/infrastructure/repositories/overview/overview_repository.dart`

**CURRENT:** Makes GraphQL call to backend
**ACTION:** Replace GraphQL with mock data

**DELETE:**
```dart
// Lines 18-135 - Entire _networkCallImplementation method
Future<OverviewViewModel?> _networkCallImplementation() async {
  _secureApiService = SecureApiService(appConfig: appConfig);
  _secureApiService.init(authRepo);
  
  var query = {
    "query": '''
      {
        overview {
          greeting(hour: ${DateTime.now().hour})
          ...shareSummary
          // ... entire GraphQL query
        }
      }
    '''
  };
  
  var result = await _secureApiService.postData('graphql', ...);
  // ...
}
```

**REPLACE WITH:**
```dart
Future<OverviewViewModel?> _networkCallImplementation() async {
  // Simulate network delay
  await Future.delayed(Duration(milliseconds: 500));
  
  // Return mock data
  return OverviewMockData.getOverviewViewModel();
}
```

**ALSO REMOVE:**
- `SecureApiService _secureApiService;` field
- `AuthenticationRepository authRepo;` field (if not needed)
- `AppConfig appConfig;` field (if not needed)

---

#### `lib/infrastructure/repositories/account_detail/account_detail_repository.dart`

**CURRENT:** Makes GraphQL call
**ACTION:** Replace with mock

**FIND:** GraphQL call around line 191
**REPLACE:** With mock data call

```dart
// BEFORE
var result = await _secureApiService.postData('graphql', ...);

// AFTER
await Future.delayed(Duration(milliseconds: 300));
return AccountDetailMockData.getAccountDetail(accountId);
```

---

#### `lib/infrastructure/repositories/transfers/transfers_repository.dart`

**CURRENT:** Multiple GraphQL mutations
**ACTION:** Replace all with mock implementations

**FIND:** All `_secureApiService.postData('graphql', ...)` calls
**REPLACE:** With mock implementations

```dart
// BEFORE
Future<void> transferMoney(...) async {
  var query = { "query": "mutation { ... }" };
  await _secureApiService.postData('graphql', json.encode(query));
}

// AFTER
Future<void> transferMoney(...) async {
  await Future.delayed(Duration(milliseconds: 800));
  // Simulate success - no actual backend call
  return;
}
```

---

#### `lib/infrastructure/repositories/documents/documents_repository.dart`

**CURRENT:** GraphQL calls for documents
**ACTION:** Replace with mock

**FIND:** GraphQL calls
**REPLACE:** With mock data from `lib/infrastructure/mock_data/documents/`

---

### 2. AUTHENTICATION - Replace OIDC with Mock

#### `lib/infrastructure/services/authentication/authentication_repository.dart`

**CURRENT:** Full OIDC flow with Identity Server
**ACTION:** Replace with simple mock authentication

**DELETE:**
- `_buildCodeVerifier()` method
- `_buildCodeChallenge()` method
- `_buildUrl()` method (OIDC URL building)
- `getSignInUri()` method
- `getAccessTokenAndLogin()` method (OIDC token exchange)
- `getAccessTokenFromRefreshToken()` method
- `revokeRefreshToken()` method
- All OIDC-related fields (`_clientId`, `_codeVerifier`, `_codeChallenge`, etc.)

**REPLACE WITH:**
```dart
class AuthenticationRepository {
  bool _isAuthenticated = false;
  String? _currentUserId;
  
  // Simple mock sign in
  Future<AuthenticationStatus> signIn({
    required String username,
    required String password,
  }) async {
    await Future.delayed(Duration(milliseconds: 500));
    
    // Mock validation
    if (username.isNotEmpty && password.isNotEmpty) {
      _isAuthenticated = true;
      _currentUserId = username;
      return AuthenticationStatus.authenticated;
    }
    
    return AuthenticationStatus.unauthenticated;
  }
  
  Future<AuthenticationStatus> signOut() async {
    await Future.delayed(Duration(milliseconds: 200));
    _isAuthenticated = false;
    _currentUserId = null;
    return AuthenticationStatus.unauthenticated;
  }
  
  bool get isAuthenticated => _isAuthenticated;
  String? get currentUserId => _currentUserId;
}
```

**REMOVE DEPENDENCIES:**
- `ApiService` (no longer needed)
- `AppConfigRepository` (no longer needed for auth URLs)
- OIDC-related imports

---

### 3. API SERVICES - Strip Backend Logic

#### `lib/infrastructure/services/http/secure_api_service.dart`

**CURRENT:** Adds bearer tokens, handles token refresh
**ACTION:** Simplify or remove (if not needed)

**OPTION 1: DELETE ENTIRELY** (if all repos use mock)
**OPTION 2: SIMPLIFY** (if you want to keep structure for future)

**IF KEEPING:**
```dart
// BEFORE
class SecureApiService {
  late AuthenticationRepository _authRepository;
  
  init(AuthenticationRepository authenticationRepository) {
    _authRepository = authenticationRepository;
    _baseHeaders = {
      'Authorization': 'Bearer ${_authRepository.tokenInformation!.accessToken}'
    };
  }
  
  // Complex token refresh logic...
}

// AFTER (simplified)
class SecureApiService {
  Map<String, String> _baseHeaders = {};
  
  Future<ResponsePayload> postData(String route, dynamic body) async {
    // Just return mock response or use HttpService directly
    await Future.delayed(Duration(milliseconds: 500));
    return ResponsePayload({'success': true}, 200);
  }
}
```

---

#### `lib/infrastructure/services/http/api_service.dart`

**CURRENT:** Generic API service with Cloudflare headers
**ACTION:** Keep as-is OR simplify

**IF KEEPING:** Remove Cloudflare-specific headers if not needed
**IF NOT NEEDED:** Can delete if all repos use mock

---

### 4. APP CONFIG - Strip Backend URLs

#### `lib/infrastructure/models/app_config/app_config.dart`

**CURRENT:** Contains backend URLs, auth URLs, etc.
**ACTION:** Remove all backend-related config

**DELETE FIELDS:**
```dart
// DELETE THESE:
final String baseAuthUrl;
final String baseApiUrl;
final String tokenRoute;
final String redirectUriWeb;
final String redirectUriMobile;
final String baseAuthUrlCFId;
final String baseAuthUrlCFSecret;
final String nonce;
final String csrfToken;
```

**KEEP FIELDS:**
```dart
// KEEP THESE:
final String appName;
final Map<String, bool> featureFlags;
final ThemeConfig? themeConfig;
final String? logoUrl;
final String version;
// ... other non-backend config
```

---

### 5. THEME - Replace Shift with cu_ui

#### DELETE ALL FILES IN:
```
lib/app/theme/shift/
├── shift_colors.dart          ❌ DELETE
├── shift_dark_theme.dart      ❌ DELETE
├── shift_light_theme.dart     ❌ DELETE
├── shift_typography.dart      ❌ DELETE
├── shift_sizes.dart          ❌ DELETE
├── shift_shape.dart          ❌ DELETE
├── shift_icons.dart          ❌ DELETE
├── shift_theme_extension.dart ❌ DELETE
├── shift_test_theme.dart     ❌ DELETE
└── shift.dart                ❌ DELETE
```

#### CREATE NEW:
```
lib/app/theme/
├── app_theme.dart            ✅ CREATE
└── theme_provider.dart       ✅ CREATE
```

**app_theme.dart:**
```dart
import 'package:cu_ui/cu_ui.dart';
import 'package:flutter/material.dart';

class AppTheme {
  static CuThemeData light() {
    return CuThemeData.light(
      colors: CuColorTokens.light(
        primary: Color(0xFF000000),
        // ... other colors from config
      ),
      typography: CuTypographyTokens.default_(),
      spacing: CuSpacingTokens.default_(),
      // ...
    );
  }
  
  static CuThemeData dark() {
    return CuThemeData.dark(
      colors: CuColorTokens.dark(
        primary: Color(0xFFFFFFFF),
        // ...
      ),
      // ...
    );
  }
}
```

**Update main.dart:**
```dart
// BEFORE
MaterialApp(
  theme: ShiftTheme.light,
  darkTheme: ShiftTheme.dark,
  // ...
)

// AFTER
MaterialApp(
  theme: AppTheme.light().toMaterialTheme(),
  darkTheme: AppTheme.dark().toMaterialTheme(),
  // ...
)
```

---

### 6. UI COMPONENTS - Replace with cu_ui

#### For EACH feature screen, replace widgets:

**Pattern to follow:**

1. **Import cu_ui:**
```dart
import 'package:cu_ui/cu_ui.dart';
```

2. **Replace Scaffold:**
```dart
// BEFORE
Scaffold(
  appBar: AppBar(...),
  body: ...
)

// AFTER
CuScaffold(
  appBar: CuAppBar(...),
  body: ...
)
```

3. **Replace Buttons:**
```dart
// BEFORE
ElevatedButton(
  onPressed: () {},
  child: Text('Submit'),
)

// AFTER
CuButton.primary(
  onPressed: () {},
  child: CuText('Submit'),
)
```

4. **Replace Inputs:**
```dart
// BEFORE
TextField(
  decoration: InputDecoration(
    hintText: 'Enter amount',
  ),
)

// AFTER
CuInput(
  placeholder: 'Enter amount',
)
```

5. **Replace Cards:**
```dart
// BEFORE
Card(
  child: ListTile(...),
)

// AFTER
CuCard(
  child: CuListTile(...),
)
```

6. **Replace Loading:**
```dart
// BEFORE
CircularProgressIndicator()

// AFTER
CuSpinner()
```

---

### 7. UPDATE pubspec.yaml

**ADD:**
```yaml
dependencies:
  cu_ui:
    path: ../cu-app-monorepo/cu_ui  # Local path
    # OR when published:
    # cu_ui: ^1.0.0
```

**REMOVE (if present):**
- Any GraphQL packages
- Any Symitar-specific packages
- OIDC packages (if not needed)

**KEEP:**
- `flutter_bloc: ^8.1.0`
- `go_router: ^9.0.0`
- `cache_master` (if used for mock data caching)
- All other existing dependencies

---

## SPECIFIC FEATURE SCREENS TO UPDATE

### Overview Screen
**File:** `lib/ui/overview/overview_page.dart` (or similar)

**Replace:**
- Custom account cards → `CuAccountCard`
- Custom buttons → `CuButton`
- Custom text → `CuText`
- Custom scaffold → `CuScaffold`
- Custom app bar → `CuAppBar`
- Loading indicators → `CuSpinner` or `CuSkeleton`

---

### Account Detail Screen
**File:** `lib/ui/account_detail/account_detail_page.dart`

**Replace:**
- Transaction list → `CuTable` or `CuListTile`
- Account info cards → `CuCard`
- Action buttons → `CuButton`
- Forms → `CuInput`, `CuSelect`

---

### Move Money Screens
**Files:** `lib/ui/move_money/transfer/*.dart`

**Replace:**
- All form inputs → `CuInput`, `CuSelect`
- Submit buttons → `CuButton`
- Success/error messages → `CuToast`
- Loading states → `CuSpinner`

---

### Authentication Screen
**File:** `lib/ui/authentication/sign_in_page.dart`

**Replace:**
- Login form → `CuInput` for username/password
- Submit button → `CuButton`
- Error messages → `CuToast`
- Scaffold → `CuScaffold`

**UPDATE:** Remove OIDC callback handling, use simple mock login

---

### All Other Screens
**Same pattern:** Replace custom widgets with cu_ui equivalents

---

## MOCK DATA INTEGRATION

### Use Existing Mock Data

**Files already exist:**
- `lib/infrastructure/mock_data/overview_mock_data.dart`
- `lib/infrastructure/mock_data/move_money/move_money_mock_data.dart`
- `lib/infrastructure/mock_data/documents/documents_mock_data.dart`
- `lib/infrastructure/mock_data/statements/statements_mock_data.dart`

**Create Mock Data Service:**
```dart
// lib/infrastructure/services/mock_data_service.dart
class MockDataService {
  OverviewViewModel getOverviewData() {
    return OverviewMockData.getOverviewViewModel();
  }
  
  AccountDetailBase getAccountDetail(String accountId) {
    return AccountDetailMockData.getAccountDetail(accountId);
  }
  
  // ... other methods
}
```

---

## TESTING CHECKLIST

After each change, test:

- [ ] App compiles without errors
- [ ] No GraphQL/backend calls in network tab
- [ ] All screens load with mock data
- [ ] UI uses cu_ui components
- [ ] Theme is applied correctly
- [ ] Navigation works
- [ ] Authentication flow works (mock)
- [ ] All features work with mock data

---

## FINAL STRUCTURE

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
│   │   ├── models/              # Data models (KEEP, remove GraphQL)
│   │   └── mock_data/           # Mock data (KEEP)
│   │
│   ├── features/                # All features (UI refactored)
│   │   └── [all features use cu_ui]
│   │
│   └── shared/                  # Shared utilities (KEEP)
│
├── pubspec.yaml                 # cu_ui added
└── assets/                      # Assets (KEEP)
```

---

## PRIORITY ORDER

1. **FIRST:** Strip GraphQL from repositories (Week 1)
2. **SECOND:** Replace authentication (Week 1)
3. **THIRD:** Replace theme system (Week 2)
4. **FOURTH:** Replace UI components (Week 3-4)
5. **FIFTH:** Testing & polish (Week 5)

---

## NOTES

- **Don't delete files immediately** - Comment out first, test, then delete
- **Keep BLoC files** - Just update data sources
- **Use existing mock data** - Don't recreate it
- **Test incrementally** - Don't break everything at once
- **Git branches** - One branch per major change
