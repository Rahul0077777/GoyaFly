import React, { useState, useEffect } from 'react';
import { View, Modal, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function RazorpayGatewayModal({ visible, amount, orderId, razorpayKey, onPaymentSuccess, onCancel }) {
    const [loading, setLoading] = useState(true);

    // The HTML content acts as a secure sandbox loading Razorpay's official checkout library.
    const checkoutHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; margin: 0; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #48A0D4; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div class="loader" id="loader"></div>
        <p style="margin-top:20px; color:#64748b; font-weight:bold;">Initializing Secure Gateway...</p>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
            var options = {
                "key": "${razorpayKey}",
                "amount": "${amount * 100}", // Paise
                "currency": "INR",
                "name": "Zayafly Travel",
                "description": "Wallet Top Up",
                "order_id": "${orderId}",
                "prefill": {
                    "email": "agent@zayafly.com",
                    "contact": "9876543210"
                },
                "handler": function (response){
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        event: 'SUCCESS',
                        data: {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        }
                    }));
                },
                "modal": {
                    "ondismiss": function(){
                        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DISMISS' }));
                    }
                },
                "theme": {
                    "color": "#48A0D4"
                }
            };
            
            function initRazorpay() {
                if (typeof Razorpay !== 'undefined') {
                    var rzp1 = new Razorpay(options);
                    rzp1.on('payment.failed', function (response){
                        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'ERROR', data: response.error.description }));
                    });
                    document.getElementById('loader').style.display = 'none';
                    rzp1.open();
                } else {
                    setTimeout(initRazorpay, 500);
                }
            }
            initRazorpay();
        </script>
    </body>
    </html>
    `;

    const handleMessage = (event) => {
        try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.event === 'SUCCESS') {
                onPaymentSuccess(msg.data);
            } else if (msg.event === 'DISMISS') {
                onCancel();
            } else if (msg.event === 'ERROR') {
                alert('Payment Failed: ' + msg.data);
                onCancel();
            }
        } catch (e) {
            console.error("WebView Message Parsing Error:", e);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-white pt-10">
                <View className="px-4 py-3 flex-row items-center border-b border-slate-100 bg-white shadow-sm z-10">
                    <TouchableOpacity onPress={onCancel} className="bg-slate-100 p-2 rounded-full mr-3">
                        <Ionicons name="close" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-lg font-black text-slate-900 flex-1 text-center pr-10">Secure Checkout</Text>
                </View>
                
                {visible && orderId && razorpayKey ? (
                    <WebView
                        source={{ html: checkoutHTML, baseUrl: 'https://checkout.razorpay.com' }}
                        originWhitelist={['*']}
                        onMessage={handleMessage}
                        onLoadEnd={() => setLoading(false)}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowFileAccess={true}
                        allowUniversalAccessFromFileURLs={true}
                        mixedContentMode="always"
                        style={{ flex: 1, backgroundColor: 'transparent' }}
                    />
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#48A0D4" />
                        <Text className="mt-4 text-slate-500 font-bold">Connecting to Gateway...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}
