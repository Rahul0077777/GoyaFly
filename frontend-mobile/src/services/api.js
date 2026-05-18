import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetToAuth } from './navigationService';

// Current Machine IP: 192.168.1.15 (found via ipconfig)
const API_URL = 'http://192.168.1.15:5000/api';
export const BASE_URL = 'http://192.168.1.15:5000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    async (config) => {
        const agentToken = await AsyncStorage.getItem('agentToken');
        const adminToken = await AsyncStorage.getItem('adminToken');
        
        const token = config.url.includes('/admin/') ? adminToken : (agentToken || adminToken);
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const requestUrl = error.config?.url || '';
        const isLoginAttempt = requestUrl.includes('/login');
        
        // Handle 403 Blocked specifically (even on login)
        if (error.response?.status === 403 && error.response.data?.message?.toLowerCase().includes('blocked')) {
            const { Alert } = require('react-native');
            Alert.alert('Access Denied', error.response.data.message);
        }

        if (!isLoginAttempt && error.response && (error.response.status === 401 || error.response.status === 403)) {
            const isAdminRequest = requestUrl.includes('/admin/');

            if (isAdminRequest) {
                await AsyncStorage.removeItem('adminToken');
                await AsyncStorage.removeItem('adminInfo');
            } else {
                await AsyncStorage.removeItem('agentToken');
                await AsyncStorage.removeItem('agentInfo');
            }
            resetToAuth();
        }
        return Promise.reject(error);
    }
);

export const authService = {
    loginAgent: async (credentials) => {
        const payload = { emailAddress: credentials.email, password: credentials.password };
        const response = await api.post('/agents/login', payload);
        return response.data;
    },
    loginAdmin: async (credentials) => {
        const response = await api.post('/admin/login', credentials);
        return response.data;
    },
    agentRegister: async (formData) => {
        const response = await api.post('/agents/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    agentKycResubmit: async (formData) => {
        const response = await api.post('/agents/resubmit-kyc', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/agents/profile');
        return response.data;
    },
    updateProfile: async (profileData) => {
        const response = await api.put('/agents/profile', profileData);
        return response.data;
    }
};

export const agentService = {
    getDashboardStats: async () => {
        const response = await api.get('/agents/dashboard/stats');
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/agents/profile');
        return response.data;
    },
    updateProfile: async (data) => {
        const response = await api.put('/agents/profile', data);
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
    getEarningsReport: async () => {
        const response = await api.get('/agents/earnings-report');
        return response.data;
    },
    // --- TICKETS ---
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
    // --- NOTIFICATIONS ---
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
    bookFlight: async (flightId, passengers) => {
        const response = await api.post('/fixed-departures/book', { flightId, passengers });
        return response.data;
    },
    getMyBookings: async () => {
        const response = await api.get('/fixed-departures/my-bookings');
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

export const bookingService = {
    BASE_URL: 'http://192.168.1.15:5000',
    ftdSearchFlights: async (searchParams = {}) => {
        if (!searchParams || typeof searchParams !== 'object') searchParams = {};
        const TRIP_TYPE_MAP = { oneWay: 0, roundTrip: 1, multiCity: 2, '0': 0, '1': 1, '2': 2, 0: 0, 1: 1, 2: 2 };
        const formatDateFTD = (d) => typeof d === 'string' && d ? d.replace(/-/g, '') : '';
        const pax = searchParams.passengers || {};
        const adt = Number(pax.adt || searchParams.adt || 1);
        const chd = Number(pax.chd || searchParams.chd || 0);
        const inf = Number(pax.inf || searchParams.inf || 0);
        const rawTripType = searchParams.tripType ?? 0;
        const tripTypeInt = TRIP_TYPE_MAP[rawTripType] ?? 0;
        const depCityStr = typeof searchParams.from === 'object' && searchParams.from ? (searchParams.from.code || '') : (searchParams.from || searchParams.depCity || '');
        const arrCityStr = typeof searchParams.to === 'object' && searchParams.to ? (searchParams.to.code || '') : (searchParams.to || searchParams.arrCity || '');
        const payload = {
            depCity: String(depCityStr).toUpperCase(),
            arrCity: String(arrCityStr).toUpperCase(),
            onDate:  formatDateFTD(searchParams.date || searchParams.onDate),
            reDate:  tripTypeInt === 1 ? formatDateFTD(searchParams.returnDate || searchParams.reDate || '') : '',
            tripType: tripTypeInt,
            adt, chd, inf,
            cabin:    searchParams.cabin    || 'E',
            fareType: searchParams.fareType || 'A',
        };
        const response = await api.post('/booking/flights/search', payload);
        return response.data;
    },
    ftdGetFareDetails: async (flightID, refID) => {
        const response = await api.post('/booking/flights/fare-details', { flightID, refID });
        return response.data;
    },
    ftdVerifyPrice: async (flightID, refID, originalNetfare) => {
        const response = await api.post('/booking/flights/verify-price', { flightID, refID, originalNetfare });
        return response.data;
    },
    ftdBookFlight: async (bookingData = {}) => {
        if (!bookingData || typeof bookingData !== 'object') bookingData = {};
        const response = await api.post('/booking/flights/book', bookingData);
        return response.data;
    },
    ftdGetBookingStatus: async (bookingRef) => {
        const response = await api.get(`/booking/flights/booking-status/${bookingRef}`);
        return response.data;
    },
    ftdGetFareRules: async (flightID) => {
        const response = await api.post('/booking/flights/fare-rules', { flightID });
        return response.data;
    },
    ftdCancelFlight: async (cancelData) => {
        const response = await api.post('/booking/flights/cancel', cancelData);
        return response.data;
    },
    ftdReschedule: async (reissueData) => {
        const response = await api.post('/booking/flights/reschedule', reissueData);
        return response.data;
    },
    ftdDownloadTicket: async (refID) => {
        const response = await api.get(`/booking/flights/download-ticket/${refID}`);
        return response.data;
    },
    ftdDownloadInvoice: async (refID) => {
        const response = await api.get(`/booking/flights/download-invoice/${refID}`);
        return response.data;
    },
    ftdGetBookingDetails: async (refID) => {
        const response = await api.get(`/booking/flights/details/${refID}`);
        return response.data;
    },
    ftdGetSeats: async (flightID, refID, passenger) => {
        const response = await api.post('/booking/flights/seats', { flightID, refID, passenger });
        return response.data;
    },
    submitGroupFare: async (fareData) => {
        const response = await api.post('/booking/group-fare', fareData);
        return response.data;
    },
    searchAirports: async (query) => {
        const response = await api.get('/booking/airports/search', { params: { query } });
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
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },
    getAgents: async (page = 1, limit = 50, search = '') => {
        const response = await api.get('/admin/agents', { params: { page, limit, search } });
        return response.data;
    },
    updateAgent: async (agentId, agentData) => {
        const response = await api.put(`/admin/agents/${agentId}`, agentData);
        return response.data;
    },
    toggleBlockAgent: async (agentId) => {
        const response = await api.patch(`/admin/agents/${agentId}/toggle-block`);
        return response.data;
    },
    // --- MARKUP ENGINE ---
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
    // --- TAX ENGINE ---
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
    // --- COUPON ENGINE ---
    getCoupons: async () => {
        const response = await api.get('/admin/coupons');
        return response.data;
    },
    createCoupon: async (data) => {
        const response = await api.post('/admin/coupons/create', data);
        return response.data;
    },
    deleteCoupon: async (id) => {
        const response = await api.delete(`/admin/coupons/${id}`);
        return response.data;
    },
    // --- OTB & BOOKINGS ---
    getAllOtbRequests: async () => {
        const response = await api.get('/admin/otb/requests');
        return response.data;
    },
    updateOtbStatus: async (requestId, data) => {
        const response = await api.put(`/admin/otb/requests/${requestId}`, data);
        return response.data;
    },
    getBookings: async (page = 1, limit = 50, status = '', agentId = '', serviceType = '') => {
        const response = await api.get('/admin/bookings/history/all', { params: { page, limit, status, agentId, serviceType } });
        return response.data;
    },
    // --- TICKETS (Admin) ---
    adminGetAllTickets: async () => {
        const response = await api.get('/admin/tickets');
        return response.data;
    },
    adminReplyTicket: async (id, replyData) => {
        const response = await api.post(`/admin/tickets/${id}/reply`, replyData);
        return response.data;
    },
    // --- WALLET CONTROL ---
    adjustAgentWallet: async (agentId, amount, type, remark) => {
        const response = await api.post('/admin/agents/adjust-wallet', { agentId, amount, type, remark });
        return response.data;
    },
    // --- HOLIDAY PACKAGES ---
    getHolidayPackages: async () => {
        const response = await api.get('/admin/holidays');
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
    // --- VISA PACKAGES ---
    getVisaPackages: async () => {
        const response = await api.get('/admin/visas');
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
    // --- REFUNDS ---
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
    // --- RESCHEDULES ---
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
    // --- FIXED DEPARTURE (Admin) ---
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
    cancelFixedDepartureBooking: async (id) => {
        const response = await api.put(`/admin/fixed-departures/bookings/${id}/cancel`);
        return response.data;
    },
    verifyFixedDepartureBookingPayment: async (id) => {
        const response = await api.put(`/admin/fixed-departures/bookings/${id}/verify-payment`);
        return response.data;
    }
};

export const otbService = {
    apply: async (formData) => {
        const response = await api.post('/otb/apply', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getAgentStatus: async () => {
        const response = await api.get('/otb/agent-status');
        return response.data;
    }
};

export const customerAuthService = {
    sendOTP: async (mobileNumber) => {
        const response = await api.post('/customers/send-otp', { mobileNumber });
        return response.data;
    },
    verifyOTP: async (mobileNumber, otp) => {
        const response = await api.post('/customers/verify-otp', { mobileNumber, otp });
        if (response.data.token) {
            await AsyncStorage.setItem('customerToken', response.data.token);
            await AsyncStorage.setItem('customerData', JSON.stringify(response.data.customer));
        }
        return response.data;
    }
};

export default api;
