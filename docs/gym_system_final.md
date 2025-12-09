# SMART GYM MANAGEMENT SYSTEM (SaaS)
## Updated Functional Document + Workflows
### Multi-Branch + Biometric Integration

---

## 1. SYSTEM OVERVIEW

The **Smart Gym Management System** is a **cloud-based multi-tenant SaaS** platform for managing chains of gyms with multiple branches. It centralizes:

- Multi-branch operations
- Biometric-based attendance (fingerprint; extensible to face/RFID)
- QR-based backup access
- Membership plans, payments, renewals
- Expenses and profit tracking
- Class / trainer management
- Member self-service portal
- Basic marketing & notifications (WhatsApp/SMS/Email)

The system has **three main user layers**:

- **Super Admin** (SaaS Owner)
- **Branch Admin & Staff** (Per-location management)
- **Members** (Self-service)

And one **device layer**:

- **Fingerprint / Access Control Devices** (ZKTeco, eSSL, Identix, etc.)

---

## 2. MODULE STRUCTURE

### 2.1 Super Admin Module (SaaS Owner)

Controls the entire SaaS network and all branches.

#### Core Responsibilities

- SaaS configuration and pricing
- Branch lifecycle management
- Global analytics and revenue
- Device fleet oversight
- Communication credits and limits
- Compliance and audit visibility

#### Features

##### 1. **Branch Management**

- Add / edit / deactivate branches
- Assign / change branch admins
- Configure branch subscription plan (Starter / Growth / Enterprise)
- Set per-branch feature toggles (e.g., classes, loyalty, referral)
- View branch contact & location details
- Monitor branch subscription status and payment history

##### 2. **Global Dashboard**

- Total branches (active / inactive)
- Total members (active / expired / suspended)
- Global revenue (daily / monthly / yearly)
- Global attendance heatmap (by day/time)
- Branch performance ranking (by revenue / active members / attendance)
- Top performing trainers (optional)
- Overall churn rate and retention metrics

##### 3. **Device Monitoring**

- List of all devices (by branch, type, serial)
- Online / Offline status
- Last sync time, last error
- Device capacity usage (enrolled users, log size)
- Firmware version monitoring
- Device health diagnostics
- Bulk device configuration updates

##### 4. **Billing & SaaS Subscription**

- Define SaaS pricing plans for branches
- Auto-invoice branches (monthly / yearly)
- View collections per branch
- Payment gateway integration (Razorpay/Stripe)
- Suspend branch access on non-payment
- Refund management (if applicable)
- View outstanding payments and aged receivables

##### 5. **Communication Control**

- Assign WhatsApp / SMS credits per branch
- Set per-branch daily/weekly sending limits
- Monitor usage per channel (WhatsApp/SMS/Email)
- View failed delivery stats
- Manage communication templates globally
- Bulk campaign sending (optional)

##### 6. **Security & Access**

- Role-based access control (RBAC) for internal staff
- View audit logs (who changed what & when)
- Lock/Unlock branch access (for fraud / abuse)
- Configure password / MFA policies
- Manage API keys and integrations
- View failed login attempts and security alerts

##### 7. **Reports (Global)**

- Branch-wise profit & loss
- Branch-wise attendance trends
- Global churn and renewal rates
- Top performing branches / trainers
- Device utilization reports
- Data export (CSV/Excel)
- Scheduled report generation and email delivery

---

### 2.2 Branch Admin Module

Used by admins and staff at each gym branch.

**Scope:** Branch-level only (data isolation per branch).

#### Features

##### 1. **Branch Dashboard**

- Today's check-ins / live member count
- Active vs Expired members
- Today's collections (membership + class fees)
- Today's expenses
- Today's profit estimate
- Quick stats: New members this month, renewal rate, churn rate

##### 2. **Member Management**

- Add / edit / deactivate member
- Capture photo and ID docs
- Assign membership plan (duration, price)
- View member status (Active / Expired / Suspended)
- View full attendance history
- View payment history and invoices
- Bulk import of members (CSV)
- Member search and filtering
- Member communication history

##### 3. **Biometric & Device Management**

- Configure device (serial, IP, port, type)
- View device status (online/offline)
- Enroll fingerprints (trigger device action)
- Re-enroll / update fingerprints
- View device command queue (pending / success / failed)
- Force sync attendance from device
- Device health diagnostics
- Manual device command override (for troubleshooting)

##### 4. **Attendance Management**

- Live list of members currently inside
- Manual check-in (QR / member search) for backup
- Corrections (admin can adjust in/out times with audit logs)
- No-show and late arrival tracking
- Daily/Monthly attendance reports
- Export attendance
- Attendance anomaly detection (e.g., multiple entries in same day)
- Peak hours analysis

##### 5. **Payments & Renewals**

- Register payments (cash / UPI / card)
- Integration with payment gateway for online payments
- Create / print receipts and invoices
- Manage refunds (if needed)
- Membership upgrade / downgrade
- View pending renewals list
- Renewal from expired state (auto re-enable device access)
- Dunning management (failed payment retry)
- Payment reconciliation

##### 6. **Expense Management**

- Add branch expenses (Rent, Electricity, Salaries, Maintenance)
- Categorize expenses
- Recurring expenses (monthly rent, etc.)
- Expense reports by category / date
- Profit = Collections – Expenses (daily, monthly, custom period)
- Budget vs actual analysis (optional)
- Expense approval workflow (optional)

##### 7. **Class & Trainer Management**

- Create/edit classes:
  - Class name
  - Day/time
  - Trainer
  - Capacity
  - Branch room/area
- Assign trainers to classes
- View booking list per class
- Mark attendance per class (auto from gate, optional)
- Trainer payout reports (optional extension)
- Class cancellation and rescheduling
- Trainer commission tracking

##### 8. **Communication (Basic CRM)**

- Send WhatsApp / SMS to a single member or filtered segment
- Predefined templates:
  - Welcome
  - Expiry alerts
  - Expired alerts
  - Renewal confirmation
  - Class reminder
- Announcement broadcast (to all active members)
- View message delivery status
- SMS/WhatsApp credit usage tracking

##### 9. **Branch Settings**

- Branch working hours
- Grace period rules (e.g., allow entry 1 day after expiry?)
- Default membership plans and pricing
- Notification preferences
- Staff logins & roles (branch staff with limited permissions)
- Tax settings (GST, if applicable)
- Currency and localization settings

##### 10. **Reports (Branch-level)**

- Revenue report (daily/monthly/custom)
- Attendance report with analytics
- Member acquisition and churn
- Class utilization
- Trainer performance
- Expense breakdown

---

### 2.3 Member Portal (Web / Mobile)

Self-service area for members.

#### Features

##### 1. **Dashboard**

- Current membership status (Active / Expired)
- Plan name, start date, expiry date
- Days remaining
- Last visit time
- Progress metrics (visits this month, personal best)

##### 2. **QR Code Access**

- Unique QR code for backup entry
- Used by admin staff to mark attendance if fingerprint fails
- QR code refresh capability (security feature)

##### 3. **Attendance & Activity**

- Calendar view of visits
- Total visits this month
- Streaks (e.g., consecutive days/weeks)
- Comparison with previous month
- Activity badges and achievements (optional gamification)

##### 4. **Class Booking**

- View upcoming classes (filter by date/trainer/type)
- Book / cancel class (respect capacity)
- See booking status
- See class history
- Trainer ratings and reviews (optional)
- Add to calendar (Google/Outlook integration)

##### 5. **Payments & Plans**

- View current plan details
- View payment history and invoices
- Start renewal flow (redirect to payment gateway)
- See available upgrade offers (optional)
- Download invoice (PDF)
- Payment method management

##### 6. **Notifications & Announcements**

- View recent gym announcements
- View reminders & messages sent (expiry, renewal, class reminders)
- Notification preferences (opt-in/out by channel)
- Unread notification badge

##### 7. **Profile**

- Update basic details (phone, email, address)
- Change password
- Manage communication preferences (WhatsApp/SMS/Email)
- Emergency contact info
- Goals and preferences (body metrics, fitness goals)

##### 8. **Support & Help**

- FAQs and knowledge base
- In-app chat or support request submission
- Contact gym directly
- Report issues

---

### 2.4 Fingerprint Device Integration Layer

Per-branch biometric / access device integration.

#### Supported Devices (Examples)

- ZKTeco (U-Series, G-Series)
- eSSL (uAttendance)
- Identix (iAccess)
- Generic RFID/Card readers (optional)

#### Core Functions

##### 1. **Fingerprint Enrollment**

- Triggered from Branch Admin panel:
  - System sends `ENROLL_USER` command to device queue
  - Device prompts scan
  - Template generated on device and/or sent to cloud
- Cloud stores mapping: Member ↔ Device templates
- Support for dual-finger enrollment (left + right thumb)
- Quality checks and re-enrollment if necessary

##### 2. **Auto Attendance Sync**

- Device pushes logs to Cloud via secure webhook
- Each log contains: 
  - Member identifier
  - Timestamp
  - Device ID
  - Event type (check-in/check-out)
  - Temperature (optional)
  - Face mask status (optional)
- Cloud:
  - Validates device
  - Matches member
  - Verifies membership status
  - Records attendance
  - Prevents duplicates (within 5-second window)
  - Updates real-time dashboard

##### 3. **Auto Block / Unblock**

- When membership expires:
  - Cloud queues `DISABLE_USER` to device
  - Device prevents access at next scan
- When renewed:
  - Cloud queues `ENABLE_USER`/`ENROLL_USER` as needed
  - Member immediately regains access

##### 4. **Device Health Check**

- Regular pings from device to cloud (e.g., every 5 minutes)
- Cloud returns:
  - Pending commands
  - Time sync data
  - Configuration updates
- Admin can see health status in dashboard:
  - Online / Offline
  - Last sync time
  - Database capacity (%) 
  - Errors or warnings

##### 5. **Offline Mode**

- Device can operate locally when cloud is unreachable
- Attendance logs queued locally (24-48 hour buffer)
- Command queue can be stored locally
- Auto-sync on reconnection

#### Command Queue (Cloud → Device)

Standard commands:

- `ENROLL_USER`: Add new fingerprint(s) + metadata
- `DISABLE_USER`: Mark member as blocked (no access)
- `DELETE_USER`: Remove member from device
- `UPDATE_USER`: Modify member record on device
- (Optional: `ENABLE_USER`, `SYNC_TIME`, `SYNC_LOGS`, `HEALTH_CHECK`)

Each command:

- Has unique ID
- Is assigned a priority (high / normal / low)
- Is retried if failed (with backoff)
- Has status tracking (pending / sent / success / failed)

---

## 3. MULTI-BRANCH SYSTEM STRUCTURE

Each **branch** is logically isolated with its own:

- Members
- Devices
- Attendance logs
- Classes
- Trainers
- Expenses
- Branch dashboard
- Branch configuration

**Super Admin** has:

- Global view across all branches
- Aggregated analytics
- Billing and subscription management

**Branch Admin**:

- Only sees and manages data for their own branch
- Cannot view other branches

### Data Isolation (Conceptual)

- All records store a **Branch ID** (and optionally **Tenant ID** for multi-SaaS scenarios)
- All queries for branch admins are always filtered by `WHERE branch_id = current_user.branch_id`
- Super Admin queries are unfiltered (or grouped by branch)
- Database-level isolation (row-level security) for additional safety

---

## 4. CORE WORKFLOWS (UPDATED & DETAILED)

### 4.1 Workflow: Branch Creation (Super Admin)

1. Super Admin opens **"Add Branch"** in SaaS panel.

2. Enters:
   - Branch name
   - City / Address
   - Branch contact details
   - Branch admin name, email, phone
   - Subscription plan (e.g., Starter / Growth / Enterprise)

3. System generates:
   - Unique Branch ID
   - Branch Admin login credentials (email + temporary password)

4. System:
   - Sends welcome email/WhatsApp to Branch Admin with login details
   - Creates default:
     - Membership plans (Basic, Standard, Premium)
     - Notification templates
     - Expense categories
     - Sample classes/trainers (optional)

5. Branch Admin logs in and:
   - Completes branch profile & settings
   - Adds first device
   - Starts member onboarding

---

### 4.2 Workflow: Device Setup (Per Branch)

1. Branch Admin navigates to **Device Settings**.

2. Clicks **"Add Device"**.

3. Enters:
   - Device serial number
   - Device IP / Port / Protocol
   - Device type (ZKTeco / eSSL / Identix)
   - Device name (e.g., "Main Gate", "Back Entrance")

4. System:
   - Validates serial (format / uniqueness per branch)
   - Registers device with Branch ID
   - Generates Device API key / token
   - Creates device record in database

5. Device (via local integration app or direct HTTP):
   - Calls cloud API: `POST /api/devices/init`
   - Passes: device serial, IP, branch ID, API key

6. Cloud validates and responds with:
   - Initialization status (success / failure)
   - Command queue (empty initially)
   - Sync interval (e.g., 300 seconds)

7. If verified:
   - Status: Online
   - Shown in branch dashboard
   - Branch can now:
     - Enroll members
     - Receive attendance logs
     - Manage device

---

### 4.3 Workflow: Member Onboarding

1. Branch Admin opens **Add Member**.

2. Enters personal details:
   - Name, phone, email, gender, DOB, address
   - Emergency contact (optional)

3. Uploads:
   - Member photo
   - ID proof (optional)

4. Selects **Membership Plan**:
   - Plan name (e.g., Monthly / Quarterly / Yearly)
   - Price
   - Start date (default: today)
   - Duration (e.g., 30/90/365 days)

5. Member pays:
   - **Option A**: Cash payment → Admin records in system
   - **Option B**: Online via payment gateway → System auto-confirms
   - Receipt generated and printed/emailed

6. System (on payment success):
   - Creates member record with status = **Active**
   - Calculates expiry date (start date + duration)
   - Generates:
     - Unique Member ID
     - Unique QR code
   - Sends Welcome message (WhatsApp/SMS/Email) with:
     - Membership plan details
     - Expiry date
     - Portal link and login credentials (if applicable)

7. Branch Admin clicks **"Enroll Fingerprint"**:
   - Selects device
   - System queues `ENROLL_USER` command to device
   - Device prompts member to scan finger(s) (typically 2 fingers for redundancy)
   - On success:
     - Finger template stored on device locally
     - Synced to cloud (depending on device capability)
     - Member record updated: `fingerprint_enrolled = true`

8. Member becomes **Active & Ready** for gym entry via fingerprint.

---

### 4.4 Workflow: Gym Entry (Primary – Fingerprint)

1. Member approaches the device at gym entrance.

2. Member touches fingerprint scanner at branch device.

3. Device processing (on-device or cloud-assisted):
   - Matches fingerprint against enrolled templates
   - Resolves associated Member ID / Code

4. Device checks status (via local cache or last synced data):
   - **If member is Active:**
     - Door unlocks / turnstile opens (if connected)
     - Success beep/message
     - Device creates attendance log
   - **If Expired / Disabled:**
     - Door remains locked
     - Error beep/message
     - No attendance logged (optional: log rejection attempt)

5. Device creates attendance log:
   - Member ID
   - Timestamp (accurate)
   - Device ID
   - Event type (check-in)
   - Temperature (optional, if thermal sensor available)
   - Face photo (optional, if camera available)
   - Quality score (fingerprint match confidence %)

6. Device sends log(s) to Cloud (real-time via webhook or batched):
   - Cloud API endpoint: `POST /api/attendance/webhook`
   - Request includes: device ID, attendance records array
   - Cloud validates + stores in database
   - Updates:
     - Member's attendance history
     - Live member count for branch dashboard
     - Real-time analytics cache

---

### 4.5 Workflow: Gym Entry (Backup – QR)

Used when:

- Fingerprint fails
- Device is offline
- Member not yet enrolled on device but membership is active
- Member prefers contactless entry

Steps:

1. Member opens **Member Portal** and displays **QR code** on phone screen.

2. Front-desk Admin:
   - Opens **Manual Check-in** screen on branch admin app
   - Scans QR code using device camera OR enters Member ID manually

3. System:
   - Validates membership status (Active / Expired / Suspended)
   - **If Active:**
     - Records attendance with:
       - Entry type = `qr_backup`
       - Admin ID = who marked it
       - Timestamp = current
     - Displays: "Check-in successful"
   - **If Expired:**
     - Shows "Membership expired" warning
     - Optionally displays renewal options
     - No attendance logged

4. Useful for:
   - Edge cases when fingerprint fails
   - Customer satisfaction
   - Backup access method

---

### 4.6 Workflow: Membership Expiry & Auto-Block

1. **Scheduled Job** runs periodically (e.g., every hour or daily at 2 AM):
   - Scans all members with status = **Active**
   - Checks: `expiry_date <= current_time`

2. For each expiring member:
   - System updates member status → **Expired**
   - Queues command to all associated devices at that branch:
     - `DISABLE_USER` (with member ID and reason = "membership_expired")
   - Sends **Expiry Alert** via:
     - WhatsApp or SMS: "Your plan has expired…"
     - Email (optional)

3. Optional features:
   - **Grace period** configuration: Allow 2–3 days access after expiry despite disabled flag
   - **Win-back campaigns**: Send discount offers X days after expiry to reactivate member

4. Device-side:
   - On next device sync, device receives `DISABLE_USER` command
   - Device updates local user database to mark member as blocked
   - Next fingerprint scan by that member → rejected

---

### 4.7 Workflow: Member Renewal

1. Member initiates renewal:
   - **Option A**: Contacts branch → Admin initiates
   - **Option B**: Self-service via Member Portal (if payment gateway integrated)

2. Branch Admin:
   - Opens member profile
   - Clicks **Renew Membership**:
     - Chooses plan (same or different)
     - Confirms amount & duration
     - Applies discount (if available)

3. Member pays:
   - **Option A**: Cash → Admin records payment
   - **Option B**: Online via portal / link → System auto-confirms

4. On payment success:
   - System:
     - Updates member status → **Active**
     - Extends expiry date (from current expiry or from today, as per branch policy)
     - Increments renewal count
   - Enqueues device command:
     - `ENROLL_USER` (if templates missing) or `ENABLE_USER` (if already enrolled)
   - Sends **Renewal Confirmation** message:
     - "Your membership renewed until {new_date}. Welcome back!"

5. Member immediately regains access:
   - Next fingerprint scan → accepted
   - Can enter gym without restriction

---

### 4.8 Workflow: Class / Trainer Session Booking

1. Branch Admin (or trainer):
   - Creates class:
     - Name (e.g., Zumba, CrossFit, Yoga, HIIT)
     - Schedule: Day of week + Time
     - Trainer assigned
     - Seat limit (e.g., 20 members max)
     - Branch location/room (e.g., Studio A, Gym Floor)

2. Members discover classes:
   - Via **Member Portal** → Class Discovery section
   - See list with:
     - Date / time
     - Trainer
     - Seats remaining
     - Class description
   - Filter by trainer, time, type

3. Member clicks **Book**:
   - System checks seat availability
   - **If space available:**
     - Books member into class
     - Decrements remaining seats
     - Sends booking confirmation & reminder (24h before)
   - **If full:**
     - Shows "Class full" and offers waitlist option

4. Trainer view:
   - Dashboard shows:
     - List of members booked per session
     - Attendance status per class
   - Can mark no-shows or confirm attendance

5. Automated features (optional):
   - Auto mark attendance from gym gate attendance around class time
   - Trainer commission calculation based on class attendance

---

### 4.9 Workflow: Expenses & Profit

1. Branch Admin records expenses:
   - Navigates to **Expenses**
   - Clicks **Add Expense**:
     - Category (Rent / Electricity / Trainer Salaries / Maintenance / Supplies / Other)
     - Amount
     - Date
     - Notes / Description
     - Recurring? (Yes/No, and if yes: frequency)

2. System aggregates:
   - **Collections**:
     - Membership fees
     - Class fees
     - Personal training fees
     - Merchandise/supplement sales (optional)
   - **Expenses**:
     - As listed above

3. Profit calculations:
   - For a given period (day / week / month / custom range):
     - `Profit = Total Collections – Total Expenses`

4. Dashboards:
   - **Daily profit** (trend line for last 30 days)
   - **Monthly profit** (comparison with previous months)
   - **Global profit** (Super Admin view across all branches)

5. Reports:
   - Expense breakdown by category
   - Profit margin analysis
   - Budget vs. actual (if budgets set)

---

## 5. COMMUNICATION WORKFLOW (WHATSAPP/SMS/EMAIL)

Notifications are triggered by specific events.

### 5.1 Welcome Message

- **Trigger**: After successful member registration & payment
- **Channels**: WhatsApp / SMS / Email
- **Content**:
  - Greeting + member name
  - Membership plan details (name, duration, price)
  - Expiry date
  - Portal login link + credentials
  - Branch contact info & hours
  - Quick-start tips

### 5.2 Expiry Reminder (3 Days Before)

- **Trigger**: 3 days before expiry date (configurable)
- **Channels**: WhatsApp / SMS
- **Message**: "Your plan expires on {date}. Renew now to avoid interruption."

### 5.3 Day-of-Expiry Alert

- **Trigger**: On expiry date (at 12:01 AM or start of business day)
- **Channels**: WhatsApp / SMS
- **Message**: "Your gym membership has expired today. Renew immediately to continue access."

### 5.4 Post-Expiry Win-Back (Optional)

- **Trigger**: X days after expiry (e.g., 3 or 7 days)
- **Channels**: WhatsApp / SMS / Email
- **Message**: Special offer or discount to encourage renewal
  - "We miss you! Renew with 20% discount this week."

### 5.5 Renewal Confirmation

- **Trigger**: Successful renewal payment
- **Channels**: WhatsApp / SMS / Email
- **Message**: "Your plan is renewed until {new_expiry_date}. Welcome back!"

### 5.6 Class Booking Confirmation

- **Trigger**: Member books a class
- **Channels**: WhatsApp / SMS / Email
- **Message**: "You are booked for {class_name} with {trainer_name} at {time} on {date}."

### 5.7 Class Reminder

- **Trigger**: 24 hours before class start time
- **Channels**: WhatsApp / SMS
- **Message**: "Reminder: Your {class_name} class starts tomorrow at {time}. See you there!"

### 5.8 Announcement / Bulk Message

- **Trigger**: Branch admin sends announcement (manually)
- **Channels**: WhatsApp / SMS / Email
- **Audience**: All active members or filtered segment
- **Message**: Custom content

---

## 6. SYSTEM ARCHITECTURE (SIMPLE VIEW)

### 6.1 Logical Architecture

**Presentation Layer**
- Super Admin Web Panel
- Branch Admin Web Panel
- Member Portal (Web)
- Member Mobile App (iOS/Android)

**API Layer**
- REST API endpoints (authentication, members, attendance, devices, payments, etc.)
- Webhook receiver (for device callbacks)
- Payment gateway webhooks

**Business Logic Layer**
- Member management
- Device command queue
- Attendance processing
- Expiry checking (scheduled jobs)
- Notification engine
- Reporting & analytics

**Data Layer**
- Primary database (members, attendance, devices, transactions, etc.)
- Cache (Redis for real-time dashboards)
- File storage (photos, IDs, invoices)

**Integration Layer**
- Device API integrations (ZKTeco, eSSL, Identix)
- Payment gateway (Razorpay, Stripe)
- SMS service (Twilio)
- Email service (SendGrid)
- WhatsApp Business API

### 6.2 Multi-Branch Layout

```
┌─────────────────────────────────────────────────────────┐
│                   Super Admin Panel                      │
│  (Global reports, branch mgmt, device monitoring, etc)   │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Branch A   │ │  Branch B   │ │  Branch C   │
    ├─────────────┤ ├─────────────┤ ├─────────────┤
    │ Admin Panel │ │ Admin Panel │ │ Admin Panel │
    │ Device A1   │ │ Device B1   │ │ Device C1   │
    │ Device A2   │ │ Device B2   │ │ Device C2   │
    │ Members A   │ │ Members B   │ │ Members C   │
    │ Classes A   │ │ Classes B   │ │ Classes C   │
    │ Expenses A  │ │ Expenses B  │ │ Expenses C  │
    └─────────────┘ └─────────────┘ └─────────────┘
            │               │               │
            │               │               │
    ┌───────▼───────────────▼───────────────▼────────┐
    │           Central Cloud Database                │
    │  (Members, Attendance, Devices, Payments, etc)  │
    └───────────────────────────────────────────────┘
            │               │
      ┌─────▼──────┐  ┌─────▼──────┐
      │  Member    │  │   Member   │
      │  Portal    │  │   Mobile   │
      │  (Web)     │  │   App      │
      └────────────┘  └────────────┘
```

### 6.3 Data Flow Overview

```
Device (Fingerprint Scan)
        ↓
     (Webhook)
        ↓
Cloud API (Attendance Receiver)
        ↓
    (Validate, Process)
        ↓
     Database
        ↓
  ┌─────┴─────┐
  ↓           ↓
Cache      Reports
(Real-time) (Analytics)
  ↓           ↓
Dashboards  Insights
```

---

## 7. SECURITY FEATURES (PRACTICAL LEVEL)

### 7.1 Multi-Tenant & Multi-Branch Isolation

- Every database record tagged with `branch_id`
- All Branch Admin queries filtered by `WHERE branch_id = current_user.branch_id`
- Database-level row-level security (RLS) if using PostgreSQL
- Separate API scope per branch user

### 7.2 Encrypted Data

- All traffic over **HTTPS (TLS 1.3)**
- Sensitive fields encrypted at rest:
  - Passwords (bcrypt hashing)
  - API tokens
  - Fingerprint templates
  - Biometric data
- Database encryption (AES-256 at rest)

### 7.3 Device Validation

- Device serial + API key authentication
- Only registered devices (per branch) can:
  - Send attendance logs
  - Receive commands
- Webhook signature verification (HMAC-SHA256)
- Device IP whitelisting (optional)

### 7.4 Role-Based Access Control (RBAC)

- Roles:
  - **Super Admin**: Full access
  - **Branch Admin**: Own branch only
  - **Branch Staff**: Limited (check-in, member search, manual attendance)
  - **Member**: Self-service portal only
- Per-role permissions: view / create / edit / delete / export

### 7.5 Audit Logging

- Log key actions:
  - User logins (success/failure)
  - Member creation / updates / deletions
  - Membership status changes
  - Payment transactions
  - Manual attendance entries
  - Device commands sent
  - Admin configuration changes
- Immutable audit trail (cannot be edited after creation)

### 7.6 API Rate Limiting

- Prevent abuse (DoS attacks, brute force)
- Different limits per endpoint:
  - Super Admin APIs: 100 req/min
  - Branch Admin APIs: 50 req/min
  - Device APIs: 10,000 req/min (for bulk data)
  - Member APIs: 20 req/min

### 7.7 Compliance & Privacy

- GDPR compliance:
  - Right to be forgotten (member deletion)
  - Data export capability
  - Consent tracking
- Data retention policies (configurable per branch)
- Automatic data deletion after retention period
- Privacy policy and Terms of Service

---

## 8. DELIVERABLES (FINAL SCOPE)

### 8.1 Admin Panel (Web - React/Vue/Angular)

#### Super Admin Dashboard

- Branch management
  - Add / edit / deactivate branches
  - View subscription status & payment history
- Global revenue & attendance dashboards
  - KPIs: Total revenue, total members, churn rate, etc.
- Device overview
  - List of all devices with status
  - Device health & diagnostics
- Communication credits control
  - Assign credits per branch
  - Monitor usage
- Global reports
  - Branch-wise profit & loss
  - Attendance trends
  - Member acquisition & churn
  - Data export

#### Branch Admin Dashboard

- Member management
  - CRUD operations
  - Bulk import
  - Search / filter
- Fingerprint enrollment management
  - Enroll members on device
  - View enrollment status
  - Re-enroll if needed
- Attendance dashboard
  - Live member count
  - Today's attendance
  - Manual check-in option (QR / search)
  - Historical reports
- Payments & renewals
  - Record payments
  - View payment history
  - Manage renewals
  - Print receipts/invoices
- Expenses & profit
  - Add expenses
  - View profit for period
  - Expense breakdown
  - Budget vs. actual
- Class & trainer management
  - Create/edit classes
  - Assign trainers
  - View class bookings
  - Trainer commission tracking
- Communication tools
  - Send messages (WhatsApp/SMS/Email)
  - View sent history
  - Use predefined templates
- Branch reports
  - Revenue, attendance, member analytics
  - Export data

### 8.2 Member Portal (Web + Mobile App)

#### Web Portal (React)

- Login
  - Phone/email + password
  - OTP verification option
- Dashboard
  - Membership status
  - Days remaining
  - Last visit info
- QR code display
  - For backup entry
- Attendance history
  - Calendar view
  - Streaks & stats
- Class discovery & booking
  - Browse upcoming classes
  - Filter by trainer/time/type
  - Book/cancel
- Payments & plans
  - Current plan details
  - Payment history
  - Invoice download
  - Renewal option
- Announcements & messages
  - View gym announcements
  - View reminders
- Profile management
  - Update details
  - Change password
  - Communication preferences

#### Mobile App (React Native / Flutter)

- All web features above, optimized for mobile
- Push notifications
- QR code scanner (to check in others, if branch allows)
- Offline mode (view membership details even without internet)

### 8.3 Device Integration Layer

- Integration services for:
  - Device registration & initialization
  - Fingerprint enrollment commands
  - Member disable/delete commands
  - Attendance webhook receiver
  - Device health check & status
- Scheduled jobs:
  - Auto-expiry checker (hourly or daily)
  - Device sync coordinator
  - Notification sender (expiry alerts, reminders, etc.)
- Command queue management:
  - Queue creation, retry logic, status tracking

### 8.4 Reporting & Analytics

#### Branch-Level Reports

- Revenue (daily, monthly, yearly)
- Expenses by category
- Profit & loss
- Attendance by day/time
- Member acquisition & churn
- Class utilization
- Trainer performance

#### Super Admin Reports

- Branch-wise comparison
- Global KPIs
- Top performers
- Churn analysis

#### Export Formats

- CSV (for Excel)
- PDF (for printing/sharing)
- JSON (for integrations)

---

## 9. IMPROVEMENTS VS ORIGINAL (SHORT)

Compared to your original draft, this updated document:

✅ **Clarifies module boundaries** and responsibilities for each user role.

✅ **Expands Super Admin scope** to include SaaS billing, global controls, and device fleet management.

✅ **Makes Branch Admin module** more realistic with comprehensive features (expenses, classes, trainers, communication).

✅ **Defines complete Member Portal** with self-service capabilities.

✅ **Details device integration** using a command queue and secure webhooks.

✅ **Provides detailed workflows** (step-by-step processes) that are implementable.

✅ **Keeps everything practical** so you can directly convert this into:
- Database schemas (tables/collections + fields)
- API specifications (endpoints, request/response payloads)
- UI screen mockups (for design/development)

---

## 10. NEXT STEPS FOR DEVELOPMENT

### Phase 1: Design & Planning

1. **Database Schema Design**
   - Define tables/collections for:
     - Tenants/Branches, Members, Attendance, Devices, Classes, Trainers, Expenses, Payments, etc.
   - Define relationships and indexes
   - Plan multi-tenancy isolation at DB level

2. **API Specification**
   - List all endpoints (at least 50+)
   - Define request/response payloads
   - Error handling & status codes
   - Authentication & authorization per endpoint

3. **UI/UX Design**
   - Wireframes/mockups for:
     - Super Admin panel
     - Branch Admin panel
     - Member portal
   - Mobile app screens
   - Component library

### Phase 2: Backend Development

1. Choose tech stack (Node.js/Express, Python/Django, etc.)
2. Implement API endpoints
3. Implement authentication & RBAC
4. Implement device integration (webhooks, command queue)
5. Implement scheduled jobs (expiry checker, etc.)
6. Add database migrations & seeding

### Phase 3: Frontend Development

1. Build Super Admin panel
2. Build Branch Admin panel
3. Build Member portal (web)
4. Build Member app (mobile)

### Phase 4: Integration & Testing

1. Device integration testing
2. Payment gateway testing
3. E2E testing
4. Load testing
5. Security testing
6. UAT with real gym branches

### Phase 5: Deployment & Launch

1. Infrastructure setup (cloud hosting, DB, cache, CDN)
2. CI/CD pipeline
3. Monitoring & alerting
4. Launch beta / GA

---

## 11. ESTIMATED SCOPE & EFFORT

### MVP (3 Months)

**In Scope:**
- Super Admin basic features (branch mgmt, global dashboard)
- Branch Admin core features (members, device, attendance, payments)
- Member portal basic (dashboard, QR, attendance, bookings)
- Device integration (enrollment, attendance sync, auto-expiry)
- Basic notifications (WhatsApp alerts)
- Core reports (revenue, attendance)

**Out of Scope (Phase 2+):**
- Advanced analytics (churn prediction)
- Trainer commissions
- Family packages
- Referral program
- Advanced integrations (Tally, Zapier, etc.)

### Effort Estimate

- **Backend**: 6-8 weeks (3-4 developers)
- **Frontend**: 5-7 weeks (2-3 developers)
- **DevOps/Infrastructure**: 2-3 weeks (1 person)
- **QA/Testing**: 4-6 weeks (2 people, ongoing)
- **Total**: 16-24 weeks / 4-6 months (with 5-6 person team)

---

## 12. CONCLUSION

This updated document provides a **production-ready functional specification** for a **multi-branch gym SaaS**. It includes:

✅ Complete module breakdowns with features
✅ Detailed workflows for all core scenarios
✅ Device integration architecture
✅ Security & multi-tenancy considerations
✅ Reporting & analytics framework
✅ Delivery roadmap

The next step is to **convert this into technical specifications** (database schema, API endpoints, UI mockups) and start development.

Good luck! 🚀

---

*Last Updated: December 8, 2025*
*Version: 3.0 - Production Ready*