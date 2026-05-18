# ⚡ QUICK START - Zayafly Project

## 🎯 TL;DR (Too Long; Didn't Read)

### Start the Project
```bash
# Terminal 1 - Backend
cd D:\Zaha\Backend && npm run dev

# Terminal 2 - Frontend  
cd D:\Zaha\frontend-web && npm run dev
```

### URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## 🔑 Admin Credentials (ONLY One Email Can Use)

```
Email: admin@zayafly.com
Password: admin123
```

---

## 📝 Test Flow (5 Minutes)

### 1. Register Agent (1 min)
- Go to: `http://localhost:5173/register`
- Fill form → Register
- See: "Registration request sent! Please wait for admin KYC approval."

### 2. Admin Approves (1 min)
- Go to: `http://localhost:5173/admin/login`
- Login with credentials above
- Find agent in dashboard
- Click **"Approve"** button
- Success! ✓

### 3. Agent Logs In (1 min)
- Go to: `http://localhost:5173/login`
- Use email & password from step 1
- Welcome to dashboard! 🎉

### 4. Test Booking (2 min)
- Click "Flight Search"
- Click "Search"
- Select a flight
- Go through checkout
- Book flight ✓

---

## ✅ What's Working

| Feature | Status |
|---------|--------|
| Agent Register | ✅ Works |
| Admin Login | ✅ Works |
| KYC Approval | ✅ Works |
| Agent Login | ✅ Works |
| Flight Booking | ✅ Works |
| Hotel Booking | ✅ Works |
| Bus/Train Booking | ✅ Works |
| Wallet System | ✅ Works |
| Admin Dashboard | ✅ Works |
| Protected Routes | ✅ Works |
| Logout | ✅ Works |

---

## 📍 Key Pages

### Public
- Home: `/`
- Agent Login: `/login`
- Admin Login: `/admin/login`
- Register: `/register`

### Agent Panel
- Dashboard: `/agent/dashboard`
- Flights: `/agent/flight-search`
- Hotels: `/agent/hotel-search`
- Buses: `/agent/bus-search`
- Trains: `/agent/train-search`
- Wallet: `/agent/wallet`
- Bookings: `/agent/history`

### Admin Panel
- Dashboard: `/admin/dashboard`
- Agents: `/admin/agents`
- Bookings: `/admin/bookings`
- Commissions: `/admin/commissions`
- Reports: `/admin/reports`

---

## 🔐 Admin-Specific Tasks

1. **Approve Pending KYC** ← Main task!
   - Dashboard → Find pending agent → Approve

2. **View All Agents**
   - `/admin/agents` → See list, status, wallet balance

3. **View All Bookings**
   - `/admin/bookings` → See who booked what

4. **Check Dashboard Stats**
   - `/admin/dashboard` → KPIs, revenue, agents count

---

## 🚨 Important Notes

⚠️ **Only `admin@zayafly.com` can login as admin**
- No other email works for admin panel
- Use exact credentials above

⚠️ **Agents MUST be KYC-approved before login**
- They register → status: Pending
- Admin approves → status: Approved
- Then they can login

⚠️ **Wallet System**
- Each booking deducts from wallet
- Can recharge wallet (simulated)
- History tracked

---

## 📱 Supported Features

✅ Full Mobile Responsive
✅ Dark/Light Themes (in CSS)
✅ Real-time Dashboard
✅ Protected Routes
✅ Token Authentication
✅ Error Handling
✅ Loading States
✅ Success Alerts

---

## 💾 Database

- **Type**: MongoDB
- **Database**: `Zaha_production`
- **Location**: `localhost:27017`
- **Status**: Auto-creates collections

---

## 🐛 Troubleshooting

### Backend Not Starting?
```bash
npm install
npm run dev
```

### Frontend Not Loading?
```bash
npm install
npm run dev
```

### Can't Login as Admin?
- Use exact email: `admin@zayafly.com`
- Use exact password: `admin123`
- Check admin panel login page

### Agent Can't Login After Register?
- Go to admin dashboard
- Find agent in "Recent Registrations"
- Click "Approve" button
- Now agent can login

---

## 📚 Documentation Available

1. **SETUP_GUIDE.md** - Complete setup & workflow
2. **COMPLETION_CHECKLIST.md** - All features list
3. **ADMIN_GUIDE.md** - Detailed admin instructions
4. **QUICK_START.md** - This file (quick reference)

---

## 🎯 Success Indicators

Once working, you should see:

✅ Backend responds: `http://localhost:5000/api/status`
✅ Frontend loads: `http://localhost:5173`
✅ Admin can login with provided credentials
✅ Dashboard shows KPIs
✅ Can register new agent
✅ Can approve agent KYC from dashboard
✅ Approved agent can login
✅ Can search & book flights
✅ Wallet balance updates after booking

---

## 🎉 You're All Set!

Everything is configured and ready to use.

**Next steps:**
1. Start backend (Terminal 1)
2. Start frontend (Terminal 2)
3. Follow the 5-minute test flow above
4. Check documentation for deeper details

**Questions?** Check the markdown files in `D:\Zaha\` folder.

---

**Status**: ✅ READY TO USE
**Version**: 2.0
**Date**: March 20, 2026
