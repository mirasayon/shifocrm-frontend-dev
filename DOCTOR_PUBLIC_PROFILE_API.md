# Doctor Public Profile API - MVP Documentation

## Overview
This MVP enables doctors to share their public profile as shareable links for lead capture. It's designed for simple lead collection before appointment scheduling is integrated.

**API Base URL**: Same Supabase REST endpoint as other ShifoCRM APIs

---

## Endpoints

### 1. GET /d/:slug
**Public Profile Page (No Auth Required)**

Displays doctor information and lead form.

**Request**:
```
GET /d/john-doe-abc123
```

**Response** (automatic - handled by frontend):
- Doctor name, photo, specialization
- Clinic info
- Services list
- Lead form

---

### 2. POST /api/leads
**Submit Lead (Public)**

**Endpoint**: `POST /rest/v1/leads`

**Body**:
```json
{
  "doctor_id": 123,
  "clinic_id": 456,
  "patient_name": "Ahmed Johnson",
  "phone": "+998901234567",
  "selected_service": "Root Canal",
  "note": "I have severe tooth pain"
}
```

**Response** (201 Created):
```json
{
  "id": 789,
  "doctor_id": 123,
  "clinic_id": 456,
  "patient_name": "Ahmed Johnson",
  "phone": "+998901234567",
  "selected_service": "Root Canal",
  "note": "I have severe tooth pain",
  "source": "doctor_public_page",
  "status": "new",
  "created_at": "2024-03-17T10:30:00Z",
  "updated_at": "2024-03-17T10:30:00Z"
}
```

**Status Codes**:
- `201`: Lead created successfully
- `400`: Validation error (missing name/phone)
- `500`: Server error

---

### 3. GET /api/leads?clinic_id=456
**Get Clinic Leads (Authenticated - Admin)**

**Request Headers**:
```
Authorization: Bearer {JWT_TOKEN}
```

**Response**:
```json
[
  {
    "id": 789,
    "doctor_id": 123,
    "patient_name": "Ahmed Johnson",
    "phone": "+998901234567",
    "selected_service": "Root Canal",
    "status": "new",
    "created_at": "2024-03-17T10:30:00Z"
  },
  ...
]
```

---

### 4. GET /api/leads?doctor_id=123
**Get Doctor Leads (Authenticated - Doctor)**

**Response**: Same as clinic leads, filtered by doctor_id

---

### 5. PATCH /api/leads/{id}
**Update Lead Status (Authenticated - Admin/Doctor)**

**Request**:
```json
{
  "status": "contacted"
}
```

**Status Values**:
- `new` - Initial submission
- `contacted` - CRM staff contacted patient
- `converted` - Became appointment
- `rejected` - Not interested
- `duplicate` - Duplicate lead

**Response**:
```json
{
  "id": 789,
  "status": "contacted",
  "updated_at": "2024-03-17T11:00:00Z"
}
```

---

## Database Schema

### leads table
```sql
id: BIGINT (PK)
clinic_id: BIGINT (FK → clinics)
doctor_id: BIGINT (FK → doctors)
patient_name: TEXT (required)
phone: TEXT (required, flexible format)
selected_service: TEXT (optional)
note: TEXT (optional, max 500 chars)
source: TEXT (default: 'doctor_public_page')
status: TEXT (default: 'new')
created_at: TIMESTAMP
updated_at: TIMESTAMP (auto-update on modification)
```

### doctors table additions
```sql
is_public: BOOLEAN (default: false)
public_slug: TEXT UNIQUE (auto-generated)
public_bio: TEXT
public_avatar_url: TEXT
public_phone: TEXT
public_telegram: TEXT
public_whatsapp: TEXT
```

---

## Frontend Components

### DoctorPublicProfileView.vue
Main public profile page component.

**Route**: `/d/:slug`
**Props**: None (reads slug from route params)

**Fetches**:
- Doctor by public_slug (via `getDoctorByPublicSlug`)
- Services (via `getDoctorServices`)
- Clinic info (via `getDoctorClinicInfo`)

---

### DoctorLeadForm.vue
Reusable lead submission form.

**Props**:
```javascript
{
  doctorId: Number (required),
  clinicId: Number (required),
  services: Array (optional, for dropdown)
}
```

**Form Fields**:
- Patient Name (required, 2-100 chars)
- Phone (required, must contain digits)
- Service (optional dropdown)
- Additional Info (optional, max 500 chars)

**Events**:
- Emits success/error via `vue-toastification`
- Resets form on successful submit

---

## API Functions

### leadsApi.js

#### `createLead(payload)`
Submit a public lead.

```javascript
import { createLead } from '@/api/leadsApi'

const lead = await createLead({
  doctor_id: 123,
  clinic_id: 456,
  patient_name: 'Ahmed',
  phone: '+998901234567',
  selected_service: 'Cleaning',
  note: 'Sensitive teeth'
})
```

#### `listLeadsByClinic(clinicId)`
Get all leads for a clinic (admin only).

```javascript
import { listLeadsByClinic } from '@/api/leadsApi'

const leads = await listLeadsByClinic(456)
```

#### `listLeadsByDoctor(doctorId)`
Get leads for a specific doctor.

```javascript
import { listLeadsByDoctor } from '@/api/leadsApi'

const leads = await listLeadsByDoctor(123)
```

#### `updateLeadStatus(leadId, status)`
Update lead status.

```javascript
import { updateLeadStatus } from '@/api/leadsApi'

await updateLeadStatus(789, 'contacted')
```

---

### doctorsPublicApi.js

#### `getDoctorByPublicSlug(slug)`
Fetch doctor by public slug (public, no auth).

```javascript
import { getDoctorByPublicSlug } from '@/api/doctorsPublicApi'

const doctor = await getDoctorByPublicSlug('john-doe-abc123')
// Returns: { id, full_name, bio, avatar_url, specialization, clinic_id, ... }
```

#### `getDoctorServices(clinicId)`
Get services for a clinic.

```javascript
import { getDoctorServices } from '@/api/doctorsPublicApi'

const services = await getDoctorServices(456)
// Returns: [{ id, name, price }, ...]
```

#### `getDoctorClinicInfo(clinicId)`
Get clinic details.

```javascript
import { getDoctorClinicInfo } from '@/api/doctorsPublicApi'

const clinic = await getDoctorClinicInfo(456)
// Returns: { id, name, logo_url }
```

---

## Workflow

### Lead Capture Flow
1. Doctor shares `/d/john-doe` link on Instagram, Telegram, etc.
2. Potential patient opens the link
3. Views doctor profile, services, contact options
4. Can call/WhatsApp/Telegram directly OR
5. Fill out lead form and submit
6. Lead saved with `status='new'`
7. CRM staff sees new leads in dashboard
8. Staff calls patient to confirm appointment
9. Once converted, status → 'converted'

---

## Example Usage

### Making a Lead Submission (Client-side)

```javascript
// In DoctorLeadForm.vue
const submitForm = async () => {
  try {
    const lead = await createLead({
      doctor_id: 123,
      clinic_id: 456,
      patient_name: 'Ahmad Karim',
      phone: '+998901234567',
      selected_service: 'Teeth Whitening',
      note: 'Interested in cosmetic dentistry'
    })
    
    console.log('Lead created:', lead)
    toast.success('Request submitted!')
  } catch (error) {
    toast.error('Failed to submit')
  }
}
```

### Admin Viewing Leads (Staff Dashboard)

```javascript
// In a leads management component (future)
import { listLeadsByClinic, updateLeadStatus } from '@/api/leadsApi'

const clinicLeads = await listLeadsByClinic(456)
// Lead count: 42 new leads this week

// Mark as contacted
await updateLeadStatus(789, 'contacted')
```

---

## Validation Rules

### Patient Name
- Required
- 2-100 characters
- Cannot be empty after trimming

### Phone Number
- Required
- Must contain at least one digit
- Flexible format (allows +, -, spaces, parentheses)
- Example formats:
  - +998 90 123 45 67
  - +99890-1234567
  - 901234567 (assumed to be Uzbek/regional)

### Service
- Optional
- Must match existing service name from dropdown
- If provided, stored as service name (not ID) for simplicity

### Note
- Optional
- Maximum 500 characters
- Used to capture custom requirements

---

## Error Handling

### Client-Side
- Form validation before submission
- Visual error messages under each field
- Toast notifications for success/error
- Loading spinner during submission

### Server-Side
- Validation in leadsApi.js
- Meaningful error messages
- Proper HTTP status codes
- Console logging with emoji indicators

---

## Security Notes

### RLS Policies
- Public: Can INSERT leads (anonymous submissions)
- Public: Can READ leads (confirmation)
- Clinic Staff: Can SELECT/UPDATE/DELETE leads for their clinic
- Doctors: Can SELECT leads for their profile

### No Authentication Required
- `/d/:slug` route is public
- `getDoctorByPublicSlug()` has no auth
- `createLead()` allows anonymous submissions
- Spam prevention: rely on phone/email verification during follow-up

### Future Enhancement
- Rate limiting on lead submissions
- Duplicate phone number detection
- Bot protection (CAPTCHA on form)
- Email verification of leads

---

## Deployment Checklist

- [ ] Run SQL migration on Supabase
- [ ] Create `SUPABASE_DOCTOR_PUBLIC_PROFILE_MIGRATION.sql`
- [ ] Backfill existing doctors with `public_slug`
- [ ] API files created: `leadsApi.js`, `doctorsPublicApi.js`
- [ ] Vue components created
- [ ] Router route added: `/d/:slug`
- [ ] Test public profile page with sample doctor
- [ ] Test lead submission
- [ ] Test clinic staff can view leads
- [ ] Test success/error notifications

---

## Next Steps (Post-MVP)

1. **Lead Dashboard**: Create admin view for managing leads
2. **Lead-to-Patient Conversion**: Auto-create patient from lead
3. **Lead-to-Appointment**: Quick create appointment from lead
4. **Email Notifications**: Send leads to clinic staff
5. **Lead Analytics**: Track conversion rates by doctor/service
6. **Appointment Scheduling**: Integrate with smart calendar MVP
7. **SMS Notifications**: Send confirmation to patient via SMS
8. **Lead Reassignment**: Allow admins to assign leads to staff members
9. **Custom Lead Fields**: Allow clinics to customize form fields
10. **Multi-language**: Support Uzbek/Russian/English leads

---

## Support & Questions

For issues or questions:
1. Check the API functions in `leadsApi.js` and `doctorsPublicApi.js`
2. Review the component code in `DoctorPublicProfileView.vue` and `DoctorLeadForm.vue`
3. Check Supabase logs for backend errors
4. Browser console for frontend errors
