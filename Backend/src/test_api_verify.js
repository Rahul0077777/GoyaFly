const axios = require('axios');

const testApiVerify = async () => {
    try {
        console.log('🧪 Testing API endpoint: /api/booking/flights/verify-price');
        // Purposefully sending a mismatched/stale ID to verify it returns 400, not 500
        const res = await axios.post('http://localhost:5000/api/booking/flights/verify-price', {
            flightID: '3399116',
            refID: 'STALE_ID_TEST',
            originalNetfare: 0
        });
        console.log('✅ Success:', res.data);
    } catch (error) {
        console.log('🔹 Status Code:', error.response?.status);
        console.log('🔹 Response Body:', JSON.stringify(error.response?.data, null, 2));
        
        if (error.response?.status === 400) {
            console.log('🎉 VERIFIED: Backend correctly returned 400 for GDS mismatch.');
        } else if (error.response?.status === 500) {
            console.log('❌ FAILED: Backend still returns 500.');
        }
    }
};

testApiVerify();
