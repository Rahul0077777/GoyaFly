const mongoose = require('mongoose');
const Booking = require('../Models/Booking.model');
const Agent = require('../Models/Agent.model');
const Transaction = require('../Models/Transaction.model');

// Import all our mock travel services
const { searchFlights, validateFlightBooking } = require('../services/flightService');
const { searchAirports } = require('../services/airportService');
const { searchHotels, validateHotelBooking } = require('../services/hotelService');
const { searchBuses, validateBusBooking } = require('../services/busService');
const { searchTrains, validateTrainBooking } = require('../services/trainService');

// ==========================================
// 1. FLIGHT SPECIFIC CONTROLLERS
// ==========================================

// @desc    Search for flights
// @route   GET /api/bookings/flights/search
const getFlights = async (req, res, next) => {
    try {
        const { from, to, date } = req.query;
        const flights = await searchFlights(from, to, date);
        res.status(200).json({ success: true, data: flights });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Search for airports
// @route   GET /api/bookings/airports/search
const getAirports = async (req, res, next) => {
    try {
        const { query } = req.query;
        const airports = await searchAirports(query);
        res.status(200).json({ success: true, data: airports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Book a flight and deduct wallet
// @route   POST /api/bookings/flights/book
const bookFlight = async (req, res, next) => {
    const { flightId, passengerDetails, razorpayPaymentId, travelDate, fromCity, toCity, airline } = req.body;
    
    try {
        // 1. Validate Flight
        const { flight, pnr } = await validateFlightBooking(flightId, passengerDetails);
        
        // 2. Check Agent Balance
        const agent = await Agent.findById(req.user._id);
        if (!agent) {
             return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        const commission = flight.price * flight.commissionRate;
        const totalCostToAgent = flight.price - commission;

        // 2b. Force Wallet Balance Check
        if (agent.walletBalance < totalCostToAgent) {
             return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        // 3. Process Booking (Create Booking Record)
        const booking = await Booking.create({
            agentId: agent._id,
            serviceType: 'FLIGHT',
            providerReference: pnr || `PNR-${Math.floor(100000 + Math.random() * 900000)}`,
            totalCost: flight.price,
            commissionEarned: commission,
            status: 'CONFIRMED',
            passengerDetails: passengerDetails,
            travelDate: travelDate || new Date(),
            fromCity: fromCity || 'Unknown',
            toCity: toCity || 'Unknown',
            airline: airline || 'Flight',
            paymentMethod: 'WALLET'
        });

        // 4. Update Agent Balance (Always Wallet for Services)
        agent.walletBalance -= totalCostToAgent;
        await agent.save();

        // 5. Create Ledger Transaction
        await Transaction.create({
            agentId: agent._id,
            transactionType: 'DEBIT',
            purpose: 'TICKET_BOOKING',
            amount: totalCostToAgent,
            balanceAfterTransaction: agent.walletBalance,
            referenceId: booking._id,
            status: 'SUCCESS',
            paymentMethod: 'WALLET'
        });

        res.status(201).json({
            success: true,
            data: booking,
            newBalance: agent.walletBalance
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. GENERIC SEARCH & BOOKING FACTORIES
// ==========================================

// Generic Search Handler
const searchGeneric = (searchFn) => async (req, res, next) => {
    try {
        const results = await searchFn(req.query.from || req.query.city, req.query.to || req.query.checkIn, req.query.date || req.query.checkOut);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getHotels = searchGeneric(searchHotels);
const getBuses = searchGeneric(searchBuses);
const getTrains = searchGeneric(searchTrains);

// Generic Book Handler
const bookGeneric = (validateFn, serviceType) => async (req, res, next) => {
    const { itemId, passengerDetails, razorpayPaymentId, travelDate } = req.body;
    try {
        const validationResult = await validateFn(itemId);
        
        // Extract the actual item from the validation result (e.g., the hotel, bus, or train object)
        const itemKeys = Object.keys(validationResult).filter(k => k !== 'valid' && k !== 'pnr' && k !== 'status');
        const item = validationResult[itemKeys[0]];
        
        const agent = await Agent.findById(req.user._id);
        if(!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        const price = item.price || item.pricePerNight; // Handle different naming conventions
        const commission = price * (item.commissionRate || 0);
        const totalCostToAgent = price - commission;

        if (!razorpayPaymentId && agent.walletBalance < totalCostToAgent) {
             return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        const pnrRef = validationResult.pnr || `${serviceType.toUpperCase().substring(0,3)}${Math.floor(100000 + Math.random() * 900000)}`;

        const booking = await Booking.create({
            agentId: agent._id,
            serviceType: serviceType.toUpperCase(),
            providerReference: pnrRef,
            totalCost: price,
            commissionEarned: commission,
            status: 'CONFIRMED',
            passengerDetails: passengerDetails,
            travelDate: travelDate || new Date()
        });

        if (!razorpayPaymentId) {
            agent.walletBalance -= totalCostToAgent;
            await agent.save();
        }

        await Transaction.create({
            agentId: agent._id,
            transactionType: razorpayPaymentId ? 'CREDIT' : 'DEBIT',
            purpose: 'TICKET_BOOKING',
            amount: totalCostToAgent,
            balanceAfterTransaction: agent.walletBalance,
            referenceId: booking._id,
            status: 'SUCCESS',
            paymentMethod: razorpayPaymentId ? 'RAZORPAY' : 'WALLET'
        });

        res.status(201).json({ success: true, data: booking, newBalance: agent.walletBalance });
    } catch (error) {
         res.status(400).json({ success: false, message: error.message });
    }
};

const bookHotel = bookGeneric(validateHotelBooking, 'Hotel');
const bookBus = bookGeneric(validateBusBooking, 'Bus');
const bookTrain = bookGeneric(validateTrainBooking, 'Train');

// ==========================================
// 3. BOOKING HISTORY CONTROLLERS
// ==========================================

const getAllBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, agentId, serviceType, search } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) query.status = status;
        if (agentId) query.agentId = agentId;
        if (serviceType) query.serviceType = serviceType.toUpperCase();
        if (search) {
            query.$or = [
                { providerReference: { $regex: search, $options: 'i' } },
                { pnr: { $regex: search, $options: 'i' } }
            ];
        }

        const bookingsRaw = await Booking.find(query)
            .populate('agentId', 'agencyName emailAddress')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // JIT Repair/Mapping for Admin View
        const bookings = bookingsRaw.map(b => {
            const booking = b.toObject();
                        if (!booking.fromCity || booking.fromCity === 'Unknown' || booking.fromCity === '') {
                // Recover from flightDetails (Smart Dictionary-Aware Parsing)
                let segments = booking.flightDetails;
                let flattened = [];

                if (segments) {
                    if (Array.isArray(segments)) {
                        const first = segments[0];
                        if (first?.Onward || first?.Return) {
                            if (first.Onward) Object.keys(first.Onward).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(first.Onward[k]));
                            if (first.Return) Object.keys(first.Return).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(first.Return[k]));
                        } else {
                            flattened = segments;
                        }
                    } else if (typeof segments === 'object') {
                        if (segments.Onward) Object.keys(segments.Onward).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(segments.Onward[k]));
                        if (segments.Return) Object.keys(segments.Return).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(segments.Return[k]));
                    }
                }

                if (flattened.length > 0) {
                    const first = flattened[0];
                    const last = flattened[flattened.length - 1];
                    booking.fromCity = first.depCName || first.depCode || 'Sector';
                    booking.toCity = last.arrCName || last.arrCode || 'Destination';
                    booking.airline = first.airName || first.airline || 'Flight';
                } else {
                    booking.fromCity = booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1).toLowerCase();
                    booking.toCity = 'Booking';
                }
            }
            if (!booking.airline || booking.airline === 'Flight' || booking.airline === '') {
                booking.airline = booking.serviceType === 'FLIGHT' ? 'Airline' : booking.serviceType;
            }
            return booking;
        });

        const total = await Booking.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get bookings for a specific agent (Agent Dashboard)
const getAgentBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, serviceType, fromDate, toDate, bookingId } = req.query;
        const skip = (page - 1) * limit;

        const query = { agentId: req.user._id };
        
        if (status) query.status = status;
        if (serviceType && serviceType !== 'ALL') query.serviceType = serviceType.toUpperCase();
        if (bookingId) {
            query.$or = [
                { providerReference: { $regex: bookingId, $options: 'i' } },
                { pnr: { $regex: bookingId, $options: 'i' } }
            ];
            if (mongoose.Types.ObjectId.isValid(bookingId)) {
                query.$or.push({ _id: bookingId });
            }
        }

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const bookingsRaw = await Booking.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // JIT Repair/Mapping for Agent View
        const RescheduleRequest = require('../Models/RescheduleRequest.model');
        const bookingIds = bookingsRaw.map(b => b._id);
        const reschedules = await RescheduleRequest.find({ bookingId: { $in: bookingIds } });

        const bookings = bookingsRaw.map(b => {
            const booking = b.toObject();
            
            // Attach reschedule request if exists
            booking.rescheduleRequest = reschedules.find(r => r.bookingId.toString() === b._id.toString());
            
                        if (!booking.fromCity || booking.fromCity === 'Unknown' || booking.fromCity === '') {
                // Recover from flightDetails (Smart Dictionary-Aware Parsing)
                let segments = booking.flightDetails;
                let flattened = [];

                if (segments) {
                    if (Array.isArray(segments)) {
                        const first = segments[0];
                        if (first?.Onward || first?.Return) {
                            if (first.Onward) Object.keys(first.Onward).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(first.Onward[k]));
                            if (first.Return) Object.keys(first.Return).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(first.Return[k]));
                        } else {
                            flattened = segments;
                        }
                    } else if (typeof segments === 'object') {
                        if (segments.Onward) Object.keys(segments.Onward).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(segments.Onward[k]));
                        if (segments.Return) Object.keys(segments.Return).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(segments.Return[k]));
                    }
                }

                if (flattened.length > 0) {
                    const first = flattened[0];
                    const last = flattened[flattened.length - 1];
                    booking.fromCity = first.depCName || first.depCode || 'Sector';
                    booking.toCity = last.arrCName || last.arrCode || 'Destination';
                    booking.airline = first.airName || first.airline || 'Flight';
                } else {
                    booking.fromCity = booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1).toLowerCase();
                    booking.toCity = 'Booking';
                }
            }
            if (!booking.airline || booking.airline === 'Flight' || booking.airline === '') {
                booking.airline = (booking.serviceType === 'FLIGHT' || booking.serviceType === 'Flight') ? 'Carrier' : booking.serviceType;
            }
            return booking;
        });

        const total = await Booking.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a Razorpay order for a flight booking
// @route   POST /api/bookings/flights/create-order
const createFlightOrder = async (req, res, next) => {
    const { flightId, amount } = req.body;
    try {
        const { createRazorpayOrder } = require('../services/paymentService');
        const order = await createRazorpayOrder(amount, 'INR');
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Pay for a flight using agent wallet
// @route   POST /api/bookings/flights/pay-wallet
const payFromWallet = async (req, res, next) => {
    const { flightId, passengerName, email, mobile, allPassengers, travelDate, totalAmount, fromCity, toCity, airline } = req.body;
    
    try {
        const agent = await Agent.findById(req.user._id);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

        if (agent.walletBalance < totalAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        // Validate and create booking
        const { validateFlightBooking } = require('../services/flightService');
        const { pnr } = await validateFlightBooking(flightId, allPassengers[0]);

        const booking = await Booking.create({
            agentId: agent._id,
            serviceType: 'FLIGHT',
            providerReference: pnr || `PNR-W${Math.floor(100000 + Math.random() * 900000)}`,
            totalCost: totalAmount,
            commissionEarned: 0, // Simplified for now
            status: 'CONFIRMED',
            passengerDetails: { name: passengerName, email, mobile, passengers: allPassengers },
            travelDate: travelDate || new Date(),
            fromCity: fromCity || 'Unknown',
            toCity: toCity || 'Unknown',
            airline: airline || 'Flight',
            paymentMethod: 'WALLET'
        });

        agent.walletBalance -= totalAmount;
        await agent.save();

        await Transaction.create({
            agentId: agent._id,
            transactionType: 'DEBIT',
            purpose: 'TICKET_BOOKING',
            amount: totalAmount,
            balanceAfterTransaction: agent.walletBalance,
            referenceId: booking._id,
            status: 'SUCCESS',
            paymentMethod: 'WALLET'
        });

        res.status(201).json({ success: true, data: booking, newBalance: agent.walletBalance });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get top airports for search suggestions
// @desc    Update booking status (Admin)
// @route   PUT /api/admin/bookings/:id/status
const updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.status(200).json({ success: true, message: 'Booking status updated', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get top airports for search suggestions
// @route   GET /api/bookings/airports/popular
const getPopularAirports = async (req, res, next) => {
    try {
        const popular = [
            { code: 'DEL', city: 'New Delhi', label: 'Indira Gandhi Intl (DEL)', country: 'India' },
            { code: 'BOM', city: 'Mumbai', label: 'Chhatrapati Shivaji (BOM)', country: 'India' },
            { code: 'DXB', city: 'Dubai', label: 'Dubai Intl (DXB)', country: 'UAE' },
            { code: 'BLR', city: 'Bengaluru', label: 'Kempegowda Intl (BLR)', country: 'India' },
            { code: 'CCU', city: 'Kolkata', label: 'Netaji Subhash (CCU)', country: 'India' },
            { code: 'LHR', city: 'London', label: 'Heathrow (LHR)', country: 'UK' },
            { code: 'SIN', city: 'Singapore', label: 'Changi (SIN)', country: 'Singapore' }
        ];
        res.status(200).json({ success: true, data: popular });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a manual service request (Holidays, Visa, Insurance)
// @route   POST /api/bookings/service-request
const createServiceRequest = async (req, res, next) => {
    try {
        const { serviceType, item, travelDate, paxCount, paxDetails, notes } = req.body;
        
        if (!serviceType || !item) {
            return res.status(400).json({ success: false, message: 'Service type and item details are required.' });
        }

        const agent = await Agent.findById(req.user._id);
        if (!agent) {
             return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        const price = (item.price || 0) * (paxCount?.adults || 1);
        const commission = price * 0.05; // Default 5% commission for offline requests

        const booking = await Booking.create({
            agentId: agent._id,
            serviceType: serviceType.toUpperCase(),
            providerReference: `REQ-${serviceType.toUpperCase().substring(0,3)}-${Date.now().toString().slice(-6)}`,
            totalCost: price,
            commissionEarned: commission,
            status: 'PENDING',
            passengerDetails: { 
                ...paxDetails, 
                paxCount, 
                item 
            },
            travelDate: travelDate || new Date(),
            airline: item.title || item.country || 'Custom Service',
            fromCity: serviceType === 'HOLIDAY' ? 'Package' : serviceType,
            toCity: item.title || item.country || 'Booking',
            remark: notes || ''
        });

        res.status(201).json({
            success: true,
            message: 'Booking request submitted successfully. Our team will contact you shortly.',
            data: booking
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const acceptRescheduleQuote = async (req, res, next) => {
    try {
        const { rescheduleId } = req.body;
        const RescheduleRequest = require('../Models/RescheduleRequest.model');
        
        const request = await RescheduleRequest.findById(rescheduleId).populate('bookingId');
        if (!request) return res.status(404).json({ success: false, message: 'Reschedule request not found' });

        if (request.agentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to this quote.' });
        }

        if (request.status !== 'QUOTE_PROVIDED') {
            return res.status(400).json({ success: false, message: 'Quote is not available or already accepted.' });
        }

        const agent = await Agent.findById(req.user._id);
        const totalAmount = request.quoteDetails.totalAmount;

        if (agent.walletBalance < totalAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance to accept this reschedule quote.' });
        }

        // Deduct Wallet
        agent.walletBalance -= totalAmount;
        await agent.save();

        // Ledger
        await Transaction.create({
            agentId: agent._id,
            transactionType: 'DEBIT',
            purpose: 'RESCHEDULE_FEE',
            amount: totalAmount,
            balanceAfterTransaction: agent.walletBalance,
            referenceId: request._id, // linking to reschedule request
            status: 'SUCCESS',
            paymentMethod: 'WALLET',
            remark: `Reschedule Quote Accepted. Fare Diff: ₹${request.quoteDetails.fareDifference}, Penalty: ₹${request.quoteDetails.airlinePenalty}, Markup: ₹${request.quoteDetails.adminMarkup} | PNR: ${request.bookingId.pnr || request.bookingId.providerReference}`
        });

        request.status = 'ACCEPTED';
        await request.save();

        // Notify Admin (optional but good practice)
        try {
            const { sendEmail } = require('../utils/notifier');
            await sendEmail(
                process.env.ADMIN_EMAIL || 'admin@goyafly.com',
                `Action Required: Reschedule Quote Accepted [PNR: ${request.bookingId.pnr}]`,
                `<p>The agent ${agent.name} has accepted the reschedule quote for PNR: ${request.bookingId.pnr} and paid ₹${totalAmount}. Please reissue the ticket via GDS and mark it as Processed in the Admin Dashboard.</p>`
            );
        } catch(e) {}

        res.status(200).json({ success: true, message: 'Quote accepted successfully. Ticket reissue is in progress.', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    getFlights, bookFlight, createFlightOrder, payFromWallet, getAirports, getPopularAirports,
    getHotels, bookHotel,
    getBuses, bookBus,
    getTrains, bookTrain,
    getAllBookings, getAgentBookings, updateBookingStatus, createServiceRequest, acceptRescheduleQuote
};
