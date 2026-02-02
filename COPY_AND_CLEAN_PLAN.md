# COPY & CLEAN PLAN (NO DELETIONS)

## 🎯 APPROACH
**DO NOT DELETE ANYTHING** - Create a copy of the old cuapp folder and clean that copy instead.

---

## STEP 1: CREATE COPY

### Copy Old cuapp Folder
```bash
# From configuration-matrix-build directory
cp -r /Users/kylekusche/Desktop/quarentine/WhiteLabel_Monetary/23_Core_Banking_Platform/src/OnlineBanking/cuapp \
      /Users/kylekusche/Desktop/quarentine/configuration-matrix-build/cuapp-base-clean
```

**Result:** 
- Original: `/Users/kylekusche/Desktop/quarentine/WhiteLabel_Monetary/23_Core_Banking_Platform/src/OnlineBanking/cuapp` (UNTOUCHED)
- Copy: `/Users/kylekusche/Desktop/quarentine/configuration-matrix-build/cuapp-base-clean` (TO BE CLEANED)

---

## STEP 2: CLEAN THE COPY

### Follow the same plan from `STRIP_AND_REBUILD_PLAN.md` but on the COPY:

1. **Strip GraphQL** from repositories in the COPY
2. **Replace authentication** with mock in the COPY
3. **Strip backend URLs** from config in the COPY
4. **Replace theme** with cu_ui in the COPY
5. **Replace UI components** with cu_ui in the COPY

**All changes happen in:** `cuapp-base-clean/`

**Original remains:** `cuapp/` (untouched)

---

## STEP 3: E2E TEST ASSESSMENT

### What's in E2E Tests:

**Location:** `integration_test/` folder

**Tests Found:**
1. **`app_start_test.dart`** - Tests app startup, upgrade modal, login flow
2. **`authentication_test.dart`** - Tests authentication success, overview display
3. **`pdf_viewer_test.dart`** - Tests PDF viewer features (navigation, share, search, zoom, local PDFs)
4. **`robots/base_robot.dart`** - Base robot pattern for page objects
5. **`robots/pdf_viewer_robot.dart`** - PDF viewer specific robot

### Value Assessment: **HIGH VALUE (8/10)**

**Strengths:**
- ✅ **Robot Pattern** - Clean page object pattern (BaseRobot)
- ✅ **Integration Tests** - Real Flutter integration tests
- ✅ **Coverage** - Tests critical flows (auth, app start, PDF viewer)
- ✅ **Maintainable** - Well-structured with robot pattern
- ✅ **Reusable** - BaseRobot can be extended for new features

**What to Keep:**
- ✅ **BaseRobot** - Excellent pattern, keep and extend
- ✅ **Test structure** - Good organization
- ✅ **Integration test setup** - Proper Flutter integration test setup

**What to Update:**
- ⚠️ **Update for mock auth** - Authentication tests need updating for mock auth
- ⚠️ **Update for cu_ui** - Widget finders may need updates for cu_ui components
- ⚠️ **Add more tests** - Can add tests for other features

**Recommendation:**
- **KEEP** the E2E test structure
- **UPDATE** tests to work with mock data and cu_ui
- **EXTEND** with more feature tests
- **COPY** to the new clean app folder

---

## STEP 4: COPY E2E TESTS TO CLEAN APP

```bash
# Copy integration tests to clean app
cp -r cuapp-base-clean/integration_test cuapp-base-clean/integration_test_original_backup

# Keep original tests, update them for new app
```

---

## FINAL STRUCTURE

```
configuration-matrix-build/
├── cuapp-base-clean/              # NEW: Clean copy to work on
│   ├── lib/                       # Cleaned code
│   ├── integration_test/          # E2E tests (updated)
│   └── ...
│
└── [original cuapp remains untouched]
```

---

## WORKFLOW

1. ✅ **Copy folder** - Create `cuapp-base-clean`
2. ✅ **Clean copy** - Strip GraphQL, replace with mock
3. ✅ **Update E2E tests** - Make them work with mock data
4. ✅ **Replace UI** - Use cu_ui components
5. ✅ **Test** - Run E2E tests on clean app
6. ✅ **Original untouched** - Can reference original anytime

---

## NOTES

- **Original is safe** - Never modify the original cuapp folder
- **Copy is disposable** - Can recreate copy if needed
- **E2E tests valuable** - Keep and update, don't delete
- **Robot pattern excellent** - Extend BaseRobot for new features
