# 👨‍💼 Admin Panel Complete Guide

## 🔑 Admin Credentials

```
Email: admin@zayafly.com
Password: admin123
```

**This is the ONLY email that can access the admin panel.**

---

## 🚀 Admin Login

1. Go to: `http://localhost:5173/admin/login`
2. Enter credentials above
3. Click "SECURE SIGN IN"
4. You'll be redirected to `/admin/dashboard`

---

## 📊 Admin Dashboard (`/admin/dashboard`)

### What You See:

#### Top 4 KPI Cards:
1. **Total Revenue** - Sum of all booking amounts
2. **Active Agents** - Count of KYC-verified agents
3. **Pending KYC** - Count of agents waiting for approval
4. **Weekly Bookings** - Total bookings this week

#### Recent Registrations Table:
Shows the 5 most recently registered agents with:
- Agency name and ID
- KYC status (Approved / Pending)
- Action buttons:
  - **Approve** button (for pending agents)
  - "Already Approved" text (for approved agents)

#### Critical Alerts Section:
- Shows pending KYC count with alert message
- System load status

---

## 👥 Agent Manager (`/admin/agents`)

### Purpose:
View and manage all registered agents with full control.

### Features:
1. **Search Bar** - Search agents by:
   - Agency name
   - Email address

2. **Status Filter Dropdown** - Filter by:
   - All Status
   - Approved
   - Pending

3. **Agent Table Columns:**
   - Agency & Location (with initials avatar)
   - Contact info (email)
   - KYC Status (Green checkmark if approved, Orange if pending)
   - Wallet Balance (in ₹)
   - Actions (Settings, Delete icons)

4. **KYC Approval Button:**
   - Shows for pending agents
   - Single click to approve
   - Status updates immediately

---

## 📦 Booking Manager (`/admin/bookings`)

### Purpose:
View all bookings made by all agents across the platform.

### What You Can See:
- Agent name
- Service type (Flight, Hotel, Bus, Train)
- Booking reference number
- Amount
- Booking date
- Status (Confirmed, Pending, Cancelled)

---

## 💰 Commission Setup (`/admin/commissions`)

### Purpose:
Set and manage commission rates for different services.

### What You Can Configure:
1. **Domestic Flights** - Base & Agent commission %
2. **International Flights** - Base & Agent commission %
3. **Hotels** - Base & Agent commission %
4. **Buses** - Base & Agent commission %
5. **Trains** - Base & Agent commission %

### How It Works:
- Base Commission: What Zayafly gets from suppliers
- Agent Share: What agents earn per booking
- Platform Margin: Difference (Zayafly profit)

Example:
```
Flight Booking: ₹5000
Base Commission: 5% = ₹250
Agent Share: 3% = ₹150
Platform Margin: 2% = ₹100
```

---

## 📈 Reports & Analytics (`/admin/reports`)

### Purpose:
View detailed analytics and reports on platform performance.

### Available Reports:
- Revenue trends
- Agent performance
- Booking distribution
- Daily/Weekly/Monthly stats
- Top agents
- Popular routes

---

## 🎁 Offer Manager (`/admin/offers`)

### Purpose:
Create and manage promotional offers.

### Features:
- Create new offers
- Set discount percentages
- Set validity period
- Apply to specific services
- Manage active offers
- Deactivate expired offers

---

## 🎉 Promotion Manager (`/admin/promotions`)

### Purpose:
Create and track promotional campaigns.

### Features:
- Launch new promotions
- Set campaign budget
- Track performance
- Email/SMS campaigns
- Track agent participation
- ROI analysis

---

## 🧑‍💼 Sub-Agent Manager (`/admin/sub-agents`)

### Purpose:
Manage agents who create their own sub-agents.

### Features:
- View agent hierarchy
- Manage commission sharing
- Control sub-agent limits
- Set performance thresholds
- Monitor sub-agent activities

---

## 🧾 Tax Configuration (`/admin/tax-config`)

### Purpose:
Configure tax settings for different states/regions.

### Features:
- Set GST rates by state
- Configure TDS rules
- Set tax categories
- Manage tax exemptions
- View tax reports

---

## ⚙️ Global Settings (`/admin/settings`)

### Purpose:
Configure system-wide settings.

### Features:
- Platform name & branding
- Email templates
- Payment gateway settings
- API keys
- System alerts
- Maintenance mode toggle
- Audit logs

---

## 🔄 Admin Workflow: KYC Approval

### Step-by-Step Process:

#### 1️⃣ New Agent Registers
- Agent goes to `/register` (frontend)
- Fills form with details
- Clicks "Register"
- Status: **Pending KYC**

#### 2️⃣ Admin Sees Pending KYC
**Dashboard shows:**
- Pending KYC counter increases
- New agent appears in "Recent Registrations" table
- Status: Orange "Pending" badge

#### 3️⃣ Admin Approves (Two Ways)

**Way 1: From Dashboard**
1. Go to `/admin/dashboard`
2. Scroll to "Recent Registrations" table
3. Find the pending agent
4. Click blue **"Approve"** button
5. Confirm the popup

**Way 2: From Agent Manager**
1. Go to `/admin/agents`
2. Find the agent
3. Under "KYC Status" column, click **"Approve KYC"**
4. Confirm the popup

#### 4️⃣ Confirmation
- Success message: "Agent KYC approved successfully!"
- Status changes to: Green ✓ **Approved**
- Agent can now log in

#### 5️⃣ Agent Logs In
- Agent goes to `/login`
- Uses their credentials
- Gets authenticated & redirected to `/agent/dashboard`
- Can now book flights, hotels, etc.

---

## 📊 Admin Dashboard Real-Time Updates

### What Updates When:

| Event | Dashboard Updates |
|-------|------------------|
| New agent registers | Pending KYC count +1 |
| Admin approves KYC | Active Agents +1, Pending KYC -1 |
| Agent makes booking | Total Revenue +amount |
| Agent makes booking | Weekly Bookings +1 |
| New agent approves | Recent Registrations list shows them |

---

## 🛡️ Security Features for Admin

✅ Only email `admin@zayafly.com` can access
✅ Password protected login
✅ JWT token authentication
✅ Token expires (auto logout)
✅ All admin actions logged
✅ Role-based access control
✅ Rate limiting on all endpoints

---

## 🔍 Admin Responsibilities

1. **Review KYC Applications**
   - Approve legitimate agents
   - Reject suspicious accounts
   
2. **Monitor Platform Activity**
   - Watch booking trends
   - Monitor revenue
   - Track agent performance

3. **Manage Commissions**
   - Set competitive rates
   - Adjust per season
   - Maximize profit margins

4. **Customer Support**
   - Handle escalations
   - Review complaints
   - Process refunds

5. **System Maintenance**
   - Update global settings
   - Monitor performance
   - Plan promotions

---

## 💡 Quick Tips for Admin

1. **Batch Approvals**: Regularly check pending KYC
2. **Analyze Trends**: Use Reports page for insights
3. **Manage Offers**: Create seasonal promotions
4. **Commission Strategy**: Adjust rates to stay competitive
5. **Agent Support**: Good service keeps agents active

---

## ❌ What Happens If Admin Doesn't Approve KYC?

- Agent cannot log in
- Login shows: "Account pending KYC approval. Please wait for admin verification."
- Agent can check back later
- Admin approval notification (optional email)

---

## 📞 Logout

1. Click your avatar (top right)
2. Click **"LOGOUT ADMIN"**
3. Redirected to home page
4. Token cleared from localStorage
5. Cannot access admin pages anymore

---

## 🎯 Key Admin Metrics to Monitor

**Daily:**
- New agent registrations
- Pending KYC count
- Daily bookings
- Daily revenue

**Weekly:**
- Active agents
- Total revenue
- Booking trends
- Popular services

**Monthly:**
- Growth rate
- Commission distribution
- Platform performance
- Agent rankings

---

## 📱 Admin Panel Responsive Design

- ✅ Fully responsive on mobile
- ✅ Sidebar collapses on small screens
- ✅ Touch-friendly buttons
- ✅ Optimized tables
- ✅ Mobile-first design

---

## 🎓 Example: Complete KYC Approval Workflow

### Scenario:
A new travel agency "Blue Sky Travels" registers at 10:00 AM.

**10:00 AM - Registration**
```
Name: Rajesh Kumar
Email: rajesh@blueski.com
Agency: Blue Sky Travels
```

**10:05 AM - Admin Notification**
Admin sees dashboard:
- Pending KYC: 1
- Recent Registrations shows "Blue Sky Travels" with Approve button

**10:10 AM - Admin Approves**
- Click Approve
- Confirm popup
- Success! Status: Approved ✓

**10:15 AM - Agent Logs In**
- Rajesh uses email: rajesh@blueski.com
- Password: his_chosen_password
- Logged in successfully
- Redirected to dashboard

**10:20 AM - Agent Makes First Booking**
- Searches Delhi to Mumbai flight
- Selects ₹5000 flight
- Books flight
- Wallet balance updated
- Admin dashboard updates with new revenue

**Dashboard Now Shows:**
- Pending KYC: 0
- Active Agents: 1 (increased)
- Total Revenue: 5000 (increased)
- Weekly Bookings: 1 (increased)

---

**✅ Admin Panel is Now Fully Operational!**

---

**Version**: 1.0  
**Last Updated**: March 20, 2026  
**Status**: Ready to Use
