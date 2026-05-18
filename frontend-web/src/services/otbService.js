import api from './api';

const otbService = {
    apply: async (formData) => {
        const response = await api.post('/otb/apply', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    verifyPayment: async (paymentData) => {
        const response = await api.post('/otb/verify-payment', paymentData);
        return response.data;
    },

    getStatus: async (receiptNumber, contactNo = '') => {
        const url = `/otb/status/${receiptNumber}${contactNo ? `/${contactNo}` : ''}`;
        const response = await api.get(url);
        return response.data;
    },

    // Admin Methods
    getAllRequests: async () => {
        const response = await api.get('/otb/admin/all');
        return response.data;
    },

    updateStatus: async (id, data) => {
        const response = await api.put(`/otb/admin/update/${id}`, data);
        return response.data;
    },

    // Agent Subscription & Status
    getAgentStatus: async () => {
        const response = await api.get('/otb/agent-status');
        return response.data;
    },

    initiateSubscription: async () => {
        const response = await api.post('/otb/subscription/initiate');
        return response.data;
    },

    verifySubscription: async (data) => {
        const response = await api.post('/otb/subscription/verify', data);
        return response.data;
    },

    activateWithWallet: async () => {
        const response = await api.post('/otb/subscription/wallet');
        return response.data;
    },

    getAgentAccessRequests: async () => {
        const response = await api.get('/otb/admin/agent-access-requests');
        return response.data;
    },

    approveAgentAccess: async (agentId, data) => {
        const response = await api.put(`/otb/admin/approve-access/${agentId}`, data);
        return response.data;
    },

    // --- Pricing Management ---
    getPricing: async (isAdmin = false) => {
        const url = isAdmin ? '/otb/admin/pricing' : '/otb/pricing';
        const response = await api.get(url);
        return response.data;
    },
    createPricing: async (data) => {
        const response = await api.post('/otb/admin/pricing', data);
        return response.data;
    },
    updatePricing: async (id, data) => {
        const response = await api.put(`/otb/admin/pricing/${id}`, data);
        return response.data;
    },
    deletePricing: async (id) => {
        const response = await api.delete(`/otb/admin/pricing/${id}`);
        return response.data;
    }
};

const customerAuthService = {
    sendOTP: async (mobileNumber) => {
        const response = await api.post('/customers/send-otp', { mobileNumber });
        return response.data;
    },

    verifyOTP: async (mobileNumber, otp) => {
        const response = await api.post('/customers/verify-otp', { mobileNumber, otp });
        if (response.data.token) {
            localStorage.setItem('customerToken', response.data.token);
            localStorage.setItem('customerData', JSON.stringify(response.data.customer));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerData');
    }
};

export { otbService, customerAuthService };
