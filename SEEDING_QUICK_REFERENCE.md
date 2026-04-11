# Data Seeding Quick Reference Guide

## For Users

### First-Time Visit
1. Dashboard loads → see sample data dialog
2. Click "Load Sample Data" → seeding in progress
3. See confirmation with record counts
4. Click "Keep Sample Data" → dashboard shows populated data
5. Onboarding complete ✓

### Clear Sample Data Later
- Navigate to Settings (implementation pending)
- Find "Sample Data" section
- Click "Clear All Data"
- Dashboard resets to empty

---

## For Developers

### 1. Using the Seeding Hook

#### Basic Usage
```typescript
import { useOnboarding } from '@/lib/hooks/use-onboarding';

function MyComponent() {
  const onboarding = useOnboarding();
  
  return (
    <>
      {/* Dialogs auto-show for first-time users */}
      <OnboardingSampleDataDialog
        open={onboarding.showInitialDialog}
        onConfirm={onboarding.handleSeedConfirm}
        onDecline={onboarding.handleSeedDecline}
        isLoading={onboarding.isLoading}
      />
    </>
  );
}
```

#### With Custom Options
```typescript
const onboarding = useOnboarding({
  autoShow: false,  // Manually control
  seedOptions: {
    numProducts: 200,
    numCustomers: 100,
    numInvoices: 300,
  },
  onComplete: (data) => {
    if (data) console.log('Seeded:', data.totalRecords);
  },
});

// Trigger manually
<button onClick={onboarding.startOnboarding}>
  Trigger Seeding
</button>
```

### 2. Manual Seeding via API

#### Direct Mutation Usage
```typescript
import { useSeedData, useClearData } from '@/lib/queries/use-seed-query';

function SeedButton() {
  const seedMutation = useSeedData();
  const clearMutation = useClearData();
  
  return (
    <div>
      <button 
        onClick={() => seedMutation.mutate()}
        disabled={seedMutation.isPending}
      >
        {seedMutation.isPending ? 'Seeding...' : 'Seed Data'}
      </button>
      
      {seedMutation.data && (
        <p>Created {seedMutation.data.totalRecords} records</p>
      )}
    </div>
  );
}
```

### 3. Check Seeding Status

```typescript
import { useSeedStatus } from '@/lib/queries/use-seed-query';

function DataStatus() {
  const { data, isLoading } = useSeedStatus();
  
  if (data?.hasData) {
    return <p>Database has {data.totalRecords} records</p>;
  }
  
  return <p>Database is empty</p>;
}
```

### 4. API Endpoint Direct Calls

#### JavaScript/Node.js
```typescript
import { seedApi } from '@/lib/api/seed';

// Seed
const result = await seedApi.seedData({
  numProducts: 100,
  numCustomers: 50,
  numInvoices: 150,
});
console.log(`Created ${result.totalRecords} records`);

// Clear
const cleared = await seedApi.clearData();
console.log(`Deleted ${cleared.totalRecordsDeleted} records`);

// Check status
const status = await seedApi.getStatus();
console.log('Has data:', status.hasData);
```

#### cURL
```bash
# Seed data
curl -X POST http://localhost:8000/api/v1/seed \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "num_products": 100,
    "num_customers": 50,
    "num_invoices": 150
  }'

# Get status
curl http://localhost:8000/api/v1/seed/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear data
curl -X DELETE http://localhost:8000/api/v1/seed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Python
```python
import httpx

client = httpx.AsyncClient()
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# Seed
response = await client.post(
    "http://localhost:8000/api/v1/seed",
    headers=headers,
    json={
        "num_products": 100,
        "num_customers": 50,
        "num_invoices": 150,
    }
)
print(response.json())

# Status
response = await client.get(
    "http://localhost:8000/api/v1/seed/status",
    headers=headers
)
print(response.json())

# Clear
response = await client.delete(
    "http://localhost:8000/api/v1/seed",
    headers=headers
)
print(response.json())
```

### 5. Testing First-Time Experience

```typescript
// In browser console
// Reset first-time user flag
localStorage.removeItem('inventory_onboarding_completed');
location.reload();

// Or in tests
import { resetFirstTimeUser } from '@/lib/utils/onboarding';
resetFirstTimeUser();
```

### 6. Customizing Data Generation

Modify `backend/app/services/seed_data.py`:

```python
from app.services.seed_data import SeedDataGenerator

class CustomSeedGenerator(SeedDataGenerator):
    PRODUCT_CATEGORIES = [
        "Custom Category 1",
        "Custom Category 2",
    ]
    
    FIRST_NAMES = ["Custom", "Names"]
    
    @classmethod
    def generate_product(cls, user_id: str):
        # Custom logic
        product = super().generate_product(user_id)
        product['customField'] = 'custom_value'
        return product
```

---

## Common Scenarios

### Scenario 1: Disable Onboarding Globally
```typescript
// In dashboard/page.tsx
const onboarding = useOnboarding({
  autoShow: false,  // Disable auto-show
});
```

### Scenario 2: Add Settings Page Toggle
```typescript
// components/settings/clear-data.tsx
function ClearDataSection() {
  const clearMutation = useClearData();
  
  return (
    <button
      onClick={() => clearMutation.mutate()}
      className="bg-destructive text-destructive-foreground p-2 rounded"
    >
      Clear All Sample Data
    </button>
  );
}
```

### Scenario 3: Seed Specific Collections Only
```python
# Create new endpoint in seed.py
@router.post("/products-only")
async def seed_products_only(request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    
    products = SeedDataGenerator.generate_bulk_products(user_id, 200)
    result = await database["inventory_items"].insert_many(products)
    
    return {
        "success": True,
        "productsCreated": len(result.inserted_ids),
    }
```

### Scenario 4: Add Admin Seed Dashboard
```python
# New endpoint for admin
@router.post("/admin/seed-all-users")
async def admin_seed_all_users(
    request: Request,
    admin_api_key: str = Header(...)
):
    # Verify admin key
    # Get all users
    # Seed each user's database
    pass
```

---

## Data Validation & Testing

### Verify Seeded Data
```typescript
// After seeding, check in dashboard
import { dashboardApi } from '@/lib/api/dashboard';

const data = await dashboardApi.fetchDashboardData();

console.assert(data.kpi.todaySales > 0, 'Sales should exist');
console.assert(data.lowStock.products.length > 0, 'Products should exist');
```

### Load Testing
```bash
# Seed 1000 products for stress testing
curl -X POST http://localhost:8000/api/v1/seed \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "num_products": 1000,
    "num_customers": 500,
    "num_invoices": 2000
  }'
```

---

## Troubleshooting

### Issue: Dialog Not Showing on First Visit
**Cause**: `autoShow: false` or `localStorage` already contains completion flag

**Fix**:
```javascript
// In browser console
localStorage.removeItem('inventory_onboarding_completed');
location.reload();
```

### Issue: Seeding Takes Too Long
**Cause**: Network latency or database performance

**Fix**: 
- Reduce quantities: `numProducts: 50` instead of 100
- Check database indexes on MongoDB
- Monitor network tab in DevTools

### Issue: "Database unavailable" Error
**Cause**: Backend MongoDB not connected

**Fix**:
```bash
# Check backend logs
docker logs -f backend_container

# Test MongoDB connection
mongo mongodb://mongo:27017 --eval "db.adminCommand('ping')"
```

### Issue: Data Not Appearing in Dashboard
**Cause**: Dashboard queries cached, need invalidation

**Fix**:
```typescript
// Force refresh
import { useQueryClient } from '@tanstack/react-query';
const queryClient = useQueryClient();
queryClient.invalidateQueries();
```

---

## Performance Tips

### For Large Datasets
```typescript
// Seed in smaller batches
const batches = 5;
const batchSize = Math.ceil(1000 / batches);

for (let i = 0; i < batches; i++) {
  await seedApi.seedData({
    numProducts: batchSize,
  });
  await new Promise(r => setTimeout(r, 1000)); // Delay between batches
}
```

### Monitor Seeding Progress
```typescript
// Add to Post-Seeding Dialog
const unsubscribe = seedMutation.subscribe(data => {
  console.log(`Progress: ${data.productsCreated}/${data.totalRecords}`);
});
```

---

## Integration with Other Features

### Connect with Analytics
```typescript
const onboarding = useOnboarding({
  onComplete: (data) => {
    if (data) {
      gtag('event', 'onboarding_completed', {
        products: data.productsCreated,
        customers: data.customersCreated,
        invoices: data.invoicesCreated,
      });
    }
  },
});
```

### Integrate with Notifications
```typescript
const seedMutation = useSeedData();

useEffect(() => {
  if (seedMutation.isSuccess) {
    showNotification({
      type: 'success',
      message: `Seeded ${seedMutation.data?.totalRecords} records`,
    });
  }
}, [seedMutation.isSuccess]);
```

---

## Support & Documentation

- Full implementation guide: [SEEDING_IMPLEMENTATION.md](SEEDING_IMPLEMENTATION.md)
- API contract: Backend README.md → "Seed" section
- Frontend patterns: See `frontend/lib/hooks/use-onboarding.ts`
