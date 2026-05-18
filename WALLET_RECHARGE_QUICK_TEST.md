# Wallet Recharge - Quick Test Guide

## 🚀 Start the Application

### Terminal 1: Start Backend
```bash
cd d:\Zaha\Backend
npm run dev
```
Expected output: `Server running on http://localhost:5000`

### Terminal 2: Start Frontend
```bash
cd d:\Zaha\frontend-web
npm run dev
```
Expected output: `http://localhost:5173/`

---

## 🧪 Testing Workflow

### Step 1: Login/Registration
- Open `http://localhost:5173/`
- Click "Agent Login" or "Register"
- If new agent:
  - Register with email, password, agency name
  - Wait for admin KYC approval
  - Admin dashboard: Approve the agent
- Login with agent credentials

### Step 2: Navigate to Wallet
- Click "Wallet" in the sidebar
- See your current wallet balance
- See "ADD MONEY" button

### Step 3: Click "ADD MONEY"
- The wallet recharge modal opens
- You see 4 payment method options:
  - 📱 UPI Payments
  - 💳 Debit/Credit Card
  - 🏦 Net Banking
  - 💰 Saved Wallet

### Step 4: Select Payment Method & Amount
**Option A: Use Preset Amount**
- Click one of the preset buttons: ₹500, ₹1000, ₹5000, ₹10000
- Button highlights in blue when selected

**Option B: Custom Amount**
- Type in the amount field (e.g., 999)
- Enter any amount > 0

### Step 5: Select Payment Method
- Choose one of 4 methods
- Selected method highlights in blue
- Example: Click "📱 UPI Payments"

### Step 6: Click "PAY ₹XXXX"
- The "PAY" button shows the amount
- Razorpay payment form opens in a popup

### Step 7: Complete Test Payment

#### For UPI (Recommended for testing):
1. Razorpay shows "Enter UPI ID"
2. Enter any test UPI: `success@razorpay`
3. Click "Submit"
4. Payment succeeds

#### For Credit Card (Alternative):
1. Card number: `4111111111111111`
2. Expiry: Any future date (e.g., `12/25`)
3. CVV: Any 3 digits (e.g., `123`)
4. Click "Pay Now"
5. Complete any additional verification

#### For Net Banking (Alternative):
1. Select bank from dropdown
2. Click "Pay"
3. Enter any test credentials
4. Payment succeeds

### Step 8: Success Message
You should see:
```
✓ Successfully added ₹500 to your wallet!
```

The modal closes automatically.

### Step 9: Verify Wallet Updated
- Wallet balance increased by ₹500
- Balance card updates automatically
- Transaction appears in "Transaction History" table with:
  - Status: CREDIT (green)
  - Details: "WALLET RECHARGE"
  - Amount: +₹500
  - Date: Today's date

---

## 📊 What Gets Created

### In Your Browser (localStorage)
```javascript
localStorage.agentToken = "jwt_token_here"
localStorage.agentInfo = {agentName, email, ...}
```

### In MongoDB Database
**Agent Collection:** walletBalance increases
```javascript
{
  _id: ObjectId,
  agentName: "John Doe",
  walletBalance: 500    // ← Increased from 0 to 500
}
```

**Transaction Collection:** New record created
```javascript
{
  _id: ObjectId,
  agentId: ObjectId,
  amount: 500,
  transactionType: "CREDIT",
  purpose: "WALLET_RECHARGE",
  referenceId: "pay_XXXXX",  // Razorpay payment ID
  razorpayOrderId: "order_XXXXX",
  razorpayPaymentId: "pay_XXXXX",
  status: "COMPLETED",
  createdAt: "2024-03-20T10:30:00Z"
}
```

---

## 🧪 Test Cases

### ✅ Test 1: Basic Recharge (₹500)
- [ ] Open wallet page
- [ ] Click "ADD MONEY"
- [ ] Click preset ₹500 button
- [ ] Select UPI payment
- [ ] Click "PAY ₹500"
- [ ] Enter `success@razorpay`
- [ ] See success message
- [ ] Wallet balance updates to ₹500

### ✅ Test 2: Custom Amount (₹999)
- [ ] Click "ADD MONEY"
- [ ] Type 999 in amount field
- [ ] Select any payment method
- [ ] Click "PAY ₹999"
- [ ] Complete payment (use test credentials)
- [ ] Wallet balance increases by ₹999

### ✅ Test 3: Multiple Recharges
- [ ] Recharge ₹1000
- [ ] Then recharge ₹2000
- [ ] Wallet balance = ₹3000
- [ ] Both transactions visible in history

### ✅ Test 4: Transaction History
- [ ] Make 2-3 recharges
- [ ] Transaction History shows all 3
- [ ] Most recent first (sorted by date)
- [ ] Correct amounts and dates

### ✅ Test 5: Payment Cancellation
- [ ] Click "ADD MONEY"
- [ ] Click "PAY ₹500"
- [ ] Close payment form (X button)
- [ ] Error: "Payment cancelled" shows
- [ ] Wallet NOT charged
- [ ] Modal still open for retry

### ✅ Test 6: Invalid Amount
- [ ] Type 0 or negative number
- [ ] "PAY" button disabled/greyed out
- [ ] Error: "Please enter a valid amount"
- [ ] Button only enables for amount > 0

### ✅ Test 7: Responsive Design (Mobile)
- [ ] Open DevTools (F12)
- [ ] Toggle Device Toolbar (mobile view)
- [ ] Click "ADD MONEY"
- [ ] Modal responsive on mobile
- [ ] All buttons clickable
- [ ] Text readable

---

## 🔍 Verification Checklist

### Frontend (http://localhost:5173)
- [ ] Wallet page loads without errors
- [ ] "ADD MONEY" button visible and clickable
- [ ] Modal opens with all 4 payment methods
- [ ] Preset amount buttons work
- [ ] Custom amount input accepts numbers
- [ ] "PAY" button updates with amount
- [ ] Success message appears after payment
- [ ] Transaction history updates
- [ ] Wallet balance reflects credit

### Backend (http://localhost:5000)
- [ ] Server running on port 5000
- [ ] No console errors during recharge
- [ ] Razorpay API calls successful
- [ ] Database updates reflect in MongoDB

### Database (MongoDB)
- [ ] Agent.walletBalance increases
- [ ] Transaction record created
- [ ] All fields populated correctly
- [ ] Timestamps accurate

---

## 🐛 Common Issues & Solutions

### Issue: Razorpay payment form doesn't open
**Solution:**
- Check browser console for errors (F12)
- Verify `https://checkout.razorpay.com/v1/checkout.js` loaded in Network tab
- Refresh page
- Try different browser

### Issue: "Payment gateway not loaded"
**Solution:**
- Close modal
- Refresh page
- Try again
- Check internet connection

### Issue: Payment goes through but wallet not updated
**Solution:**
- Check console for errors
- Verify Razorpay keys in `.env` file
- Restart backend
- Check MongoDB for Agent document
- Look for Transaction record with payment ID

### Issue: Modal won't close after success
**Solution:**
- Should auto-close in 2 seconds
- If stuck, click X button
- Manual refresh: F5

### Issue: Amount shows as "$undefined" in PAY button
**Solution:**
- Enter amount before clicking buttons
- Try a preset amount first
- Refresh page if still broken

---

## 📱 Test Payment Methods

### UPI (Recommended ⭐⭐⭐)
- **ID**: `success@razorpay`
- **Result**: Instant success
- **Time**: <1 second

### Credit Card (Alternative ⭐⭐)
- **Number**: `4111111111111111`
- **Expiry**: `12/25` (any future date)
- **CVV**: `123` (any 3 digits)
- **Result**: Usually succeeds
- **Time**: ~2-3 seconds

### Net Banking (Alternative ⭐⭐)
- **Bank**: Select any from dropdown
- **Username**: `test`
- **Password**: `test`
- **Result**: Usually succeeds
- **Time**: ~2-3 seconds

---

## 📞 Support

If something doesn't work:

1. **Check Backend Logs**: Look for red error messages
   ```
   Razorpay Error: ...
   Wallet Recharge Error: ...
   ```

2. **Check Frontend Console**: Press F12 → Console tab
   - Look for red error messages
   - Check Network tab for failed API calls

3. **Check .env**: Verify Razorpay keys present
   ```
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```

4. **Check Database**: Open MongoDB
   - Verify Agent document exists
   - Verify Transaction record created
   - Check walletBalance updated

5. **Restart Services**:
   ```bash
   # Terminal 1: Press Ctrl+C, then
   npm run dev
   
   # Terminal 2: Press Ctrl+C, then
   npm run dev
   ```

---

## 🎉 Success!

When everything works, you should see:

✅ Wallet balance updates immediately  
✅ Transaction appears in history  
✅ Success message shows  
✅ Database records created  
✅ No console errors  

**🎉 Wallet Recharge System is LIVE!**

---

## Next Steps

1. **Test all 4 payment methods** with different amounts
2. **Verify transaction history** shows all recharges
3. **Check MongoDB** for correct data storage
4. **Test on mobile** - use responsive design
5. **Test error scenarios** - invalid amount, cancellation, etc.
6. **Create admin documentation** for production setup
7. **Set up notifications** - email after successful recharge
8. **Monitor Razorpay** - check dashboard for all payments

For detailed information, see: `WALLET_RECHARGE_GUIDE.md`
