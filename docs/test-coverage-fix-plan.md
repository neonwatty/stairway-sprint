# Test Coverage Fix Plan

## Current Status
- **Total Tests**: 305 (118 failing, 187 passing)
- **Test Files**: 12 (8 failing, 4 passing)
- **Coverage**: 0% (due to test failures preventing coverage calculation)

## Test Execution Guidelines
**IMPORTANT**: Always use `--run` flag to prevent vitest watch mode and hanging processes:
- ✅ `npm run test -- --run`
- ✅ `npm run test:coverage -- --run`
- ❌ `npm run test` (starts watch mode)
- ❌ `vitest` (starts watch mode)

## Issues Identified

### 1. Phaser Mock Issues (Priority: HIGH)
**Status**: IN PROGRESS
- [x] Added `input.keyboard` mock structure
- [x] Added `rectangle` mock to scene.add
- [x] Added PostFX pipeline support
- [ ] Fix mock object return values not being tracked properly
- [ ] Add container mock for scene objects
- [ ] Add proper text measurement mocks

**Affected Tests**:
- AccessibilityManager (keyboard navigation)
- UIManager (all UI element creation)
- Scene tests (GameOverScene, SettingsScene, MainMenuScene)

### 2. AccessibilityManager Tests (Priority: HIGH)
**Status**: PENDING
- [ ] Fix color blind filter tests - mock results not being captured
- [ ] Fix keyboard event simulation
- [ ] Fix screen reader ARIA region tests
- [ ] Import Phaser mock properly in test file

**Specific Failures**:
- `should apply protanopia filter` - setFillStyle not being called
- `should apply deuteranopia filter` - setFillStyle not being called  
- `should apply tritanopia filter` - setFillStyle not being called
- `should apply color blind filter when mode changes` - Phaser.BlendModes undefined

### 3. UIManager Tests (Priority: HIGH)
**Status**: PENDING
- [ ] Fix scene initialization in beforeEach
- [ ] Add missing scene properties (scale, input)
- [ ] Fix event listener tests
- [ ] Fix responsive update tests

**Specific Failures**:
- All tests failing due to incomplete scene mock
- Cannot read properties of undefined (reading 'keyboard')

### 4. LivesManager Tests (Priority: MEDIUM)
**Status**: PENDING
- [ ] Fix heart display creation expectations
- [ ] Fix particle system mock for life gain animation
- [ ] Update test expectations to match new UIManager integration

**Specific Failures**:
- `should create heart icons for each life` - expects image creation
- `should play life gain animation with particles` - particle mock not triggering

### 5. ResponsiveUtils Tests (Priority: MEDIUM)
**Status**: PENDING
- [ ] Fix scaling calculation tests
- [ ] Fix device-specific scaling expectations

**Specific Failures**:
- `should scale differently for different devices` - same values returned
- `should get different padding for phone vs desktop` - same values returned

### 6. Scene Tests (Priority: LOW)
**Status**: PENDING
- [ ] GameOverScene - all tests failing
- [ ] SettingsScene - all tests failing  
- [ ] MainMenuScene - all tests failing

All scene tests need proper scene lifecycle mocks.

## Implementation Plan

### Phase 1: Fix Core Mocks
1. **phaser.mock.ts enhancements**:
   ```typescript
   // Add to Scene mock
   - Proper mock result tracking
   - Container mock with add/remove methods
   - Text bounds/metrics mock
   ```

2. **test setup.ts updates**:
   ```typescript
   // Add global Phaser object
   global.Phaser = mockPhaser;
   ```

### Phase 2: Fix Test Files
1. **AccessibilityManager.test.ts**:
   - Check mock.results array exists before accessing
   - Use mockReturnValueOnce for sequential calls
   - Verify mock is being called with scene

2. **UIManager.test.ts**:
   - Complete scene mock in beforeEach
   - Add all required managers to scene

3. **LivesManager.test.ts**:
   - Update expectations for new UIManager integration
   - Mock UIManager if needed

### Phase 3: Test Utilities
Create `/src/test/utils/`:
- `sceneTestHelper.ts` - Complete scene setup
- `managerTestHelper.ts` - Manager initialization
- `mockHelpers.ts` - Common mock patterns

## Success Metrics
- [ ] All 305 tests passing
- [ ] Coverage > 80%
- [ ] No hanging vitest processes
- [ ] Tests run in < 10 seconds

## Next Steps
1. Continue fixing phaser.mock.ts
2. Update test setup to include global Phaser
3. Fix AccessibilityManager color blind tests
4. Fix UIManager scene initialization
5. Create test utility helpers