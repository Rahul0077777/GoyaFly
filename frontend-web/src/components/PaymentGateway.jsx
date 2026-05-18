import React, { useState } from 'react';

const PaymentGateway = ({ amount, onPaymentSuccess, onCancel }) => {
    const [step, setStep] = useState('methods'); // methods, processing, success
    const [method, setMethod] = useState(null);

    const handlePay = (selectedMethod) => {
        setMethod(selectedMethod);
        setStep('processing');
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onPaymentSuccess({
                    transactionId: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    method: selectedMethod,
                    amount
                });
            }, 1500);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-3xl overflow-hidden animate-slide-up border border-gray-100">
                {/* Header */}
                <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-xl">X</div>
                        <h3 className="font-black text-gray-900 text-lg">XYZ Checkout</h3>
                    </div>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-900 transition-colors">✕</button>
                </div>

                <div className="p-10">
                    {step === 'methods' && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable</p>
                                <p className="text-4xl font-black text-gray-900">₹{amount.toLocaleString()}</p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Select Payment Method</p>
                                {[
                                    { id: 'upi', name: 'UPI (PhonePe, GPay)', icon: '📱' },
                                    { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
                                    { id: 'nb', name: 'Net Banking', icon: '🏦' }
                                ].map((m) => (
                                    <button 
                                        key={m.id}
                                        onClick={() => handlePay(m.name)}
                                        className="w-full p-6 bg-white border-2 border-gray-50 rounded-2xl flex items-center justify-between hover:border-primary-500 hover:bg-primary-50/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{m.icon}</span>
                                            <span className="font-black text-gray-700 text-sm">{m.name}</span>
                                        </div>
                                        <span className="text-gray-300 group-hover:text-primary-500 transition-all">➔</span>
                                    </button>
                                ))}
                            </div>

                            <p className="text-[10px] text-center text-gray-400 font-bold leading-relaxed px-4">
                                Your payment is secured by industry-leading 256-bit encryption. Handled by XYZ Trust.
                            </p>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-20 text-center space-y-8">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-8 border-primary-50 rounded-full"></div>
                                <div className="absolute inset-0 border-8 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900 mb-2 italic">Securing Payment...</h4>
                                <p className="text-sm font-bold text-gray-400">Please do not refresh or press back.</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-16 text-center space-y-8 animate-fade-in">
                            <div className="w-32 h-32 bg-green-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-xl shadow-green-500/10">
                                <span className="text-6xl animate-bounce-short">✅</span>
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-gray-900 mb-2 italic">Success!</h4>
                                <p className="text-sm font-bold text-gray-400">Payment captured via {method}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl mx-8 border border-dashed border-gray-200">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">System Auth Code</p>
                                <p className="text-xs font-mono text-gray-700 font-black">XYZ-PAY-SUCCESS-002194</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center grayscale opacity-30 gap-6">
                     <span className="text-[10px] font-black tracking-widest grayscale font-mono">VISA</span>
                     <span className="text-[10px] font-black tracking-widest grayscale font-mono">RUPAY</span>
                     <span className="text-[10px] font-black tracking-widest grayscale font-mono">PCI-DSS</span>
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
