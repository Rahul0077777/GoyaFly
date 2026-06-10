import axios from 'axios';
import { toast } from 'react-toastify';

// Create an Axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
    (config) => {
        const agentToken = localStorage.getItem('agentToken');
        const adminToken = localStorage.getItem('adminToken');
        
        // Use adminToken for any route that targets the admin API (including nested ones like /otb/admin/)
        const isAdminRoute = config.url.includes('/admin/') || config.url.startsWith('admin/');
        const token = isAdminRoute ? adminToken : agentToken;
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Don't auto-redirect for login endpoints — let the login component handle its own errors
            const requestUrl = error.config?.url || '';
            const isLoginRequest = requestUrl.includes('/login');
            
            if (!isLoginRequest) {
                console.log('Unauthorized Access - Redirecting...');
                
                // Determine if it was an admin request
                const isAdminRequest = requestUrl.includes('/admin/');
                
                if (isAdminRequest) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminInfo');
                    if (window.location.pathname !== '/admin/login') {
                        window.location.href = '/admin/login';
                    }
                } else {
                    localStorage.removeItem('agentToken');
                    localStorage.removeItem('agentInfo');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            }
        }
        
        // Custom handling for 403 Blocked messages (if not handled by component)
        if (error.response && error.response.status === 403 && error.response.data?.message?.toLowerCase().includes('blocked')) {
            toast.error(error.response.data.message || 'Account blocked. Please contact support.');
        }
        
        // Global handling for 503 Service Unavailable (e.g. OTB/Fixed Departure disabled)
        if (error.response && error.response.status === 503) {
            toast.error(error.response.data?.message || 'Service is temporarily disabled. Please contact the administrator for any urgent requirements.');
        }
        
        return Promise.reject(error);
    }
);

export const publicService = {
    getPromotions: async () => {
        const response = await api.get('/marketing/promotions');
        return response.data;
    }
};

export const authService = {
    agentLogin: async (email, password) => {
        const response = await api.post('/agents/login', { emailAddress: email, password });
        if (response.data.data && response.data.data.token) {
            localStorage.setItem('agentToken', response.data.data.token);
            localStorage.setItem('agentInfo', JSON.stringify(response.data.data));
        }
        return response.data;
    },
    agentRegister: async (formData) => {
        const response = await api.post('/agents/register', formData);
        return response.data;
    },
    agentLogout: () => {
        localStorage.removeItem('agentToken');
        localStorage.removeItem('agentInfo');
    },
    getProfile: async () => {
        const response = await api.get('/agents/profile');
        return response.data;
    },
    updateProfile: async (profileData) => {
        const response = await api.put('/agents/profile', profileData);
        return response.data;
    },
    agentKycResubmit: async (formData) => {
        const response = await api.post('/agents/resubmit-kyc', formData);
        return response.data;
    }
};

export const agentService = {
    getDashboardStats: async () => {
        const response = await api.get('/agents/dashboard/stats');
        return response.data;
    },
    getMarkups: async () => {
        const response = await api.get('/agents/markups');
        return response.data;
    },
    updateMarkup: async (markupData) => {
        const response = await api.put('/agents/markups', markupData);
        return response.data;
    },
    getNotifications: async () => {
        const response = await api.get('/agents/notifications');
        return response.data;
    },
    markNotificationRead: async (id) => {
        const response = await api.put(`/agents/notifications/${id}/read`);
        return response.data;
    },
    deleteNotification: async (id) => {
        const response = await api.delete(`/agents/notifications/${id}`);
        return response.data;
    },
    getTickets: async () => {
        const response = await api.get('/agents/tickets');
        return response.data;
    },
    createTicket: async (ticketData) => {
        const response = await api.post('/agents/tickets', ticketData);
        return response.data;
    },
    addTicketMessage: async (id, message) => {
        const response = await api.post(`/agents/tickets/${id}/message`, { message });
        return response.data;
    },
    deleteTicket: async (id) => {
        const response = await api.delete(`/agents/tickets/${id}`);
        return response.data;
    },
    getUnreadNotificationsCount: async () => {
        const response = await api.get('/agents/notifications/unread-count');
        return response.data;
    },
    getEarningsReport: async () => {
        const response = await api.get('/agents/earnings-report');
        return response.data;
    }
};

export const walletService = {
    getBalance: async () => {
        const response = await api.get('/wallet/balance');
        return response.data;
    },
    getHistory: async (page = 1, limit = 10) => {
        const response = await api.get('/wallet/history', { params: { page, limit } });
        return response.data;
    },
    getLedger: async (page = 1, limit = 100) => {
        const response = await api.get('/wallet/history', { params: { page, limit } });
        return response.data;
    },
    createOrder: async (amount, paymentMethod) => {
        const response = await api.post('/wallet/create-order', { amount, paymentMethod });
        return response.data;
    },
    rechargeWallet: async (paymentDetails) => {
        const response = await api.post('/wallet/recharge', paymentDetails);
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/wallet/stats');
        return response.data;
    }
};

export const holidayService = {
    getPackages: async (search = '') => {
        const response = await api.get(`/holidays?search=${search}`);
        return response.data;
    }
};

export const fixedDepartureService = {
    searchFlights: async (from, to, date) => {
        const response = await api.get('/fixed-departures/search', { params: { from, to, date } });
        return response.data;
    },
    getAvailableDates: async (from, to) => {
        const response = await api.get('/fixed-departures/available-dates', { params: { from, to } });
        return response.data;
    },
    bookFlight: async (bookingData) => {
        const response = await api.post('/fixed-departures/book', bookingData);
        return response.data;
    },
    getMyBookings: async () => {
        const response = await api.get('/fixed-departures/my-bookings');
        return response.data;
    }
};

export const bookingService = {
    // =============================================
    // FTD FLIGHT API (Production GDS)
    // =============================================
    
    // Search flights via FTD postSearchFlightV2
    ftdSearchFlights: async (searchParams) => {
        const response = await api.post('/booking/flights/search', searchParams);
        return response.data;
    },

    // Get fare details (View Price — SME, Retail, Flexi)
    ftdGetFareDetails: async (flightID, refID) => {
        const response = await api.post('/booking/flights/fare-details', { flightID, refID });
        return response.data;
    },

    // Verify price before booking (pre-booking validation)
    ftdVerifyPrice: async (flightID, refID, originalNetfare) => {
        const response = await api.post('/booking/flights/verify-price', { flightID, refID, originalNetfare });
        return response.data;
    },

    // Get validation flags specifically (GST, PAN, Docs)
    ftdGetValidationFlags: async (flightID, refID) => {
        const response = await api.post('/booking/flights/validation-flags', { flightID, refID });
        return response.data;
    },

    // Book flight via FTD with full passenger/GST logic
    ftdBookFlight: async (bookingData) => {
        // bookingData should contain: passenger[], refID, flightID, mobile, email, etc.
        const response = await api.post('/booking/flights/book', bookingData);
        return response.data;
    },

    // Check booking status (manual check)
    ftdGetBookingStatus: async (bookingRef) => {
        const response = await api.get(`/booking/flights/booking-status/${bookingRef}`);
        return response.data;
    },

    // FTD token diagnostics (admin view)
    ftdGetTokenStatus: async () => {
        const response = await api.get('/booking/flights/token-status');
        return response.data;
    },
    
    // Download ticket PDF
    ftdDownloadTicket: async (refID) => {
        const response = await api.get(`/booking/flights/download-ticket/${refID}`);
        return response.data;
    },

    // Get booking details for cancellation/reissue pages
    ftdGetBookingDetails: async (refID) => {
        const response = await api.get(`/booking/flights/details/${refID}`);
        return response.data;
    },

    // Download invoice PDF
    ftdDownloadInvoice: async (refID) => {
        const response = await api.get(`/booking/flights/download-invoice/${refID}`);
        return response.data;
    },

    // Get seat map
    ftdGetSeats: async (flightID, refID, passenger) => {
        const response = await api.post('/booking/flights/seats', { flightID, refID, passenger });
        return response.data;
    },

    // Cancel a booking
    ftdCancelFlight: async (cancelData) => {
        const response = await api.post('/booking/flights/cancel', cancelData);
        return response.data;
    },

    // Reschedule a booking
    ftdReschedule: async (reissueData) => {
        const response = await api.post('/booking/flights/reschedule', reissueData);
        return response.data;
    },

    acceptRescheduleQuote: async (rescheduleId) => {
        const response = await api.post('/booking/flights/accept-reschedule-quote', { rescheduleId });
        return response.data;
    },

    // Submit Group Fare
    submitGroupFare: async (fareData) => {
        const response = await api.post('/booking/group-fare', fareData);
        return response.data;
    },

    // Get fare rules
    ftdGetFareRules: async (flightID) => {
        const response = await api.post('/booking/flights/fare-rules', { flightID });
        return response.data;
    },

    // =============================================
    // AIRPORT SEARCH
    // =============================================
    searchAirports: async (query) => {
        const response = await api.get('/booking/airports/search', { params: { query }});
        return response.data;
    },

    getPopularAirports: async () => {
        const response = await api.get('/booking/airports/popular');
        return response.data;
    },

    // Search flights (Migrated to use production FTD POST)
    searchFlights: async (from, to, date, passengers = { adt: 1, chd: 0, inf: 0 }) => {
        const payload = {
            depCity: from.toUpperCase(),
            arrCity: to.toUpperCase(),
            onDate: date.replace(/-/g, ''), // FTD likes YYYYMMDD
            adt: passengers.adt || 1,
            chd: passengers.chd || 0,
            inf: passengers.inf || 0
        };
        const response = await api.post('/booking/flights/search', payload);
        return response.data;
    },
    bookFlight: async (flightId, passengerDetails) => {
        const response = await api.post('/booking/flights/book', { flightId, passengerDetails });
        return response.data;
    },
    createFlightOrder: async (flightId, amount) => {
        const response = await api.post('/booking/flights/create-order', { flightId, amount });
        return response.data;
    },
    payFromWallet: async (flightId, bookingData) => {
        const response = await api.post('/booking/flights/pay-wallet', { flightId, ...bookingData });
        return response.data;
    },

    // =============================================
    // GENERIC (Hotels, Buses, Trains)
    // =============================================
    searchGeneric: async (type, params) => {
        const response = await api.get(`/booking/${type}s/search`, { params });
        return response.data;
    },
    bookGeneric: async (type, itemId, passengerDetails) => {
        const response = await api.post(`/booking/${type}s/book`, { itemId, passengerDetails });
        return response.data;
    },
    getAgentHistory: async (params = {}) => {
        const response = await api.get('/bookings/history/agent', { params });
        return response.data;
    },
    createServiceRequest: async (data) => {
        const response = await api.post('/bookings/service-request', data);
        return response.data;
    }
};


export const adminService = {
    adminLogin: async (email, password) => {
        const response = await api.post('/admin/login', { email, password });
        if (response.data.data && response.data.data.token) {
            localStorage.setItem('adminToken', response.data.data.token);
            localStorage.setItem('adminInfo', JSON.stringify(response.data.data));
        }
        return response.data;
    },
    adminLogout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
    },
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },
    getAnalytics: async (params) => {
        const response = await api.get('/admin/analytics', { params });
        return response.data;
    },
    getGlobalSettings: async () => {
        const response = await api.get('/admin/settings');
        return response.data;
    },
    updateGlobalSettings: async (settings) => {
        const response = await api.put('/admin/settings', settings);
        return response.data;
    },
    updateKyc: async (agentId, data) => {
        const response = await api.put(`/admin/agents/${agentId}/approve`, data);
        return response.data;
    },
    getAgents: async (search = '') => {
        const response = await api.get('/admin/agents', { params: { search, limit: 100 } });
        return response.data;
    },
    searchAgentByCode: async (agentCode) => {
        const response = await api.get('/admin/agents', { params: { search: agentCode, limit: 50 } });
        return response.data;
    },
    deleteAgent: async (agentId) => {
        const response = await api.delete(`/admin/agents/${agentId}`);
        return response.data;
    },
    toggleBlockAgent: async (agentId) => {
        const response = await api.patch(`/admin/agents/${agentId}/toggle-block`);
        return response.data;
    },
    updateAgent: async (agentId, agentData) => {
        // Check if agentData is FormData, if not it might be a regular object
        const response = await api.put(`/admin/agents/${agentId}`, agentData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    createAgent: async (agentData) => {
        const response = await api.post('/admin/agents', agentData);
        return response.data;
    },
    adjustAgentWallet: async (data) => {
        const response = await api.post('/admin/agents/adjust-wallet', data);
        return response.data;
    },
    getPromotions: async () => {
        const response = await api.get('/admin/promotions');
        return response.data;
    },
    createPromotion: async (promotionData) => {
        const response = await api.post('/admin/promotions', promotionData);
        return response.data;
    },
    updatePromotion: async (id, promotionData) => {
        const response = await api.put(`/admin/promotions/${id}`, promotionData);
        return response.data;
    },
    deletePromotion: async (id) => {
        const response = await api.delete(`/admin/promotions/${id}`);
        return response.data;
    },
    getSubAgents: async () => {
        const response = await api.get('/admin/sub-agents');
        return response.data;
    },
    getSubAgentStats: async () => {
        const response = await api.get('/admin/sub-agents/stats');
        return response.data;
    },
    getBookings: async (page = 1, limit = 50, status = '', agentId = '', serviceType = '') => {
        const response = await api.get('/admin/bookings/history/all', { params: { page, limit, status, agentId, serviceType } });
        return response.data;
    },
    getCommissions: async () => {
        const response = await api.get('/admin/commissions');
        return response.data;
    },
    updateCommission: async (data) => {
        const response = await api.post('/admin/commissions', data);
        return response.data;
    },
    getTickets: async () => {
        const response = await api.get('/admin/tickets');
        return response.data;
    },
    replyTicket: async (id, message, status) => {
        const response = await api.post(`/admin/tickets/${id}/reply`, { message, status });
        return response.data;
    },
    getMarkups: async () => {
        const response = await api.get('/admin/markups');
        return response.data;
    },
    updateMarkup: async (data) => {
        const response = await api.post('/admin/markups', data);
        return response.data;
    },
    deleteMarkup: async (id) => {
        const response = await api.delete(`/admin/markups/${id}`);
        return response.data;
    },
    getTaxes: async () => {
        const response = await api.get('/admin/taxes');
        return response.data;
    },
    createTax: async (data) => {
        const response = await api.post('/admin/taxes', data);
        return response.data;
    },
    updateTax: async (id, data) => {
        const response = await api.put(`/admin/taxes/${id}`, data);
        return response.data;
    },
    deleteTax: async (id) => {
        const response = await api.delete(`/admin/taxes/${id}`);
        return response.data;
    },
    getCoupons: async () => {
        const response = await api.get('/admin/coupons');
        return response.data;
    },
    createCoupon: async (data) => {
        const response = await api.post('/admin/coupons/create', data);
        return response.data;
    },
    updateCoupon: async (id, data) => {
        const response = await api.put(`/admin/coupons/${id}`, data);
        return response.data;
    },
    deleteCoupon: async (id) => {
        const response = await api.delete(`/admin/coupons/${id}`);
        return response.data;
    },
    // Holiday Package Management
    getHolidayPackages: async () => {
        const response = await api.get('/holidays');
        return response.data;
    },
    createHolidayPackage: async (formData) => {
        const response = await api.post('/admin/holidays', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateHolidayPackage: async (id, formData) => {
        const response = await api.put(`/admin/holidays/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteHolidayPackage: async (id) => {
        const response = await api.delete(`/admin/holidays/${id}`);
        return response.data;
    },
    // Visa Package Management
    getVisaPackages: async () => {
        const response = await api.get('/visas');
        return response.data;
    },
    createVisaPackage: async (formData) => {
        const response = await api.post('/admin/visas', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateVisaPackage: async (id, formData) => {
        const response = await api.put(`/admin/visas/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteVisaPackage: async (id) => {
        const response = await api.delete(`/admin/visas/${id}`);
        return response.data;
    },
    // Insurance Package Management
    getInsurancePackages: async () => {
        const response = await api.get('/insurance');
        return response.data;
    },
    createInsurancePackage: async (formData) => {
        const response = await api.post('/admin/insurance', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateInsurancePackage: async (id, formData) => {
        const response = await api.put(`/admin/insurance/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteInsurancePackage: async (id) => {
        const response = await api.delete(`/admin/insurance/${id}`);
        return response.data;
    },
    // Refunds Management
    getRefunds: async (page = 1, limit = 50, status = '') => {
        const response = await api.get('/admin/refunds', { params: { page, limit, status } });
        return response.data;
    },
    processRefund: async (bookingId, airlineRefundAmount, adminDeduction, action = 'PROCESS') => {
        const response = await api.post(`/admin/refunds/${bookingId}/process`, {
            airlineRefundAmount,
            adminDeduction,
            action
        });
        return response.data;
    },
    // Reschedules
    getReschedules: async (page = 1, limit = 50, status = '') => {
        const response = await api.get('/admin/reschedules', { params: { page, limit, status } });
        return response.data;
    },
    provideRescheduleQuote: async (rescheduleId, fareDifference, airlinePenalty, adminMarkup) => {
        const response = await api.post(`/admin/reschedules/${rescheduleId}/quote`, {
            fareDifference,
            airlinePenalty,
            adminMarkup
        });
        return response.data;
    },
    processReschedule: async (rescheduleId) => {
        const response = await api.post(`/admin/reschedules/${rescheduleId}/process`);
        return response.data;
    },
    // Fixed Departure Management
    getFixedDepartureFlights: async () => {
        const response = await api.get('/admin/fixed-departures');
        return response.data;
    },
    createFixedDepartureFlight: async (flightData) => {
        const response = await api.post('/admin/fixed-departures', flightData);
        return response.data;
    },
    updateFixedDepartureFlight: async (id, flightData) => {
        const response = await api.put(`/admin/fixed-departures/${id}`, flightData);
        return response.data;
    },
    deleteFixedDepartureFlight: async (id) => {
        const response = await api.delete(`/admin/fixed-departures/${id}`);
        return response.data;
    },
    getFixedDepartureBookings: async () => {
        const response = await api.get('/admin/fixed-departures/bookings');
        return response.data;
    },
    confirmFixedDepartureBooking: async (id, pnr, ticketNumber) => {
        const response = await api.put(`/admin/fixed-departures/bookings/${id}/confirm`, { pnr, ticketNumber });
        return response.data;
    },
    cancelFixedDepartureBooking: async (id, remarks = '') => {
        const response = await api.put(`/admin/fixed-departures/bookings/${id}/cancel`, { remarks });
        return response.data;
    },
    verifyFixedDepartureBookingPayment: async (id) => {
        const response = await api.put(`/admin/fixed-departures/bookings/${id}/verify-payment`);
        return response.data;
    },
    getSettings: async () => {
        const response = await api.get('/admin/settings');
        return response.data;
    },
    updateSettings: async (settingsData) => {
        const response = await api.put('/admin/settings', settingsData);
        return response.data;
    }
};

export const visaService = {
    getPackages: async (search = '') => {
        const response = await api.get('/visas', { params: { search } });
        return response.data;
    },
    getPackageById: async (id) => {
        const response = await api.get(`/visas/${id}`);
        return response.data;
    }
};

export const insuranceService = {
    getPackages: async (search = '') => {
        const response = await api.get('/insurance', { params: { search } });
        return response.data;
    },
    getPackageById: async (id) => {
        const response = await api.get(`/insurance/${id}`);
        return response.data;
    }
};

export default api;
