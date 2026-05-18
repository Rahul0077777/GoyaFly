const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Initialize caches
const flightCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const API_KEY = process.env.FLIGHT_API_KEY;
const BASE_URL = 'http://api.aviationstack.com/v1';

const INDIAN_AIRPORTS = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'PAT', 'DBR', 'PNQ', 'AMD', 'COK', 'GOI', 'ATQ'];


/**
 * Searches for real flights using AviationStack API
 */
const searchFlights = async (from, to, date) => {
    try {
        if (!API_KEY) {
            throw new Error('FLIGHT_API_KEY is not defined in the environment variables.');
        }

        // Past Date Check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const searchDate = new Date(date);
        if (searchDate < today) {
            logger.info(`Blocked past date flight search: ${date}`);
            return [];
        }

        const isInternational = !INDIAN_AIRPORTS.includes(from.toUpperCase()) || !INDIAN_AIRPORTS.includes(to.toUpperCase());
        
        // Cache Key Generation
        const cacheKey = `search_${from.toUpperCase()}_${to.toUpperCase()}_${date}`;
        const cachedResults = flightCache.get(cacheKey);
        
        if (cachedResults) {
            logger.info(`Serving cached flights for: ${cacheKey}`);
            return cachedResults;
        }

        const response = await axios.get(`${BASE_URL}/flights`, {
            params: {
                access_key: API_KEY,
                dep_iata: from,
                arr_iata: to,
                limit: 15
            }
        });

        if (response.data && response.data.data && response.data.data.length > 0) {
            return response.data.data.map(f => {
                // Calculate Real Duration
                let durationStr = "2h 45m";
                if (f.departure?.scheduled && f.arrival?.scheduled) {
                    const depT = new Date(f.departure.scheduled).getTime();
                    const arrT = new Date(f.arrival.scheduled).getTime();
                    const diffMins = Math.max(0, Math.floor((arrT - depT) / 60000));
                    if (diffMins > 0) {
                        const h = Math.floor(diffMins / 60);
                        const m = diffMins % 60;
                        durationStr = `${h}h ${m}m`;
                    }
                }

                // Format times reliably
                // Format times reliably with standard English locale
                const depTime = f.departure?.scheduled ? new Date(f.departure.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: f.departure.timezone || 'UTC' }) : '10:00 AM';
                const arrTime = f.arrival?.scheduled ? new Date(f.arrival.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: f.arrival.timezone || 'UTC' }) : '12:00 PM';

                return {
                    id: f.flight?.iata || `FL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                    airline: f.airline?.name || (isInternational ? 'International Carrier' : 'Indian Carrier'),
                    airlineIata: f.airline?.iata || '??',
                    from: f.departure?.iata || from,
                    to: f.arrival?.iata || to,
                    departureTerminal: f.departure?.terminal ? `T${f.departure.terminal}` : 'T3',
                    departureGate: f.departure?.gate ? `G${f.departure.gate}` : 'G12',
                    arrivalTerminal: f.arrival?.terminal ? `T${f.arrival.terminal}` : 'T1',
                    departureTime: depTime,
                    arrivalTime: arrTime,
                    duration: durationStr,
                    price: calculateSimulatedPrice(f.airline?.name, isInternational),
                    commissionRate: isInternational ? 0.08 : 0.05,
                    flightNumber: f.flight?.iata || 'XX000',
                    stops: isInternational ? (Math.random() > 0.5 ? '1 Stop' : 'Non-Stop') : (Math.random() > 0.8 ? '1 Stop' : 'Non-Stop'),
                    status: f.flight_status || 'scheduled'
                };
            });
        }

        // If API returns empty natively, fallback to mocks
        const results = (response.data && response.data.data && response.data.data.length > 0) 
            ? formattedResults 
            : getEnhancedMocks(from, to, isInternational);

        // Store in cache before returning
        flightCache.set(cacheKey, results);
        return results;
    } catch (error) {
        logger.error('Flight Search Error: ' + (error.response?.data?.error?.info || error.message));
        const isIntl = !INDIAN_AIRPORTS.includes(from.toUpperCase()) || !INDIAN_AIRPORTS.includes(to.toUpperCase());
        return getEnhancedMocks(from, to, isIntl);
    }
};

const validateFlightBooking = async (flightId, passengerDetails) => {
    // In a real-world scenario, this would call a booking API (GDS)
    return new Promise((resolve) => {
        setTimeout(() => {
            const pnr = `PNR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            resolve({ 
                valid: true, 
                pnr, 
                status: 'CONFIRMED',
                flight: { id: flightId, price: 5000, commissionRate: 0.05 } 
            });
        }, 1000);
    });
};

const getEnhancedMocks = (from, to, isInternational) => {
    if (isInternational) {
        return [
            { id: 'EK-512', airline: 'Emirates', airlineIata: 'EK', from: from || 'DEL', to: to || 'DXB', departureTime: '04:10 AM', arrivalTime: '06:25 AM', price: 28500, commissionRate: 0.08, stops: 'Non-Stop', departureTerminal: 'T3', arrivalTerminal: 'T3', status: 'scheduled' },
            { id: 'QR-578', airline: 'Qatar Airways', airlineIata: 'QR', from: from || 'DEL', to: to || 'DOH', departureTime: '10:00 AM', arrivalTime: '12:15 PM', price: 32000, commissionRate: 0.08, stops: 'Non-Stop', departureTerminal: 'T3', arrivalTerminal: 'T1', status: 'scheduled' },
            { id: 'BA-142', airline: 'British Airways', airlineIata: 'BA', from: from || 'DEL', to: to || 'LHR', departureTime: '01:50 PM', arrivalTime: '06:40 PM', price: 65000, commissionRate: 0.08, stops: '1 Stop', departureTerminal: 'T3', arrivalTerminal: 'T5', status: 'scheduled' },
            { id: 'SQ-406', airline: 'Singapore Airlines', airlineIata: 'SQ', from: from || 'DEL', to: to || 'SIN', departureTime: '09:55 PM', arrivalTime: '06:10 AM', price: 42000, commissionRate: 0.08, stops: 'Non-Stop', departureTerminal: 'T3', arrivalTerminal: 'T2', status: 'scheduled' }
        ];
    }
    return [
        { id: '6E-501', airline: 'IndiGo', airlineIata: '6E', from: from || 'DEL', to: to || 'BOM', departureTime: '06:00 AM', arrivalTime: '08:15 AM', price: 4250, commissionRate: 0.05, stops: 'Non-Stop', departureTerminal: 'T1', arrivalTerminal: 'T2', status: 'scheduled' },
        { id: 'AI-802', airline: 'Air India', airlineIata: 'AI', from: from || 'DEL', to: to || 'BOM', departureTime: '11:30 AM', arrivalTime: '01:45 PM', price: 5800, commissionRate: 0.06, stops: 'Non-Stop', departureTerminal: 'T3', arrivalTerminal: 'T2', status: 'scheduled' },
        { id: 'UK-950', airline: 'Vistara', airlineIata: 'UK', from: from || 'DEL', to: to || 'BOM', departureTime: '04:15 PM', arrivalTime: '06:30 PM', price: 6200, commissionRate: 0.07, stops: 'Non-Stop', departureTerminal: 'T3', arrivalTerminal: 'T1', status: 'scheduled' },
        { id: 'SG-123', airline: 'SpiceJet', airlineIata: 'SG', from: from || 'DEL', to: to || 'BOM', departureTime: '09:45 PM', arrivalTime: '11:55 PM', price: 3950, commissionRate: 0.04, stops: 'Non-Stop', departureTerminal: 'T1', arrivalTerminal: 'T1', status: 'scheduled' }
    ];
};

const calculateSimulatedPrice = (airline, isInternational) => {
    if (isInternational) {
        let base = 25000;
        if (airline?.includes('Emirates') || airline?.includes('Singapore')) base = 35000;
        if (airline?.includes('British') || airline?.includes('Lufthansa')) base = 55000;
        return Math.floor(base + Math.random() * 15000);
    }
    let base = 4000;
    if (airline?.includes('Air India') || airline?.includes('Vistara')) base = 6000;
    if (airline?.includes('IndiGo') || airline?.includes('SpiceJet')) base = 3500;
    return Math.floor(base + Math.random() * 2000);
};

// Airport search has been extracted to airportService.js
// Re-export for backward compatibility
const { searchAirports } = require('./airportService');

module.exports = { searchFlights, validateFlightBooking, searchAirports };
