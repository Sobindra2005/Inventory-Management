# Deployment & Integration Checklist

## Pre-Deployment Verification

### Backend Setup
- [ ] File `backend/app/services/seed_data.py` exists and has no syntax errors
- [ ] File `backend/app/api/v1/endpoints/seed.py` exists and has no syntax errors
- [ ] `backend/app/api/v1/router.py` includes `from app.api.v1.endpoints.seed import router as seed_router`
- [ ] `backend/app/api/v1/router.py` includes `api_router.include_router(seed_router, tags=["Seed"])`
- [ ] Verify imports in `seed.py`:
  ```python
  from fastapi import APIRouter, HTTPException, Request, status
  from pydantic import BaseModel, Field
  from bson import ObjectId
  from app.api.deps import get_mongo_db
  from app.services.seed_data import SeedDataGenerator
  ```

### Frontend Setup
- [ ] File `frontend/lib/api/seed.ts` exists and exports `seedApi` and types
- [ ] File `frontend/lib/queries/use-seed-query.ts` exists and exports hooks
- [ ] File `frontend/lib/hooks/use-onboarding.ts` exists and exports `useOnboarding`
- [ ] File `frontend/lib/utils/onboarding.ts` exists and exports utility functions
- [ ] File `frontend/components/onboarding/sample-data-dialog.tsx` exists
- [ ] File `frontend/components/onboarding/post-seeding-dialog.tsx` exists
- [ ] File `frontend/app/dashboard/page.tsx` includes:
  ```typescript
  import { useOnboarding } from '@/lib/hooks/use-onboarding';
  import { OnboardingSampleDataDialog } from '@/components/onboarding/sample-data-dialog';
  import { PostSeedingDialog } from '@/components/onboarding/post-seeding-dialog';
  ```

---

## Functional Testing

### Backend API Endpoints

#### 1. Test POST /api/v1/seed
```bash
# Test with valid request
curl -X POST http://localhost:8000/api/v1/seed \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "num_products": 10,
    "num_customers": 5,
    "num_invoices": 15
  }'

# Expected Response (202 or 201):
# {
#   "success": true,
#   "message": "Successfully seeded 30 records",
#   "productsCreated": 10,
#   "customersCreated": 5,
#   "invoicesCreated": 15,
#   "totalRecords": 30
# }
```
- [ ] Response status: 201 Created
- [ ] All counters match requested quantities
- [ ] Success: true
- [ ] Data appears in MongoDB collections

#### 2. Test GET /api/v1/seed/status
```bash
curl http://localhost:8000/api/v1/seed/status \
  -H "Authorization: Bearer test-token"

# Expected Response:
# {
#   "hasData": true,
#   "recordCounts": {
#     "products": 10,
#     "customers": 5,
#     "invoices": 15
#   },
#   "totalRecords": 30
# }
```
- [ ] hasData: true (if data was seeded)
- [ ] Record counts match seeded quantities
- [ ] Response time < 500ms

#### 3. Test DELETE /api/v1/seed
```bash
curl -X DELETE http://localhost:8000/api/v1/seed \
  -H "Authorization: Bearer test-token"

# Expected Response:
# {
#   "success": true,
#   "message": "Successfully cleared 30 records",
#   "productsDeleted": 10,
#   "customersDeleted": 5,
#   "invoicesDeleted": 15,
#   "totalRecordsDeleted": 30
# }
```
- [ ] Response status: 200 OK
- [ ] All deletion counts accurate
- [ ] Verify collections are empty: GET /api/v1/seed/status shows hasData: false
- [ ] Dashboard data is empty after clear

#### 4. Test Error Cases
```bash
# Without auth header (should get 401)
curl http://localhost:8000/api/v1/seed/status

# With invalid token (should get 401)
curl http://localhost:8000/api/v1/seed/status \
  -H "Authorization: Bearer invalid-token"

# With database down (should get 503)
# Stop MongoDB, then try seeding
```
- [ ] 401 Unauthorized without valid token
- [ ] 503 Service Unavailable if database unreachable
- [ ] Error messages are descriptive

---

### Frontend Component Testing

#### 1. First Visit Experience
1. [ ] Open browser DevTools → Application → Storage → LocalStorage
2. [ ] Verify `inventory_onboarding_completed` does NOT exist
3. [ ] Navigate to dashboard
4. [ ] Verify `OnboardingSampleDataDialog` appears (not `PostSeedingDialog`)
5. [ ] Dialog shows:
   - [ ] Title: "Welcome to Your Dashboard"
   - [ ] Question about sample data
   - [ ] List of benefits (Products, Customers, Invoices)
   - [ ] Two buttons: "Start Empty" and "Load Sample Data"

#### 2. Seeding Flow
1. [ ] Click "Load Sample Data"
2. [ ] Verify loading state:
   - [ ] Button shows spinner/loading text
   - [ ] Dialog is still visible
   - [ ] Can't click buttons (disabled)
3. [ ] Wait 2-3 seconds, verify seeding completes
4. [ ] Verify `PostSeedingDialog` appears with:
   - [ ] Green checkmark icon
   - [ ] Record counts (100, 50, 150)
   - [ ] Total: 300 records
   - [ ] Two buttons: "Clear Data" and "Keep Sample Data"

#### 3. Accept Sample Data
1. [ ] Click "Keep Sample Data"
2. [ ] Verify both dialogs close
3. [ ] Verify dashboard shows populated data:
   - [ ] KPI cards show non-zero values
   - [ ] Low stock products list shows items
   - [ ] Recent reports list shows entries
4. [ ] Check LocalStorage:
   - [ ] `inventory_onboarding_completed` now exists
   - [ ] Contains timestamp and user agent

#### 4. Reject Sample Data (Discard)
1. [ ] Reset: `localStorage.removeItem('inventory_onboarding_completed')`
2. [ ] Reload page
3. [ ] Dialogs should reappear
4. [ ] Click "Load Sample Data" → wait for post-seeding dialog
5. [ ] Click "Clear Data"
6. [ ] Verify loading state during clearing
7. [ ] Both dialogs close
8. [ ] Dashboard shows empty state (no KPI values, no items)

#### 5. Skip Seeding (Start Empty)
1. [ ] Reset: `localStorage.removeItem('inventory_onboarding_completed')`
2. [ ] Reload page
3. [ ] Click "Start Empty"
4. [ ] Verify initial dialog closes (post-seeding NOT shown)
5. [ ] Verify dashboard shows empty state
6. [ ] Check LocalStorage: `inventory_onboarding_completed` exists

#### 6. Subsequent Visits
1. [ ] Reload page
2. [ ] Verify NEITHER dialog shows
3. [ ] Verify dashboard data is preserved
4. [ ] Check LocalStorage: flag still exists with same timestamp

---

### React Query Hooks Testing

#### 1. useSeedStatus Hook
```typescript
// In component
const { data, isLoading, isError } = useSeedStatus();

// Test conditions:
// - isLoading: true initially
// - data: undefined initially
// - After 1-2 seconds: data populated
// - isLoading: false
// - data.hasData: true if seeded, false if empty
// - data.totalRecords: matches expected count
```
- [ ] Hook queries correctly
- [ ] Data loads within 2 seconds
- [ ] Error state handled gracefully

#### 2. useSeedData Hook
```typescript
// In component
const seedMutation = useSeedData();

// Test:
// seedMutation.mutate()
// - isPending: true
// - isLoading spinner shows
// - After seeding: isPending: false
// - isSuccess: true
// - data: SeedDataResponse
// - all queries invalidated: dashboard updates
```
- [ ] Mutation triggers correctly
- [ ] Loading state shows during seeding
- [ ] Success state shows after completion
- [ ] Dashboard queries auto-refresh

#### 3. useClearData Hook
```typescript
// Similar to useSeedData
// - isPending during clearing
// - isSuccess after clearing
// - isError if fails
// - Queries invalidated
```
- [ ] Clears correctly
- [ ] Loading state shows
- [ ] All dashboard queries refresh

---

### Integration Testing

#### 1. End-to-End Seeding Flow
- [ ] First visit → initial dialog
- [ ] Select "Load Sample Data" → seeding completes (2-3s)
- [ ] Post-seeding dialog shows → click "Keep"
- [ ] Dashboard populated with sample data
- [ ] KPI cards: all show non-zero values
- [ ] Low stock section: shows products
- [ ] Inventory page: can view all 100 products
- [ ] Customers page: can view all 50 customers
- [ ] Sales page: can view all 150 invoices
- [ ] Dashboard reports: can generate reports with data

#### 2. Data Isolation Testing
- [ ] Create two test users (different auth tokens)
- [ ] Seed user1 with 100 products
- [ ] Seed user2 with 100 products (different data)
- [ ] Verify user1 only sees user1's products
- [ ] Verify user2 only sees user2's products
- [ ] Verify user1 clear only deletes user1's data
- [ ] Verify user2's data remains intact

#### 3. Error Recovery Testing
- [ ] Seed data → during loading, trigger network error
- [ ] Verify error state is shown
- [ ] Verify user can retry
- [ ] On retry, seeding succeeds
- [ ] Verify no duplicate data created

#### 4. Performance Testing
- [ ] Measure seeding time: should be 2-3 seconds
- [ ] Verify payload size: check Network tab
  - [ ] Request: < 1KB (just parameters)
  - [ ] Response: gzipped < 100KB
- [ ] Verify dashboard loads: should be < 2s after seeding
- [ ] Verify queries invalidate and refetch

---

## Documentation Verification

- [ ] `SEEDING_IMPLEMENTATION.md` exists and is comprehensive
- [ ] `SEEDING_QUICK_REFERENCE.md` exists with examples
- [ ] `IMPLEMENTATION_SUMMARY.md` exists with overview
- [ ] README updated (if applicable) with link to seeding docs
- [ ] Code has inline comments explaining complex logic

---

## Browser Compatibility Testing

Test in these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Verify:
- [ ] Dialogs render correctly (modal backdrop, positioning)
- [ ] Buttons are clickable and have correct cursor
- [ ] Loading spinners animate smoothly
- [ ] Text is readable with current color scheme
- [ ] No console errors or warnings

---

## Mobile Testing

- [ ] Open dashboard on mobile (iPhone/Android simulation)
- [ ] Dialog appears with correct sizing
- [ ] Buttons are touch-friendly (good hit targets)
- [ ] Text doesn't overflow
- [ ] Spinner doesn't stutter
- [ ] No layout shifts while loading

---

## Accessibility Testing

- [ ] Dialog has proper ARIA labels (role="dialog")
- [ ] Buttons have clear text labels
- [ ] Keyboard navigation works:
  - [ ] Tab to cycle through buttons
  - [ ] Enter/Space to click buttons
  - [ ] Escape to close dialog (optional, if implemented)
- [ ] Screen reader can read dialog content
- [ ] Color contrast meets WCAG AA standards

---

## Performance Checkpoints

- [ ] Seeding endpoint response time: < 5 seconds
- [ ] Status check response time: < 500ms
- [ ] Dashboard load after seeding: < 2 seconds
- [ ] Dialog render time: < 100ms
- [ ] Initial page load: not impacted by onboarding code
- [ ] JS bundle size: check impact of new hooks/components

---

## Production Readiness Checklist

- [ ] All error messages are user-friendly (no stack traces)
- [ ] No console errors in production build
- [ ] No console warnings in production build
- [ ] Sentry/error tracking configured (if applicable)
- [ ] Rate limiting considered (add to roadmap if needed)
- [ ] CORS headers configured correctly
- [ ] Auth tokens validated on every endpoint
- [ ] No sensitive data logged
- [ ] MongoDB indexes optimized (if needed)

---

## Rollout Plan

### Phase 1: Internal Testing (Staging)
- [ ] Deploy to staging environment
- [ ] QA team runs full test suite
- [ ] Performance profiling completed
- [ ] No critical issues found

### Phase 2: Beta Users (10% of users)
- [ ] Deploy to production with feature flag
- [ ] Monitor error rates (should be 0)
- [ ] Collect user feedback
- [ ] No performance degradation

### Phase 3: Gradual Rollout (25%, 50%, 75%)
- [ ] Monitor analytics: onboarding completion rate
- [ ] Check for any reported issues
- [ ] Verify data integrity

### Phase 4: Full Rollout (100%)
- [ ] Remove feature flag
- [ ] Monitor for 24-48 hours
- [ ] Declare stable

---

## Post-Deployment Monitoring

### Metrics to Track
- [ ] Seeding request success rate (should be ~99%)
- [ ] Average seeding time (should be 2-3s)
- [ ] Onboarding completion rate
- [ ] Users who chose "Keep" vs "Clear" data
- [ ] Dashboard performance impact
- [ ] Error rate on seed endpoints

### Alerts to Set Up
- [ ] Seeding success rate < 95%
- [ ] Seeding average time > 10 seconds
- [ ] Error rate on /api/v1/seed > 5%
- [ ] Database size growing unexpectedly

---

## Rollback Plan

If critical issues occur:

```bash
# 1. Disable feature
# In dashboard/page.tsx, set autoShow: false

# 2. Clear all seeded data for all users (optional)
# Would need admin endpoint to do this

# 3. Revert router.py
# Remove seed router from api_router.include_router()

# 4. Remove component imports
# Comment out or remove import statements

# 5. Redeploy
```

---

## Cleanup & Maintenance

### Weekly
- [ ] Check MongoDB disk usage
- [ ] Monitor error logs for seed endpoint

### Monthly
- [ ] Review onboarding metrics
- [ ] Check for any performance regressions
- [ ] Update documentation if needed

### Quarterly
- [ ] Consider adding more data categories
- [ ] Review user feedback
- [ ] Plan enhancements (see IMPLEMENTATION_SUMMARY.md)

---

## Sign-Off

- [ ] **Developer**: All code complete and tested
- [ ] **Reviewer**: Code reviewed and approved
- [ ] **QA**: Full test suite passed
- [ ] **Product**: Feature approved for release
- [ ] **DevOps**: Infrastructure ready
- [ ] **Date**: ________________
- [ ] **Release Version**: ________________

---

**Use this checklist before every deployment to ensure quality and consistency.**
