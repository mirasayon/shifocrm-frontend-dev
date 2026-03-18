# Doctor Public Profile MVP - Setup & Deployment Guide

## Phase 1: Database Setup

### Step 1.1: Run SQL Migration
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the contents of `SUPABASE_DOCTOR_PUBLIC_PROFILE_MIGRATION.sql`
4. Click "Run" (or Cmd+Enter)
5. Verify: Check that no errors appear

**What the migration does**:
- Adds 7 fields to `doctors` table for public profiles
- Creates new `leads` table with full schema
- Creates 9 indexes for query performance
- Sets up auto-update triggers
- Enables RLS policies
- Backfills existing doctors with unique `public_slug`

### Step 1.2: Verify Database Changes
In Supabase SQL Editor, run these queries to confirm:

```sql
-- Check doctors table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name='doctors' AND column_name IN ('is_public', 'public_slug', 'public_bio');

-- Check leads table exists
SELECT COUNT(*) FROM leads;

-- Check sample doctor has slug
SELECT id, full_name, public_slug FROM doctors LIMIT 5;
```

---

## Phase 2: API Layer

### Step 2.1: Verify API Files
Check these files exist and are not empty:

**1. `src/api/leadsApi.js`**
- Functions: `createLead`, `listLeadsByDoctor`, `listLeadsByClinic`, `updateLeadStatus`
- ~100 lines, exports 4 functions

**2. `src/api/doctorsPublicApi.js`**
- Functions: `getDoctorByPublicSlug`, `getDoctorServices`, `getDoctorClinicInfo`
- ~70 lines, exports 3 functions

### Step 2.2: Test API Functions (Optional)
You can test the API directly in browser console:

```javascript
// Test 1: Fetch doctor by slug
import { getDoctorByPublicSlug } from '@/api/doctorsPublicApi'
const doc = await getDoctorByPublicSlug('john-doe')
console.log('Doctor:', doc)

// Test 2: Get doctor services
import { getDoctorServices } from '@/api/doctorsPublicApi'
const services = await getDoctorServices(1)
console.log('Services:', services)

// Test 3: Create a test lead
import { createLead } from '@/api/leadsApi'
const lead = await createLead({
  doctor_id: 1,
  clinic_id: 1,
  patient_name: 'Test Patient',
  phone: '+998901234567'
})
console.log('Lead created:', lead)
```

---

## Phase 3: Frontend Components

### Step 3.1: Verify Component Files
Check these files exist:

**1. `src/views/DoctorPublicProfileView.vue`**
- Main public profile page
- ~250 lines
- Shows doctor card, services, lead form

**2. `src/components/public/DoctorLeadForm.vue`**
- Lead capture form component
- ~180 lines
- Form validation, error handling, success state

### Step 3.2: Verify Component Imports
Both components should import:
- `vue-toastification` (for notifications)
- API functions from `leadsApi.js` and `doctorsPublicApi.js`

---

## Phase 4: Router Configuration

### Step 4.1: Check Router Update
Open `src/router/index.js` and verify this route exists:

```javascript
{
  path: '/d/:slug',
  name: 'doctor-public-profile',
  component: () => import('@/views/DoctorPublicProfileView.vue'),
  meta: { requiresAuth: false }
}
```

It should be placed:
- AFTER the admin routes
- BEFORE the final `'/'` redirect
- Should NOT have `requiresAuth: true`

### Step 4.2: Test Route
Start dev server: `npm run dev`
- Navigate to: `http://localhost:5173/d/john-doe` (replace with actual doctor slug)
- Should load the doctor profile page OR show "Doctor Not Found" message

---

## Phase 5: Testing

### Test 5.1: Public Doctor Profile Page
1. Start dev server: `npm run dev`
2. Get a doctor slug:
   - Open Supabase → `doctors` table
   - Find a doctor with `is_public = true`
   - Copy their `public_slug` (e.g., "john-doe-abc123")
3. Navigate to: `http://localhost:5173/d/{slug}`
4. Should see:
   - ✓ Doctor name and specialty
   - ✓ Doctor photo (if exists)
   - ✓ Clinic name
   - ✓ Call, Telegram, WhatsApp buttons
   - ✓ Services list
   - ✓ Lead form

### Test 5.2: Submit Lead Form
1. On the profile page, fill out the form:
   - Patient Name: "Test Ahmad"
   - Phone: "+998901234567"
   - Service: (select one from dropdown)
   - Note: "Test lead"
2. Click "Submit Request"
3. Should see:
   - ✓ Loading spinner appears
   - ✓ Form fields become disabled
   - ✓ Success message appears
   - ✓ Green success toast notification
   - ✓ Form resets

### Test 5.3: Verify Lead in Database
1. Open Supabase → `leads` table
2. Should see new row with:
   - `patient_name`: "Test Ahmad"
   - `phone`: "+998901234567"
   - `status`: "new"
   - `source`: "doctor_public_page"

### Test 5.4: Lead Validation
1. Try submitting without patient name
2. Should see error: "Patient name required"
3. Try submitting without phone
4. Should see error: "Phone required"
5. Try calling without setting phone in form
6. Form should show validation error

### Test 5.5: Error Handling
1. Try accessing invalid slug: `/d/nonexistent-doctor`
2. Should see: "Doctor Not Found"
3. Try submitting form with network error (turn off internet)
4. Should see error toast: "Error submitting request. Please try again."

### Test 5.6: Lead Retrieval (Authenticated)
In browser console (after login):

```javascript
import { listLeadsByClinic, listLeadsByDoctor } from '@/api/leadsApi'

// Get all clinic leads
const clinicLeads = await listLeadsByClinic(1)
console.log('Clinic leads:', clinicLeads)

// Get specific doctor leads
const docLeads = await listLeadsByDoctor(1)
console.log('Doctor leads:', docLeads)

// Update lead status
import { updateLeadStatus } from '@/api/leadsApi'
await updateLeadStatus(leadId, 'contacted')
console.log('Status updated')
```

---

## Phase 6: Production Deployment

### Step 6.1: Pre-Deployment Checklist
- [ ] SQL migration completed on Supabase production
- [ ] All API files created and tested
- [ ] All Vue components created and tested
- [ ] Router updated with public route
- [ ] No console errors when accessing `/d/:slug`
- [ ] Lead form submits successfully
- [ ] Leads appear in database

### Step 6.2: Environment Variables
No additional environment variables needed (uses existing `SUPABASE_ANON_KEY`).

### Step 6.3: Build and Deploy
```bash
# Build production bundle
npm run build

# Test production build locally
npm run preview

# Deploy to Vercel (or your hosting)
# If using Vercel: git push (auto-deploys)
# If using manual hosting: upload dist/ folder
```

### Step 6.4: Post-Deployment Tests
1. Access `/d/{slug}` on production domain
2. Submit a test lead
3. Verify lead appears in production database
4. Check Supabase logs for any errors

---

## Phase 7: Doctor Profile Enablement

### Step 7.1: Configure Doctor Public Profiles (Admin)
After deployment, admins need to configure which doctors are public:

1. Login as clinic admin
2. Go to `/doctors` (doctors management)
3. For each doctor to make public:
   - [ ] Enable `is_public` checkbox
   - [ ] Set `public_slug` (auto-generated, can customize)
   - [ ] Upload `public_avatar_url` (optional)
   - [ ] Add `public_bio` (optional)
   - [ ] Set `public_phone` (optional, defaults to main phone)
   - [ ] Set `public_telegram` handle (e.g., @doctorjohn)
   - [ ] Set `public_whatsapp` number
4. Save
5. Share link: `https://yourdomain.com/d/{public_slug}`

### Step 7.2: Create Admin Dashboard for Leads (Optional for MVP)
For now, clinic staff can view leads in Supabase dashboard.
For production, create admin view in ShifoCRM:

```vue
<!-- Future: /src/views/LeadsView.vue -->
<template>
  <div class="leads-table">
    <!-- Show all leads for clinic -->
    <!-- Allow bulk status updates -->
    <!-- Create lead-to-patient button -->
  </div>
</template>
```

---

## Troubleshooting

### Issue: "Doctor Not Found" on valid slug
**Solution**:
1. Check doctor `is_public = true` in database
2. Check `public_slug` matches URL
3. Refresh page

### Issue: Form submission fails with "Invalid doctor_id"
**Solution**:
1. Check API is parsing doctor_id as Number
2. Verify doctor_id from database is numeric
3. Check browser console for actual error

### Issue: Services dropdown empty
**Solution**:
1. Check clinic has services created
2. Verify services have `clinic_id` set
3. Check `getDoctorServices` API call in console

### Issue: Lead not appearing in database
**Solution**:
1. Check browser console for errors
2. Check Supabase RLS policies allow INSERT
3. Verify `clinic_id` is correct
4. Check Supabase logs for SQL errors

### Issue: Styling/UI looks broken
**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Rebuild: `npm run dev`
3. Check TailwindCSS is loaded in index.html
4. Verify `tailwind.config.js` includes component paths

---

## Configuration Reference

### Environment Setup (if needed)
```javascript
// Already configured in supabaseConfig.js
SUPABASE_URL = 'https://qwngzvtanjlkvdbkvbew.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOi...' // Your anon key
```

### Database Table Aliases
- `leads` table: Lead submissions from public profiles
- `doctors` table: Doctor info + new public profile fields
- `services` table: Available services (existing)
- `clinics` table: Clinic info (existing)

### Feature Flags (None required)
This MVP is simple enough that no feature flags are needed.

---

## Performance Optimization (Future)

1. **Caching**:
   - Cache doctor profile data (5-minute TTL)
   - Cache services list per clinic
   
2. **Database**:
   - Indexes already created
   - Consider pagination for clinics with 1000+ leads
   
3. **Frontend**:
   - Lazy load avatar images
   - Minify components

---

## Success Metrics

After deployment, track:
- [ ] Number of public doctor profiles enabled
- [ ] Number of leads submitted per week
- [ ] Lead conversion rate (leads → appointments)
- [ ] Average time from lead → patient contact
- [ ] Which doctors get most leads
- [ ] Which services get most inquiries

---

## Support

For issues:
1. Check console errors (F12 → Console tab)
2. Check Supabase logs
3. Verify SQL migration completed
4. Test API functions directly
5. Rebuild: `npm run dev`

---

## Next Phase: Lead Management Dashboard

Post-MVP, create:
- View all leads for clinic
- Filter by status/date/doctor
- Bulk operations (mark as contacted, etc.)
- Lead-to-patient conversion button
- Lead-to-appointment creation
- Export leads as CSV
