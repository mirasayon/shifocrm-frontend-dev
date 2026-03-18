# Doctor Public Profile MVP - ShifoCRM

## Overview

This MVP enables each doctor in ShifoCRM to get a **public shareable profile page** that captures patient leads for the CRM.

**Key Features**:
- ✅ Public profile page by unique slug (e.g., `/d/dr-john-smith`)
- ✅ Shareable link for Instagram, Telegram, WhatsApp, QR codes
- ✅ Doctor info display (photo, specialty, clinic)
- ✅ Services list with pricing
- ✅ Quick action buttons (Call, Telegram, WhatsApp)
- ✅ Lead capture form with validation
- ✅ Lead storage in database
- ✅ Clinic staff lead management

**Non-Goals (for this MVP)**:
- ❌ Appointment scheduling (separate feature)
- ❌ Real-time calendar sync
- ❌ Payment processing
- ❌ Patient account/login
- ❌ Advanced analytics
- ❌ Email/SMS notifications (phase 2)

---

## Architecture Overview

```
PUBLIC FLOW:
1. Patient opens shared link: /d/dr-john-smith
2. Frontend fetches doctor by slug (no auth needed)
3. Shows doctor profile, services, contact options
4. Patient can click Call/WhatsApp/Telegram directly
   OR fill out lead form with name, phone, service, note
5. Form submission creates lead in database
6. CRM staff sees new lead and contacts patient manually

INTERNAL FLOW:
1. Admin enables doctor public profile
2. Sets is_public = true, public_slug, bio, phone, socials
3. Doctor can share the link anywhere
4. Clinic staff views leads in Supabase/future admin dashboard
5. Staff marks lead as contacted, converted, rejected, etc.
```

---

## File Structure

```
shifocrm/
├── SUPABASE_DOCTOR_PUBLIC_PROFILE_MIGRATION.sql    # Database schema
├── DOCTOR_PUBLIC_PROFILE_SEED.sql                   # Example test data
├── DOCTOR_PUBLIC_PROFILE_API.md                     # API documentation
├── DOCTOR_PUBLIC_PROFILE_SETUP.md                   # Setup guide
├── DOCTOR_PUBLIC_PROFILE_README.md                  # This file
│
├── src/
│   ├── api/
│   │   ├── leadsApi.js                              # Lead CRUD operations
│   │   └── doctorsPublicApi.js                      # Doctor profile queries
│   │
│   ├── views/
│   │   └── DoctorPublicProfileView.vue              # Main public page
│   │
│   ├── components/
│   │   └── public/
│   │       └── DoctorLeadForm.vue                   # Lead form component
│   │
│   └── router/
│       └── index.js                                 # Updated with /d/:slug route
```

---

## Quick Start

### 1. Deploy to Supabase

```bash
# 1. Open Supabase SQL Editor
# https://app.supabase.com/project/[YOUR_PROJECT]/sql/new

# 2. Copy entire contents of:
#    SUPABASE_DOCTOR_PUBLIC_PROFILE_MIGRATION.sql

# 3. Paste into SQL editor and click Run

# 4. Migration should complete without errors
```

### 2. Seed Test Data (Optional)

```bash
# 1. In Supabase SQL Editor, create new query
# 2. Copy DOCTOR_PUBLIC_PROFILE_SEED.sql
# 3. Run to populate example doctors and leads
```

### 3. Start Development Server

```bash
npm run dev

# Open browser to:
# http://localhost:5173/d/dr-john-smith
```

### 4. Test Lead Submission

1. Fill out form: Name, Phone, Service, Note
2. Click "Submit Request"
3. Should see success toast
4. Check Supabase `leads` table - new row appears

---

## API Overview

### Public Endpoints (No Auth Required)

#### GET `/d/:slug`
Displays doctor profile page.
```
http://localhost:5173/d/dr-john-smith
```
- Fetches doctor by `public_slug`
- Shows profile only if `is_public = true`
- Displays services and lead form

#### POST `/rest/v1/leads` (via leadsApi.js)
Submit a public lead.
```javascript
const lead = await createLead({
  doctor_id: 123,
  clinic_id: 456,
  patient_name: 'Ahmad',
  phone: '+998901234567',
  selected_service: 'Cleaning',
  note: 'Sensitive teeth'
})
```

### Authenticated Endpoints (Auth Required)

#### GET `/rest/v1/leads?clinic_id=456`
Get all leads for a clinic (admin only).
```javascript
const leads = await listLeadsByClinic(456)
```

#### GET `/rest/v1/leads?doctor_id=123`
Get leads for a specific doctor.
```javascript
const leads = await listLeadsByDoctor(123)
```

#### PATCH `/rest/v1/leads/{id}`
Update lead status.
```javascript
await updateLeadStatus(789, 'contacted')
```

---

## Component Reference

### DoctorPublicProfileView.vue
Main public profile page.

**Route**: `/d/:slug`

**Props**: None (reads slug from URL)

**Features**:
- Doctor card with avatar, name, specialty
- Clinic name and logo
- Bio section
- Action buttons (Call, Telegram, WhatsApp, Share)
- Services grid with pricing
- Lead form component

**Data Fetched**:
- Doctor by slug: `getDoctorByPublicSlug(slug)`
- Clinic info: `getDoctorClinicInfo(clinic_id)`
- Services: `getDoctorServices(clinic_id)`

**Error States**:
- Doctor not found → "Doctor Not Found" message
- Loading state → Spinner animation
- API error → "Error loading profile" message

---

### DoctorLeadForm.vue
Reusable lead capture form.

**Props**:
```javascript
{
  doctorId: Number,      // Doctor ID (required)
  clinicId: Number,      // Clinic ID (required)
  services: Array        // Services for dropdown (optional)
}
```

**Features**:
- Patient name input (2-100 chars)
- Phone input (flexible format)
- Service dropdown (optional)
- Additional info textarea (max 500 chars)
- Real-time form validation
- Loading state during submission
- Success/error toast notifications
- Form reset after successful submit
- Privacy policy notice

**Validation Rules**:
- Name: Required, 2-100 characters
- Phone: Required, must contain digits
- Service: Optional, matches dropdown
- Note: Optional, max 500 characters

**Events**:
- Emits success/error via `vue-toastification`
- No custom emit events

---

## Database Schema

### doctors table (additions)
```sql
is_public: BOOLEAN DEFAULT false
public_slug: TEXT UNIQUE
public_bio: TEXT
public_avatar_url: TEXT
public_phone: TEXT
public_telegram: TEXT (@username format)
public_whatsapp: TEXT (phone number)
```

### leads table (new)
```sql
id: BIGINT PRIMARY KEY
clinic_id: BIGINT FK → clinics(id)
doctor_id: BIGINT FK → doctors(id)
patient_name: TEXT NOT NULL
phone: TEXT NOT NULL
selected_service: TEXT
note: TEXT (max 500 chars)
source: TEXT DEFAULT 'doctor_public_page'
status: TEXT DEFAULT 'new'
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP (auto-update)
```

**Status Values**:
- `new` - Initial submission
- `contacted` - CRM staff called/messaged patient
- `converted` - Became appointment/customer
- `rejected` - Not interested
- `duplicate` - Duplicate lead

**Indexes** (for performance):
- `idx_leads_clinic_id`
- `idx_leads_doctor_id`
- `idx_leads_status`
- `idx_leads_created_at DESC`
- `idx_doctors_public_slug` (public profile lookups)
- `idx_doctors_is_public` (filter public doctors)

---

## Usage Workflows

### Workflow 1: Make Doctor Public

**Who**: Clinic Admin
**Where**: Doctor Management (or Supabase directly)

```
1. Go to /doctors (if dashboard exists)
2. Select doctor to make public
3. Set:
   - is_public = true
   - public_slug = auto or custom (e.g., "dr-john-smith")
   - public_bio = "Dr. John is experienced..."
   - public_avatar_url = upload or URL
   - public_phone = +998901234567
   - public_telegram = @dr_john
   - public_whatsapp = +998901234567
4. Save
5. Get link: https://domain.com/d/dr-john-smith
6. Share on social media
```

### Workflow 2: Patient Submits Lead

**Who**: Patient (anonymous)
**Where**: Public profile page

```
1. Click link: https://domain.com/d/dr-john-smith
2. See doctor profile
3. Either:
   a) Click Call/WhatsApp/Telegram (direct contact)
   b) Fill lead form (name, phone, service, note)
4. Submit form
5. See success message: "Request submitted!"
6. CRM gets lead notification (future)
```

### Workflow 3: CRM Staff Manages Lead

**Who**: Clinic Admin/Reception
**Where**: Leads Dashboard (or Supabase directly)

```
1. Open leads list for clinic
2. See new lead: Ahmed, +998901234567, Root Canal
3. Click lead to view details
4. Make call to patient
5. Update status: "contacted"
6. If patient books appointment, update: "converted"
7. If not interested, update: "rejected"
```

---

## Testing Checklist

### Manual Tests
- [ ] Navigate to `/d/invalid-slug` → "Doctor Not Found"
- [ ] Navigate to `/d/valid-slug` → Doctor profile loads
- [ ] Doctor card shows: name, photo, specialty, clinic
- [ ] Services list shows: name and price for each
- [ ] Call button: clicking opens phone dialer
- [ ] Telegram button: opens Telegram chat (if configured)
- [ ] WhatsApp button: opens WhatsApp chat (if configured)
- [ ] Share button: copies link or opens native share
- [ ] Lead form validation:
  - [ ] Submit without name → "Name is required"
  - [ ] Submit without phone → "Phone is required"
  - [ ] Submit with valid data → Lead created
- [ ] Success message appears after submit
- [ ] Form resets for new entry
- [ ] Lead appears in Supabase `leads` table

### API Tests
```javascript
// Test 1: Get doctor by slug
const doc = await getDoctorByPublicSlug('dr-john-smith')
console.assert(doc?.id > 0, 'Doctor should load')

// Test 2: Get clinic services
const services = await getDoctorServices(456)
console.assert(Array.isArray(services), 'Should return array')

// Test 3: Create lead
const lead = await createLead({
  doctor_id: 123,
  clinic_id: 456,
  patient_name: 'Test',
  phone: '+998901234567'
})
console.assert(lead?.id, 'Lead should have ID')

// Test 4: List leads
const leads = await listLeadsByClinic(456)
console.assert(Array.isArray(leads), 'Should return array')

// Test 5: Update status
const updated = await updateLeadStatus(lead.id, 'contacted')
console.assert(updated?.status === 'contacted', 'Status should update')
```

---

## Performance Considerations

### Optimization Done
- ✅ Indexes on frequently queried columns
- ✅ Lazy-loading Vue components
- ✅ Database queries optimized
- ✅ RLS policies for security

### Future Optimizations
- [ ] Cache doctor profile (5-minute TTL)
- [ ] Paginate leads for clinics with 1000+
- [ ] Image optimization for avatars
- [ ] CDN for avatar/clinic logos

---

## Security

### RLS Policies
- Public: Can INSERT and READ leads (anonymous)
- Clinic Staff: Can SELECT/UPDATE/DELETE leads for their clinic
- Doctors: Can SELECT leads for their profile

### No Authentication Required For
- Viewing public doctor profiles
- Submitting leads
- Viewing services

### Authentication Required For
- Viewing leads (clinic staff)
- Updating lead status (clinic staff/admin)
- Configuring doctor public profile (admin)

### Data Validation
- All inputs trimmed and validated
- Phone must contain digits
- Name minimum 2 characters
- Note max 500 characters
- Form disabled during submission

---

## Troubleshooting

### "Doctor Not Found" on valid slug
- Check `is_public = true` in database
- Check slug format in URL matches database
- Clear browser cache

### Lead form won't submit
- Check browser console for JavaScript errors
- Verify name and phone are filled
- Check Supabase RLS policies allow INSERT

### Services list empty
- Check clinic has services created
- Verify `clinic_id` matches in database
- Check `getDoctorServices` API call

### Styling looks broken
- Clear browser cache
- Restart dev server: `npm run dev`
- Check TailwindCSS in `tailwind.config.js`

---

## Next Steps (Post-MVP)

### Phase 2: Lead Management Dashboard
- [ ] View all leads for clinic
- [ ] Filter by status, date, doctor
- [ ] Bulk operations (mark contacted, etc.)
- [ ] Quick create appointment from lead
- [ ] Export leads as CSV

### Phase 3: Lead Conversion
- [ ] Auto-create patient from lead
- [ ] Quick appointment scheduling
- [ ] Pre-fill appointment form with lead data

### Phase 4: Notifications & Analytics
- [ ] Email/SMS when lead submitted
- [ ] Lead analytics dashboard
- [ ] Conversion rates by doctor/service
- [ ] Lead source tracking

### Phase 5: Advanced Features
- [ ] Custom lead form fields per clinic
- [ ] Lead qualification scoring
- [ ] Automated lead routing
- [ ] Multi-language support
- [ ] Lead automation rules
- [ ] CRM integration (Zapier, etc.)

---

## Support & Questions

For issues or questions:
1. Check browser console (F12 → Console)
2. Check Supabase logs
3. Review SQL migration for errors
4. Test API functions directly
5. Check component console logs

For feature requests or bugs:
- Create GitHub issue with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser/version info
  - Screenshots if UI related

---

## License & Attribution

This MVP is part of ShifoCRM - Dental Clinic Management System.

---

## Changelog

### v1.0.0 (Initial MVP)
- ✅ Public doctor profile pages
- ✅ Lead capture form with validation
- ✅ Database schema and migrations
- ✅ API endpoints for leads
- ✅ Vue 3 components
- ✅ Complete documentation
- ✅ Seed data for testing

---

**Status**: ✅ Production Ready

**Last Updated**: 2024-03-17

**Maintainers**: ShifoCRM Team
