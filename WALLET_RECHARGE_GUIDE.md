# Wallet Recharge System - Implementation Guide

## Overview
The wallet recharge system is now fully integrated with Razorpay payment gateway, supporting multiple payment methods:
- 💳 Debit/Credit Card (Visa, Mastercard, Amex)
- 📱 UPI Payments (PhonePe, Google Pay, PayTM)
- 🏦 Net Banking (All major Indian banks)
- 💰 Saved Wallet (Zayafly wallet)

## File Structure Created/Modified

### Frontend Components
1. **`/frontend-web/src/components/WalletRecharge.jsx`** (NEW)
   - Beautiful modal component with payment method selection
   - Amount input with preset amounts (₹500, ₹1000, ₹5000, ₹10000)
   - Real-time validation and error handling
   - Razorpay integration with secure payment flow
   - Success/error message display

2. **`/frontend-web/src/pages/agent/Wallet.jsx`** (MODIFIED)
   - Added WalletRecharge modal state management
   - "ADD MONEY" button now opens the recharge modal
   - Auto-refreshes wallet balance and transaction history after successful recharge

3. **`/frontend-web/src/services/api.js`** (MODIFIED)
   - Added `createOrder()` - creates Razorpay order from backend
   - Added `rechargeWallet()` - completes payment verification and wallet update

4. **`/frontend-web/index.html`** (MODIFIED)
   - Added Razorpay payment gateway script: `https://checkout.razorpay.com/v1/checkout.js`

### Backend Services
1. **`/Backend/src/controllers/wallet.controller.js`** (EXISTING - Already Complete)
   - `createOrder()` - initiates Razorpay payment order
   - `rechargeWallet()` - verifies payment signature and credits wallet
   - `getBalance()` - returns current wallet balance
   - `getWalletHistory()` - paginated transaction history

2. **`/Backend/src/routes/wallet.routes.js`** (EXISTING - Already Complete)
   - POST `/create-order` - protected route to create payment order
   - POST `/recharge` - public route for payment completion (signature verified)
   - GET `/balance` - protected route to get wallet balance
   - GET `/history` - protected route for transaction history

3. **`/Backend/src/services/paymentService.js`** (EXISTING - Already Complete)
   - `createRazorpayOrder()` - handles Razorpay API communication
   - `verifySignature()` - cryptographically verifies payment authenticity

## Payment Flow Diagram

```
1. AGENT CLICKS "ADD MONEY"
   ↓
2. WALLET RECHARGE MODAL OPENS
   ├─ Select payment method (UPI/Card/NetBanking/Wallet)
   ├─ Enter amount (or select preset)
   └─ Click PAY
   ↓
3. FRONTEND CALLS: walletService.createOrder(amount, method)
   ↓
4. BACKEND CREATES RAZORPAY ORDER
   └─ Returns: Order ID, Razorpay Key
   ↓
5. RAZORPAY CHECKOUT WINDOW OPENS
   └─ Agent completes payment
   ↓
6. PAYMENT SUCCESS CALLBACK
   └─ Razorpay sends: payment_id, order_id, signature
   ↓
7. FRONTEND CALLS: walletService.rechargeWallet(paymentDetails)
   ↓
8. BACKEND VERIFIES SIGNATURE
   ├─ If valid: Credit wallet + Create transaction record
   └─ If invalid: Return error
   ↓
9. FRONTEND UPDATES WALLET
   ├─ Displays success message
   ├─ Updates balance display
   └─ Refreshes transaction history
   ↓
10. AGENT SEES "✓ Successfully added ₹XXXX to your wallet!"
```

## Environment Setup (Already Configured)

Your `.env` file already has Razorpay keys configured:
```env
RAZORPAY_KEY_ID=rzp_test_6u6lJzPcHzE08B
RAZORPAY_KEY_SECRET=lizbGqfrpyXilTipA9HU94aF
```

**Note:** These are test keys. For production, replace with live Razorpay keys from your Razorpay dashboard.

## How It Works - Step by Step

### Step 1: Agent Views Wallet Page
- Balance card displays current wallet balance
- "ADD MONEY" button is visible

### Step 2: Agent Clicks "ADD MONEY"
- WalletRecharge modal opens
- Shows 4 payment method options with icons
- Quick select buttons for ₹500, ₹1000, ₹5000, ₹10000

### Step 3: Agent Selects Payment Method & Amount
- Chooses one of 4 payment methods
- Enters custom amount OR selects preset
- Validation ensures amount > 0

### Step 4: Agent Clicks "PAY ₹XXXX"
- Frontend calls `walletService.createOrder(amount, method)`
- Backend creates order via Razorpay API
- Returns order ID + key

### Step 5: Razorpay Checkout Opens
- Beautiful payment form for selected method
- Supports cards, UPI, netbanking, wallets
- Secure payment processing

### Step 6: Payment Completion
- Razorpay handles the entire payment flow
- Returns payment_id, order_id, signature to frontend
- Frontend verifies signature with backend

### Step 7: Wallet Credit
- Backend verifies payment signature (CRITICAL for security)
- If valid: Updates Agent.walletBalance (atomic operation)
- Creates Transaction record for audit trail
- Returns new balance to frontend

### Step 8: User Feedback
- Modal shows success message: "✓ Successfully added ₹XXXX to your wallet!"
- Wallet balance updates immediately
- Transaction history refreshes automatically

## Security Features

1. **Signature Verification**: Every payment verified via HMAC-SHA256
2. **Duplicate Prevention**: Checks for existing transaction by razorpay_payment_id
3. **Atomic Updates**: Uses MongoDB $inc operator for safe balance updates
4. **Audit Trail**: Every transaction recorded with payment method & reference ID
5. **Rate Limiting**: (Recommended to add in production)

## Testing the Wallet Recharge

### Test Steps:
1. Start backend: `npm run dev` (in Backend folder)
2. Start frontend: `npm run dev` (in frontend-web folder)
3. Login as agent (register → wait for KYC approval → login)
4. Navigate to Agent Dashboard → Click "Wallet" in sidebar
5. Click "ADD MONEY" button
6. Select payment method (UPI recommended for testing)
7. Enter ₹500 or click a preset amount
8. Click "PAY ₹500"
9. Razorpay checkout opens
10. **For test payments**: Use Razorpay test cards:
    - **Card**: 4111111111111111 (any future date, any CVV)
    - **UPI**: Success@razorpay or any test UPI ID
11. Complete payment
12. See success message
13. Verify balance updated in wallet card
14. Check transaction appears in history

### Test Payment Credentials (Razorpay Test Mode)
- **Card Number**: 4111111111111111
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 123)
- **Name**: Any name
- **Email**: Any email

## Database Records Created

### Agent Model (Updated)
```javascript
{
  _id: ObjectId,
  agentName: String,
  emailAddress: String,
  walletBalance: Number,  // ← Updated after each recharge
  // ... other fields
}
```

### Transaction Model (New Record)
```javascript
{
  _id: ObjectId,
  agentId: ObjectId,           // Reference to agent
  amount: Number,              // Recharge amount
  transactionType: "CREDIT",   // Type of transaction
  purpose: "WALLET_RECHARGE",  // Purpose code
  referenceId: String,         // Razorpay payment ID
  razorpayOrderId: String,     // Razorpay order ID
  razorpayPaymentId: String,   // Razorpay payment ID
  status: "COMPLETED",         // Transaction status
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The system handles these scenarios gracefully:

| Error | Cause | Resolution |
|-------|-------|-----------|
| "Invalid amount" | Amount ≤ 0 | User selects valid amount > 0 |
| "Payment gateway not loaded" | Razorpay script failed | Refresh page, check internet |
| "Payment cancelled" | User closed payment form | Can retry by clicking ADD MONEY again |
| "Payment verification failed" | Signature mismatch | Payment not processed, wallet unchanged |
| "Transaction already processed" | Duplicate payment received | System prevents double credit |
| "Agent not found" | Invalid user session | User re-login required |

## Production Checklist

Before deploying to production:

- [ ] Replace test Razorpay keys with live keys in `.env`
- [ ] Enable HTTPS on frontend and backend
- [ ] Add rate limiting to `/wallet/create-order` endpoint
- [ ] Add transaction logging/monitoring
- [ ] Set up refund mechanism for failed transactions
- [ ] Add email notifications for successful recharges
- [ ] Test with real payments (small amount first)
- [ ] Enable transaction history CSV export
- [ ] Set up Razorpay webhook for additional security
- [ ] Monitor payment success/failure rates

## API Endpoints Summary

### Wallet Service Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/wallet/create-order` | ✅ Yes | Create Razorpay order |
| POST | `/api/wallet/recharge` | ❌ Public | Complete payment & credit wallet |
| GET | `/api/wallet/balance` | ✅ Yes | Get current balance |
| GET | `/api/wallet/history` | ✅ Yes | Get transaction history |

## User Experience Features

✨ **What Users See:**

1. **Visual Feedback**
   - Success message with checkmark: "✓ Successfully added ₹XXXX to your wallet!"
   - Error messages in red with clear explanations
   - Loading state on "PAY" button

2. **Responsive Design**
   - Works on desktop, tablet, and mobile
   - Payment modal centers on screen
   - Amount input with currency symbol
   - Quick preset buttons for common amounts

3. **Payment Method Icons**
   - 📱 UPI Payments
   - 💳 Debit/Credit Card
   - 🏦 Net Banking
   - 💰 Saved Wallet

4. **Security Indicators**
   - Blue info box: "Your payment is secured by Razorpay"
   - "No deduction of processing fees"

## Troubleshooting

### Issue: "Payment gateway not loaded"
**Solution**: 
- Check browsers console for script load errors
- Verify internet connection
- Clear browser cache and refresh
- Ensure Razorpay script is in index.html

### Issue: Payment doesn't go through
**Solution**:
- Verify Razorpay keys in .env are correct
- Check backend console for errors
- Use correct test payment credentials
- Verify amount is > 0

### Issue: Balance not updating
**Solution**:
- Check backend logs for signature verification errors
- Ensure Transaction model exists in MongoDB
- Verify Agent document exists in database
- Clear browser cache/localStorage

### Issue: "Transaction already processed" error
**Solution**:
- This is a safety feature to prevent double-charging
- Check if payment was already credited
- Wait a moment and try a different amount

## Support & Next Steps

The wallet recharge system is now **FULLY FUNCTIONAL**. 

To use it:
1. ✅ Backend Razorpay integration: READY
2. ✅ Frontend UI & modal: READY
3. ✅ Payment verification: READY
4. ✅ Wallet database updates: READY
5. ✅ Transaction history: READY

**Start the application and test the wallet recharge now!**

For more details, check:
- Frontend component: `/frontend-web/src/components/WalletRecharge.jsx`
- Backend controller: `/Backend/src/controllers/wallet.controller.js`
- Payment service: `/Backend/src/services/paymentService.js`
