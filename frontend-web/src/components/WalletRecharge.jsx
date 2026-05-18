import React, { useState } from 'react';
import { walletService } from '../services/api';

const WalletRecharge = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [upiMethod, setUpiMethod] = useState('qr'); // 'qr' or 'id'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const presetAmounts = [500, 1000, 5000, 10000];

    const paymentMethods = [
        {
            id: 'upi',
            name: 'UPI Payments',
            icon: '📱',
            desc: 'PhonePe, Google Pay, PayTM',
            color: 'bg-primary-50 border-primary-200'
        },
        {
            id: 'card',
            name: 'Debit/Credit Card',
            icon: '💳',
            desc: 'Visa, Mastercard, Amex',
            color: 'bg-accent-50 border-accent-200'
        },
        {
            id: 'netbanking',
            name: 'Net Banking',
            icon: '🏦',
            desc: 'All major Indian banks',
            color: 'bg-secondary-50 border-secondary-200'
        },
        {
            id: 'wallet',
            name: 'Saved Wallet',
            icon: '💰',
            desc: 'Goyafly.com wallet',
            color: 'bg-primary-50 border-primary-200'
        }
    ];

    const handleAmountSelect = (val) => {
        setAmount(val.toString());
        setError('');
    };

    const handleRecharge = async () => {
        if (!amount || amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Step 1: Create Razorpay Order from backend
            const orderRes = await walletService.createOrder(parseInt(amount), selectedMethod);

            if (!orderRes.success) {
                setError('Failed to create payment order. Please try again.');
                setLoading(false);
                return;
            }

            const { id: orderId, key } = orderRes.data;

            // Step 2: Initialize Razorpay Checkout
            const options = {
                key: orderRes.data.key || 'rzp_test_SUIH6k4l3JewbV', // Use key from server or fallback
                amount: parseInt(amount) * 100, // Amount in paise
                currency: 'INR',
                name: 'Goyafly.com',
                description: 'Wallet Recharge',
                order_id: orderId,

                // Method selection is handled in prefill

                handler: async (response) => {
                    // Step 3: Verify Payment & Update Wallet
                    try {
                        const verifyRes = await walletService.rechargeWallet({
                            amount: parseInt(amount),
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.success) {
                            setSuccess(`✓ Successfully added ₹${amount} to your wallet!`);
                            window.dispatchEvent(new Event('walletUpdated'));
                            setTimeout(() => {
                                setAmount('');
                                onSuccess?.(verifyRes.data.newBalance);
                                onClose?.();
                            }, 2000);
                        } else {
                            setError(verifyRes.message || 'Payment verification failed');
                        }
                    } catch (err) {
                        setError('Payment verification failed: ' + err.response?.data?.message || 'Unknown error');
                    }
                    setLoading(false);
                },

                prefill: {
                    email: localStorage.getItem('agentEmail') || 'agent@goyafly.com',
                    contact: localStorage.getItem('agentPhone') || '9876543210',
                    ...(selectedMethod && { method: selectedMethod })
                },

                theme: {
                    color: '#3B82F6'
                },

                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setError('Payment cancelled');
                    }
                }
            };

            // Create script and load Razorpay
            if (window.Razorpay) {
                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } else {
                setError('Payment gateway not loaded. Please refresh and try again.');
                setLoading(false);
            }

        } catch (err) {
            setError('Error: ' + err.message);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">Wallet Recharge</h2>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Add funds to your account</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-2xl text-gray-400 hover:text-gray-600 font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-8">

                        {/* Amount Input */}
                        <div className="space-y-4">
                            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary-500">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Enter amount"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold text-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Preset Amounts */}
                        <div className="space-y-3">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Quick Select</p>
                            <div className="grid grid-cols-4 gap-3">
                                {presetAmounts.map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleAmountSelect(val)}
                                        className={`py-3 px-4 rounded-xl font-black text-sm transition-all transform hover:scale-105 ${amount === val.toString()
                                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        ₹{val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-4">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Payment Method</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                    <div key={method.id} className="relative flex flex-col">
                                        <button
                                            onClick={() => {
                                                setSelectedMethod(method.id);
                                                setError('');
                                            }}
                                            className={`flex-1 p-5 rounded-2xl border-2 transition-all transform ${selectedMethod === method.id
                                                    ? `${method.color} border-primary-500 shadow-lg shadow-primary-500/20`
                                                    : `bg-white border-gray-100 hover:border-gray-200 hover:scale-[1.02]`
                                                }`}
                                        >
                                            <div className="text-3xl mb-2 text-left">{method.icon}</div>
                                            <div className="text-left">
                                                <h4 className="font-black text-gray-900 text-sm">{method.name}</h4>
                                                <p className="text-[10px] text-gray-500 font-bold mt-1">{method.desc}</p>
                                            </div>
                                            {selectedMethod === method.id && (
                                                <div className="absolute top-3 right-3 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-black z-10">✓</div>
                                            )}
                                        </button>

                                        {/* Show UPI Sub-options if selected */}
                                        {method.id === 'upi' && selectedMethod === 'upi' && (
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setUpiMethod('qr'); }}
                                                    className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${upiMethod === 'qr'
                                                            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-inner'
                                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className="text-sm">📷</span> QR Code
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setUpiMethod('id'); }}
                                                    className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${upiMethod === 'id'
                                                            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-inner'
                                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className="text-sm">@</span> UPI ID
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl font-bold text-sm">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-2xl font-bold text-sm flex items-center gap-3">
                                <span className="text-xl">✓</span>
                                {success}
                            </div>
                        )}

                        {/* Info Alert */}
                        <div className="p-4 bg-accent-50 border-l-4 border-accent-500 rounded-lg">
                            <p className="text-xs font-bold text-accent-700">
                                ℹ️ Your payment is secured by Razorpay. No deduction of processing fees.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 rounded-2xl font-black text-gray-700 transition-all"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleRecharge}
                                disabled={loading || !amount || amount <= 0}
                                className="flex-1 py-4 px-6 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-white shadow-lg shadow-primary-500/30 transition-all transform hover:scale-105 active:scale-95"
                            >
                                {loading ? 'PROCESSING...' : `PAY ₹${amount || '0'}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WalletRecharge;
