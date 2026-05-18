# Zayafly Complete Setup & Testing Guide

## 🚀 Quick Start Setup

### 1. Backend Setup
**Location**: `D:\Zaha\Backend`

```bash
# Install dependencies (if not done)
npm install

# Start the server in development mode
npm run dev
```

**Backend runs on**: `http://localhost:5000`
**Status Check**: `http://localhost:5000/api/status`

### 2. Frontend Setup
**Location**: `D:\Zaha\frontend-web`

```bash
# Install dependencies (if not done)
npm install

# Start the development server
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

---

## 📧 Admin Credentials (Stored in .env)

```
Email: admin@zayafly.com
Password: admin123
```

---

## ✅ Complete Workflow Testing

### **Step 1: Create an Agent Account**
1. Go to `http://localhost:5173/register`
2. Fill in the form with any details:
   - **Agent Name**: John Doe
   - **Agency Name**: Blue Travels
   - **Email**: agent@example.com
   - **Mobile**: 9876543210
   - **Password**: password123
   - **Address**: New Delhi
   - **GST** (Optional): 22AAAAA0000A1Z5
3. Click "Register"
4. You'll see: "Registration request sent! Please wait for admin KYC approval."

### **Step 2: Admin Approves KYC**
1. Go to `http://localhost:5173/admin/login`
2. Use credentials:
   - Email: `admin@zayafly.com`
   - Password: `admin123`
3. You'll be redirected to Admin Dashboard
4. **Dashboard shows**:
   - Total Revenue
   - Active Agents
   - Pending KYC (showing count)
   - Recent Registrations table
5. In "Recent Registrations" table, find your agent
6. Click **"Approve"** button
7. Confirm the popup: "Are you sure you want to approve this agent?"
8. Success message: "Agent KYC approved successfully!"
9. Refresh the page - status will now show ✓ **Approved**

### **Step 3: Agent Login**
1. Go to `http://localhost:5173/login`
2. Use the agent credentials created in Step 1:
   - Email: `agent@example.com`
   - Password: `password123`
3. You should be logged in successfully and redirected to `/agent/dashboard`

### **Step 4: Explore Agent Dashboard**
- **Dashboard Page** (`/agent/dashboard`):
  - View wallet balance and quick stats
  - See recent bookings
  - Access quick action buttons
  
**Services Available**:
- 🛫 **Flight Search** (`/agent/flight-search`)
  - Search flights from DEL to BOM
  - Book and proceed to checkout
- 🏨 **Hotel Search** (`/agent/hotel-search`)
- 🚌 **Bus & Train** (`/agent/bus-search`, `/agent/train-search`)
- 💰 **Wallet** (`/agent/wallet`)
  - View balance
  - See transaction history
- 📊 **Booking History** (`/agent/history`)
- ⚙️ **Settings & Profile** (`/agent/profile`)

### **Step 5: Make a Booking (Optional)**
1. Go to **Flight Search** (`/agent/flight-search`)
2. Click "Search" (default values: DEL → BOM)
3. Select a flight from the list
4. Fill passenger details on checkout page
5. Click **"PAY & CONFIRM"**
6. Select payment method in popup
7. Payment will be processed
8. Booking confirmed with reference ID

### **Step 6: Admin Can Manage Everything**

**Admin Panel Routes**:
- `/admin/dashboard` - View system stats, approve pending KYC
- `/admin/agents` - View and manage all agents
- `/admin/bookings` - View all bookings made by agents
- `/admin/commissions` - Set commission rates
- `/admin/reports` - Analytics and reports

---

## 🔑 Key Features Implemented

✅ **Agent Registration with KYC Verification**
✅ **Admin Login (Only 1 admin: admin@zayafly.com)**
✅ **KYC Approval System (via Admin Dashboard)**
✅ **Agent Login with KYC Check** (Prevents login until approved)
✅ **Flight/Hotel/Bus/Train Search** (Mock data)
✅ **Booking with Wallet Deduction**
✅ **Wallet Management** (Balance, recharge, history)
✅ **Transaction Ledger**
✅ **Protected Routes** (Admin & Agent pages restricted)
✅ **Responsive Design** (Desktop & Mobile)
✅ **Footer** (Added to all pages)
✅ **Error Handling** (Proper error messages)
✅ **Logout Functionality** (Both Admin & Agent)

---

## 🔒 Access Control

### Admin Only:
- Can access `/admin/*` routes
- Must have `adminToken` in localStorage
- Cannot access agent routes

### Agent Only:
- Can access `/agent/*` routes
- Must have `agentToken` in localStorage
- Cannot access admin routes
- **MUST** have KYC approved to log in

---

## 🗄️ Database

**MongoDB URI**: `mongodb://localhost:27017/Zaha_production`

### Collections created:
- `agents` - Agent accounts
- `bookings` - All bookings
- `transactions` - Wallet ledger
- `admins` - Admin accounts (1 super admin created)
- `commissionrules` - Commission settings
- `coupons` - Coupon codes

---

## 📝 API Endpoints (Key Routes)

### **Auth**
- `POST /api/agents/register` - Register agent
- `POST /api/agents/login` - Agent login (KYC check included)
- `POST /api/admin/login` - Admin login

### **Admin**
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/agents` - List all agents
- `PUT /api/admin/agents/:id/approve` - Approve agent KYC

### **Bookings**
- `GET /api/bookings/flights/search` - Search flights
- `POST /api/bookings/flights/book` - Book flight
- `GET /api/bookings/history/agent` - Agent's bookings
- `GET /api/bookings/history/all` - Admin's all bookings

### **Wallet**
- `GET /api/wallet/balance` - Get balance
- `GET /api/wallet/history` - Get transactions
- `POST /api/wallet/recharge` - Add funds

---

## 🐛 Troubleshooting

### Backend won't start?
- Check if MongoDB is running: `mongod`
- Check port 5000 is free
- Verify `.env` file exists with correct settings

### Agent can't log in after registration?
- Admin hasn't approved KYC yet
- Go to Admin Dashboard → Approve button

### Can't access admin panel?
- Use only `admin@zayafly.com` account
- Don't use agent email to access `/admin/*`
- Clear localStorage and try again

### Frontend won't load?
- Check if backend is running first
- Clear browser cache
- Run `npm install` again in frontend folder

---

## 📊 Expected Behavior After Complete Setup

✅ Register agent → Pending KYC
✅ Admin approves → Agent can log in
✅ Agent searches flights → Gets mock results
✅ Agent books → Wallet balance decreases
✅ Admin sees stats & recent agents
✅ Logout & login works correctly
✅ Protected routes work (no unauthorized access)

---

## 🎯 Next Steps

1. Test the complete workflow as described above
2. Verify all error messages are displayed correctly
3. Test responsive design on mobile
4. Check browser console for any errors
5. Ready for production deployment!

---

**Version**: 1.0  
**Last Updated**: March 20, 2026
