const Joi = require('joi');
const Booking = require('../Models/Booking.model');
const Agent = require('../Models/Agent.model');
const Transaction = require('../Models/Transaction.model');
const RescheduleRequest = require('../Models/RescheduleRequest.model');
const ftdFlightService = require('../services/ftdFlightService');
const MarkupRule = require('../Models/MarkupRule.model');
const { searchAirports } = require('../services/airportService');
const { getTokenStatus } = require('../services/ftdTokenService');
const { generatePDFTicket } = require('../utils/ticketGenerator');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/notifier');
const { generateInvoice } = require('../utils/invoiceGenerator');
const path = require('path');

// ============================================================
// VALIDATION — Matching exact FTD field names
// ============================================================

const ADULT_TITLES = ['Mr', 'Ms', 'Mrs', 'Miss'];
const CHILD_TITLES = ['Mstr', 'Miss'];

// FTD uses pType: A=Adult, C=Child, I=Infant
const passengerSchema = Joi.object({
    title: Joi.string().required().messages({ 'any.required': 'Passenger title is required' }),
    fName: Joi.string().min(2).max(50).required().messages({ 'any.required': 'First name is required' }),
    lName: Joi.string().min(2).max(50).required().messages({ 'any.required': 'Last name is required' }),
    pType: Joi.string().valid('A', 'C', 'I').required()
        .messages({ 'any.only': 'Passenger type must be A (Adult), C (Child), or I (Infant)' }),
    gender: Joi.string().valid('M', 'F', '').allow('', null),
    dob: Joi.string().allow('', null),  // DD-MM-YYYY

    // International passport fields
    ppNo: Joi.string().allow('', null),
    ppIss: Joi.string().allow('', null),   // DD-MM-YYYY
    ppExp: Joi.string().allow('', null),   // DD-MM-YYYY
    ppNat: Joi.string().allow('', null),   // Country code e.g. "IN"

    // SSR (optional)
    ssrInfo: Joi.object().allow(null)
}).unknown(true);

const gstSchema = Joi.object({
    number: Joi.string().required().messages({ 'any.required': 'GST Number is required' }),
    email: Joi.string().email().required().messages({ 'any.required': 'GST Email is required' }),
    mobile: Joi.string().min(10).required().messages({ 'any.required': 'GST Mobile is required' }),
    address: Joi.string().required().messages({ 'any.required': 'GST Address is required' }),
    company: Joi.string().required().messages({ 'any.required': 'GST Company Name is required' })
}).unknown(true);

// FTD search uses: depCity, arrCity, onDate, tripType, serType, adt, chd, inf, cabin, fareType
const searchSchema = Joi.object({
    depCity: Joi.string().length(3).uppercase().required(),
    arrCity: Joi.string().length(3).uppercase().required(),
    onDate: Joi.string().required(),          // YYYYMMDD or YYYY-MM-DD
    reDate: Joi.string().allow('', null).default(''),
    adt: Joi.number().integer().min(1).max(9).default(1),
    chd: Joi.number().integer().min(0).max(9).default(0),
    inf: Joi.number().integer().min(0).max(9).default(0),
    cabin: Joi.string().valid('E', 'B', 'F').default('E'),
    tripType: Joi.number().valid(0, 1).default(0),      // 0=ONEWAY, 1=ROUNDTRIP
    serType: Joi.number().valid(1, 2).default(1),        // 1=DOM, 2=INTL
    fareType: Joi.string().default('A'),
    preferredAirline: Joi.string().allow('', null).default('')
}).unknown(true);


// ============================================================
// UTILITIES
// ============================================================

/**
 * Handles FTD's complex flight structures.
 * FTD returns segments as a flat array OR a nested object with Onward/Return maps (keys "0", "1", "2"...).
 * This flattens them into a clean array for consistent parsing.
 */
const flattenFtdFlights = (ftdFlights) => {
    if (!ftdFlights || (Array.isArray(ftdFlights) && ftdFlights.length === 0)) return [];
    
    // Case 1: Already a flat array
    if (Array.isArray(ftdFlights)) {
        // Check if the first element is the Onward wrapper
        if (ftdFlights[0]?.Onward || ftdFlights[0]?.Return) {
            let flattened = [];
            const segments = ftdFlights[0];
            if (segments.Onward) {
                Object.keys(segments.Onward)
                    .filter(k => !isNaN(parseInt(k)))
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .forEach(k => flattened.push(segments.Onward[k]));
            }
            if (segments.Return) {
                Object.keys(segments.Return)
                    .filter(k => !isNaN(parseInt(k)))
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .forEach(k => flattened.push(segments.Return[k]));
            }
            return flattened;
        }
        return ftdFlights;
    }

    // Case 2: Nested Object { Onward: { "0": ... }, Return: { "0": ... } }
    if (typeof ftdFlights === 'object') {
        let flattened = [];
        if (ftdFlights.Onward) {
            Object.keys(ftdFlights.Onward)
                .filter(k => !isNaN(parseInt(k)))
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach(k => flattened.push(ftdFlights.Onward[k]));
        }
        if (ftdFlights.Return) {
            Object.keys(ftdFlights.Return)
                .filter(k => !isNaN(parseInt(k)))
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach(k => flattened.push(ftdFlights.Return[k]));
        }
        return flattened;
    }

    return [];
};

/**
 * Applies Admin Markup rules to a list of flights.
 * Rules are prioritized: Specific Airline > ALL Airlines.
 */
const applyAdminMarkup = async (flights, serviceType = 'DOMESTIC_FLIGHT', agentCode = 'ALL') => {
    try {
        const rules = await MarkupRule.find({ serviceType, isActive: true }).sort({ priority: -1, createdAt: -1 });
        if (!rules || rules.length === 0) return flights;

        return flights.map(f => {
            // Find the best matching rule using a specificity scoring system:
            // Specific Agent match = 1000 points
            // Specific Airline match = 100 points
            // Specific Refund Type match = 10 points
            const scoredRules = rules.map(r => {
                // If the rule is specifically for an agent, and this is NOT that agent, discard it
                if (r.targetAgentCode && r.targetAgentCode !== 'ALL' && r.targetAgentCode !== agentCode) {
                    return null;
                }

                const isAirlineMatch = r.airline === 'ALL' || r.airline === f.airlineIata;
                const isRefundMatch = r.refundType === 'All' || 
                                     r.refundType === f.refundType || 
                                     (r.refundType === 'Refundable & P Refundable' && (f.refundType === 'Refundable' || f.refundType === 'P Refundable'));
                
                if (isAirlineMatch && isRefundMatch) {
                    let score = 0;
                    if (r.targetAgentCode && r.targetAgentCode !== 'ALL') score += 1000;
                    if (r.airline !== 'ALL') score += 100;
                    if (r.refundType !== 'All') score += 10;
                    return { rule: r, score };
                }
                return null;
            }).filter(item => item !== null);

            // Sort by score descending and pick the best one
            scoredRules.sort((a, b) => b.score - a.score);
            const rule = scoredRules.length > 0 ? scoredRules[0].rule : null;

            if (rule) {
                let markupAmount = 0;
                if (rule.markupType === 'Fixed') {
                    markupAmount = rule.markupValue;
                } else {
                    // Pre-calculate percentage on the original price
                    markupAmount = f.price * (rule.markupValue / 100);
                }
                
                // Adjust public facing pricing
                f.originalPrice = f.price;
                f.price = Math.round(f.price + markupAmount);
                f.netfare = Math.round(f.netfare + markupAmount);
                f.adminMarkupApplied = Math.round(markupAmount);
            }
            return f;
        });
    } catch (err) {
        logger.error(`Error applying Admin Markup: ${err.message}`);
        return flights;
    }
};

// ============================================================
// CONTROLLERS
// ============================================================

/**
 * @desc    Search flights via FTD postSearchFlightV2
 * @route   POST /api/booking/flights/search
 */
const searchFlights = async (req, res) => {
    try {
        // Support both POST (body) and GET (query) for legacy compatibility
        let searchParams = req.method === 'POST' ? req.body : req.query;

        // Map legacy params to FTD schema if needed
        if (searchParams.from) searchParams.depCity = searchParams.from;
        if (searchParams.to) searchParams.arrCity = searchParams.to;
        if (searchParams.date) searchParams.onDate = searchParams.date;

        // Automatically determine service type (1=DOM, 2=INTL)
        const { isInternationalRoute } = require('../services/airportService');
        if (!searchParams.serType) {
            searchParams.serType = isInternationalRoute(searchParams.depCity, searchParams.arrCity) ? 2 : 1;
            logger.info(`Detected Service Type: ${searchParams.serType === 1 ? 'DOM' : 'INTL'}`);
        }

        const { error, value } = searchSchema.validate(searchParams);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        if (value.depCity === value.arrCity) {
            return res.status(400).json({ success: false, message: 'Origin and destination cannot be the same.' });
        }

        const result = await ftdFlightService.searchFlights(value);

        let agentCode = 'ALL';
        if (req.user && req.user._id) {
            const agent = await Agent.findById(req.user._id);
            if (agent && agent.agentCode) agentCode = agent.agentCode;
        }

        // Apply Dynamic Admin Markups
        if (result && result.flights) {
            const serviceTypeCode = value.serType === 2 ? 'INTERNATIONAL_FLIGHT' : 'DOMESTIC_FLIGHT';
            result.flights = await applyAdminMarkup(result.flights, serviceTypeCode, agentCode);
        }

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        const statusCode = error.response?.status || error.statusCode || 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};


/**
 * @desc    Get fare details (View Price → SME, Retail, Flexi)
 * @route   POST /api/booking/flights/fare-details
 */
const getFareDetails = async (req, res) => {
    try {
        const { flightID, refID } = req.body;

        if (!flightID || !refID) {
            return res.status(400).json({ success: false, message: 'flightID and refID are required.' });
        }

        const result = await ftdFlightService.getFareDetails(flightID, refID);

        // Apply Dynamic Admin Markups to individual fare buckets (SME, Flexi, etc)
        if (result && Array.isArray(result) && result.length > 0) {
            // Determine service type from the first segment of the first fare bucket
            const firstFare = result[0];
            const segments = firstFare.flightDetails || [];
            let serType = 'DOMESTIC_FLIGHT';
            
            if (segments.length > 0) {
                const { isInternationalRoute } = require('../services/airportService');
                const firstSeg = segments[0];
                const lastSeg = segments[segments.length - 1] || firstSeg;
                if (isInternationalRoute(firstSeg.depCode, lastSeg.arrCode)) {
                    serType = 'INTERNATIONAL_FLIGHT';
                }
            }
            
            let agentCode = 'ALL';
            if (req.user && req.user._id) {
                const agent = await Agent.findById(req.user._id);
                if (agent && agent.agentCode) agentCode = agent.agentCode;
            }
            
            const flights = await applyAdminMarkup(result, serType, agentCode); 
            res.status(200).json({ success: true, data: flights });
        } else {
            res.status(200).json({ success: true, data: result });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @desc    Verify price before booking
 * @route   POST /api/booking/flights/verify-price
 */
const verifyPriceController = async (req, res) => {
    try {
        let { flightID, refID, originalNetfare } = req.body;

        // RESILIENT ID RECOVERY: Strip "FTD-" or compound strings from inputs
        if (flightID && typeof flightID === 'string' && flightID.includes('-')) {
            const parts = flightID.split('-');
            flightID = parts[parts.length - 1]; // Take the last part (usually numeric ID)
        }
        if (refID && typeof refID === 'string' && refID.startsWith('FTD-')) {
            const parts = refID.split('-');
            if (parts.length >= 2) refID = parts[1]; // Take the actual RefID
        }

        if (!flightID || !refID) {
            return res.status(400).json({ success: false, message: 'flightID and refID are required for price verification.' });
        }

        logger.info(`Verify Price Controller: Processing flightID=${flightID}, refID=${refID}`);

        const result = await ftdFlightService.verifyPrice(
            flightID, refID, parseFloat(originalNetfare) || 0
        );

        // Apply Admin Markup to verification result to ensure consistency
        if (result) {
            const { isInternationalRoute } = require('../services/airportService');
            // Try to extract segments to determine route type
            const ftdData = result.ftdResponse || {};
            const onward = ftdData.Flights?.Onward || [];
            const returnLeg = ftdData.Flights?.Return || [];
            const allSegs = [...(Array.isArray(onward) ? onward : []), ...(Array.isArray(returnLeg) ? returnLeg : [])];
            
            let serType = 'DOMESTIC_FLIGHT';
            if (allSegs.length > 0) {
                const first = allSegs[0];
                const last = allSegs[allSegs.length - 1];
                const INTL_CARRIERS = ['SV', 'FZ', 'G9', 'QR', 'EY', 'SQ', 'EK', 'TK', 'BA', 'UL'];
                if (isInternationalRoute(first.depCode, last.arrCode) || INTL_CARRIERS.includes(first.airCode)) {
                    serType = 'INTERNATIONAL_FLIGHT';
                }
            }
            
            let agentCode = 'ALL';
            if (req.user && req.user._id) {
                const agent = await Agent.findById(req.user._id);
                if (agent && agent.agentCode) agentCode = agent.agentCode;
            }
            
            // Re-apply markup to the verified price
            // result is { verified, currentNetfare, ftdResponse }
            // We map it to a mock flight object for applyAdminMarkup
            const mockFlight = { 
                price: result.currentNetfare, 
                netfare: result.currentNetfare,
                airlineIata: allSegs.length > 0 ? allSegs[0].airCode : 'ALL',
                refundType: ftdData.refundType || ftdData.Fare?.refundType === 'R' ? 'Refundable' : 'Non-Refundable'
            };
            const markedResults = await applyAdminMarkup([mockFlight], serType, agentCode);
            
            result.currentNetfare = markedResults[0].netfare;
            result.adminMarkupApplied = markedResults[0].adminMarkupApplied || 0;

            // Extract SSR Info for frontend (FTD nests this under result.ssrInfo)
            result.ssrInfo = ftdData.result?.ssrInfo || ftdData.result?.SSR || ftdData.ssrInfo || ftdData.SSR || null;
            
            res.status(200).json({ success: true, data: result });
        } else {
            res.status(200).json({ success: true, data: result });
        }

    } catch (error) {
        const errorMsg = error.message || 'Unknown Price Verify Error';
        logger.error(`Price Verify Controller Error: ${errorMsg}`);
        
        // Is it a known GDS-side rejection?
        const isGdsRejection = errorMsg.toLowerCase().includes('mismatch') || 
                               errorMsg.toLowerCase().includes('try again') ||
                               errorMsg.toLowerCase().includes('expired') ||
                               errorMsg.toLowerCase().includes('unable') ||
                               errorMsg.toLowerCase().includes('fare changed');

        // Map to 400 for user-friendly handling, otherwise 500 for true server errors
        const status = isGdsRejection ? 400 : (error.response?.status || 500);

        return res.status(status).json({ 
            success: false, 
            message: errorMsg,
            isSessionExpired: isGdsRejection,
            code: isGdsRejection ? 'GDS_REJECTION' : 'INTERNAL_ERROR'
        });
    }
};


/**
 * @desc    Get validation flags specifically (GST, PAN, Docs)
 * @route   POST /api/booking/flights/validation-flags
 */
const getValidationFlagsController = async (req, res) => {
    try {
        const { flightID, refID } = req.body;

        if (!flightID || !refID) {
            return res.status(400).json({ success: false, message: 'flightID and refID are required.' });
        }

        const result = await ftdFlightService.getValidationFlags(flightID, refID);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @desc    Book a flight with full passenger logic
 * @route   POST /api/booking/flights/book
 * 
 * Body matches FTD structure:
 * {
 *   passenger: [{ title, fName, lName, pType, gender, dob, ppNo?, ppIss?, ppExp?, ppNat?, ssrInfo? }],
 *   refID, clientID, flightID, mobile, email,
 *   gst?: { number, email, mobile, address, company },
 *   first_pax_pan_no?,
 *   isInternational?, gstind?, netfare?, totalAmount?
 * }
 */
const bookFlightController = async (req, res) => {
    try {
        let {
            passenger, refID, clientID, flightID,
            mobile, email, mrd,
            gst, gstind, first_pax_pan_no,
            isInternational,
            netfare, totalAmount,
            razorpayPaymentId,
            refundType, refundStatus
        } = req.body;

        logger.info(`FTD Booking Request Attempt: refID=${refID}, flightID=${flightID}, email=${email}`);

        // FALLBACK: If explicit IDs are missing, try to extract from 'id' or 'clientID' if present in req.body
        let finalRefID = refID;
        let finalFlightID = flightID;

        if (!finalRefID || !finalFlightID) {
            const providerID = req.body.id || (passenger && passenger[0]?.id);
            if (providerID && String(providerID).startsWith('FTD-')) {
                const parts = String(providerID).split('-');
                // Pattern: FTD-{refID}-{index/flightID}
                if (parts.length >= 2) {
                    if (!finalRefID) finalRefID = parts[1];
                    // If parts[2] exists, it might be the Flight ID or an index
                    if (!finalFlightID && parts[2]) finalFlightID = parts[2];
                    
                    logger.info(`Recovered IDs from String: refID=${finalRefID}, flightID=${finalFlightID}`);
                }
            }
        }

        // 1. Validate basic required fields
        if (!finalRefID || !finalFlightID) {
            logger.error(`Validation Failed: Missing finalRefID(${finalRefID}) or finalFlightID(${finalFlightID})`);
            return res.status(400).json({ success: false, message: 'refID and flightID are required.' });
        }
        if (!passenger || !Array.isArray(passenger) || passenger.length === 0) {
            logger.error('Validation Failed: Passenger array missing or empty');
            return res.status(400).json({ success: false, message: 'At least one passenger is required.' });
        }
        if (!mobile || !email) {
            logger.error('Validation Failed: Mobile or Email missing');
            return res.status(400).json({ success: false, message: 'Contact mobile and email are required.' });
        }
        if (!netfare || isNaN(parseFloat(netfare))) {
            logger.error('Validation Failed: netfare missing or invalid');
            return res.status(400).json({ success: false, message: 'Pricing data (netfare) is missing or invalid. Please re-verify price.' });
        }

        // Assign recovered IDs for further processing
        const useRefID = finalRefID;
        const useFlightID = parseInt(finalFlightID);

        if (isNaN(useFlightID)) {
            logger.error(`Validation Failed: Invalid flightID numeric value: ${finalFlightID}`);
            return res.status(400).json({ success: false, message: 'Invalid flightID format.' });
        }

        logger.info(`FTD Booking Final Payload Preparation: refID=${useRefID}, flightID=${useFlightID}`);

        // 2. Validate each passenger
        for (let i = 0; i < passenger.length; i++) {
            const pax = passenger[i];

            const { error } = passengerSchema.validate(pax);
            if (error) {
                logger.error(`Passenger ${i + 1} Schema Error: ${error.details[0].message}`);
                return res.status(400).json({
                    success: false,
                    message: `Passenger ${i + 1}: ${error.details[0].message}`
                });
            }

            // Validate title per passenger type
            const paxType = pax.pType.toUpperCase();
            if (paxType === 'A') {
                if (!ADULT_TITLES.includes(pax.title)) {
                    return res.status(400).json({
                        success: false,
                        message: `Passenger ${i + 1}: Adult title must be: ${ADULT_TITLES.join(', ')}. Got: "${pax.title}"`
                    });
                }
            } else if (paxType === 'C' || paxType === 'I') {
                if (!CHILD_TITLES.includes(pax.title)) {
                    return res.status(400).json({
                        success: false,
                        message: `Passenger ${i + 1}: Child/Infant title must be: ${CHILD_TITLES.join(', ')}. Got: "${pax.title}"`
                    });
                }
            }

            // International: validate passport
            if (isInternational) {
                if (!pax.ppNo || !pax.ppIss || !pax.ppExp) {
                    return res.status(400).json({
                        success: false,
                        message: `Passenger ${i + 1}: Passport (ppNo, ppIss, ppExp) is mandatory for international flights.`
                    });
                }
            }
        }

        // 3. Validate based on GDS Validation Node flags
        // For production, we re-verify flags from FTD to be safe
        let validationFlags = {};
        try {
            validationFlags = await ftdFlightService.getValidationFlags(useFlightID, useRefID);
        } catch (vErr) {
        logger.warn(`Could not fetch validation flags for ${useFlightID}: ${vErr.message}`);
        }

        // GST Enforcement
        validationFlags = req.body.validationFlags || validationFlags || {};
        // 3. Validate based on GDS Validation Node flags
        const isIntl = isInternational || false;
        const commissionRate = isIntl ? 0.08 : 0.05;
        
        // Recalculate Admin Markup (Backend authority)
        const serType = isIntl ? 'INTERNATIONAL_FLIGHT' : 'DOMESTIC_FLIGHT';
        
        let agentCode = 'ALL';
        if (req.user && req.user._id) {
            const agentForMarkup = await Agent.findById(req.user._id);
            if (agentForMarkup && agentForMarkup.agentCode) agentCode = agentForMarkup.agentCode;
        }

        const dummyFlight = { 
            price: parseFloat(netfare) || 0,
            airlineIata: req.body.airlineIata || '' 
        };
        const markedFlights = await applyAdminMarkup([dummyFlight], serType, agentCode);
        const adminMarkupApplied = markedFlights[0].adminMarkupApplied || 0;

        const baseBookingAmount = parseFloat(netfare) || 0;
        const commission = baseBookingAmount * commissionRate;
        const bookingAmount = baseBookingAmount + adminMarkupApplied;
        const netDeduction = (baseBookingAmount - commission) + adminMarkupApplied;

        // Validating GST only if GDS mandates it (gstInd === 1)
        if (gstind === '1' || gstind === 1 || validationFlags.gstInd === 1) {
            if (!gst || !gst.number) {
                // Try to fallback to Agent's profile GST if they didn't provide one
                const agentProfile = await Agent.findById(req.user._id);
                if (agentProfile?.gstNumber) {
                    gst = {
                        number: agentProfile.gstNumber,
                        company: agentProfile.agencyName || 'Agency',
                        email: agentProfile.emailAddress || '',
                        mobile: agentProfile.mobileNumber || '',
                        address: agentProfile.address || ''
                    };
                    gstind = 1;
                    logger.info(`Auto-filled GST from Agent Profile: ${gst.number}`);
                } else if (validationFlags.gstInd === 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'GST details are mandatory for this fare type. Please provide GST in your profile or at checkout.'
                    });
                }
            }
            const { error: gstError } = gstSchema.validate(gst);
            if (gstError) {
                return res.status(400).json({
                    success: false,
                    message: `GST Validation Error: ${gstError.details[0].message}`
                });
            }
        }

        // PAN Enforcement (SOTO or specific GDS requirement)
        const mustHavePAN = first_pax_pan_no || validationFlags.pan_mandatory === 1;
        if (mustHavePAN && !first_pax_pan_no) {
            return res.status(400).json({
                success: false,
                message: 'PAN Number is mandatory for this booking (SOTO/GDS requirement).'
            });
        }

        // Document Enforcement (Student/Defence etc)
        if (validationFlags.doc_mandatory === 1) {
            // Usually passed in remarks or specific pax fields, but here we flag it for UI check
            // req.body.pax_doc_id ? ... 
        }

        // 4. Check agent wallet
        const agent = await Agent.findById(req.user._id);
        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found.' });
        }

        // 4.6. Pre-booking Wallet Balance Check (Enforce Wallet-Only Booking)
        let initialTransaction = null;
        if (!razorpayPaymentId) {
            if (agent.walletBalance < netDeduction) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient wallet balance. You need ₹${netDeduction.toLocaleString()} but your balance is ₹${agent.walletBalance.toLocaleString()}. Please top-up your wallet.` 
                });
            }

            // --- CRITICAL: DEBIT WALLET BEFORE CALLING GDS ---
            // This prevents "free tickets" if the server/DB fails after ticket issuance.
            agent.walletBalance -= netDeduction;
            await agent.save();

            // Create a pending transaction record
            initialTransaction = await Transaction.create({
                agentId: agent._id,
                transactionType: 'DEBIT',
                purpose: 'FLIGHT_BOOKING',
                amount: netDeduction,
                balanceAfterTransaction: agent.walletBalance,
                referenceId: `TXN-PEND-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                status: 'PENDING',
                paymentMethod: 'WALLET',
                gross: bookingAmount,
                comm: commission,
                tds: commission * 0.05,
                remark: `Pre-debit for Flight ID: ${useFlightID}`
            });
            logger.info(`[Wallet-First] Funds locked. Transaction: ${initialTransaction._id}, Amount: ${netDeduction}`);
        }

        // 4.5. Test Environment Duplicate Evasion
        // FTD Test Environment actively blocks repetitive identical payloads, throwing 'Duplicate Booking'
        // We seamlessly auto-append a robust random suffix to ensure smooth repeated testing.
        let gstindToUse = gstind;
        let gstToUse = gst;
        let spoofedRefID = useRefID;
        let spoofedClientID = clientID;

        if (process.env.FTD_MODE === '0') {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            passenger.forEach(p => {
                p.fName = `${p.fName}${randomSuffix}`;
                p.lName = `${p.lName}${randomSuffix}`;
            });
            email = `test${randomSuffix}@zayafly.com`;
            mobile = `99${Math.floor(10000000 + Math.random() * 90000000)}`;

            // FTD's test search API always returns the precise same refID (e.g., FTD4JGWIAVVE3B4). 
            // We dynamically spoof it here to completely bypass their duplicate booking blockade.
            spoofedRefID = `${useRefID}-${randomSuffix}`;
            spoofedClientID = `TEST-${randomSuffix}`;

            // If it's test mode but the flight REQUIRES GST (e.g. SME fare), we supply dummy GST to pass FTD's check
            if (validationFlags.gstInd === 1 || gstind === 1 || gstind === '1') {
                gstindToUse = 1;
                gstToUse = {
                    number: '07AAAAA0000A1Z5',
                    company: 'Zaya Test Company',
                    email: email,
                    mobile: mobile,
                    address: 'Test Phase Address'
                };
            }
        }

        // 5. Call FTD bookFlight API
        // mrd = mobile with country code (FTD Section 8 requirement)
        const mrdFinal = mrd || (mobile ? (mobile.startsWith('+') ? mobile : `+91${mobile}`) : '');
        
        let ftdResult;
        try {
            ftdResult = await ftdFlightService.bookFlight({
                passenger, refID: spoofedRefID, clientID: spoofedClientID, flightID: parseInt(useFlightID),
                mobile, mrd: mrdFinal, email,
                gst: (gstindToUse === '1' || gstindToUse === 1) ? gstToUse : undefined,
                first_pax_pan_no
            });
        } catch (apiError) {
            logger.error(`[Wallet-First] FTD API Fatal Error: ${apiError.message}`);
            // FATAL ERROR REFUND
            if (!razorpayPaymentId && initialTransaction) {
                agent.walletBalance += netDeduction;
                await agent.save();
                initialTransaction.status = 'FAILED';
                initialTransaction.remark = `API FATAL ERROR: ${apiError.message} | Refunded`;
                await initialTransaction.save();
            }
            throw apiError; // Re-throw to be caught by outer catch
        }

        const ftdStatusNodeStr = String(ftdResult?.Status?.status || ftdResult?.status || '').toLowerCase();
        let isFtdError = false;

        // FTD V2.5 mock environment often leaves legacy 'code: 0' alongside 'success: 1'. 
        // We must prioritize explicit success markers.
        if (ftdResult?.code === 'error') {
            isFtdError = true;
        } else if (String(ftdResult?.Status?.code) === '0') {
            if (ftdResult?.success !== 1 && ftdStatusNodeStr !== 'success') {
                isFtdError = true;
            }
        } else if (ftdResult?.success === 0 || ftdStatusNodeStr === 'failed' || ftdStatusNodeStr === 'rejected') {
            isFtdError = true;
        }

        const errorMsg = ftdResult?.error_msg || ftdResult?.Status?.message || 'Booking failed at operator';

        if (isFtdError) {
            // --- REFUND LOGIC FOR WALLET-FIRST FLOW ---
            if (!razorpayPaymentId && initialTransaction) {
                logger.warn(`[Wallet-First] GDS Booking Failed. Refunding Agent ${agent._id}...`);
                agent.walletBalance += netDeduction;
                await agent.save();

                // Update Transaction to FAILED and record refund
                initialTransaction.status = 'FAILED';
                initialTransaction.remark = `FAILED: ${errorMsg} | Automatically Refunded`;
                await initialTransaction.save();

                // Create a matching CREDIT transaction for clear audit trail
                await Transaction.create({
                    agentId: agent._id,
                    transactionType: 'CREDIT',
                    purpose: 'CANCEL_REFUND',
                    amount: netDeduction,
                    balanceAfterTransaction: agent.walletBalance,
                    referenceId: `REF-${initialTransaction.referenceId}`,
                    status: 'SUCCESS',
                    paymentMethod: 'WALLET',
                    remark: `Automatic refund for failed booking: ${errorMsg}`
                });
            }

            return res.status(400).json({ success: false, message: errorMsg });
        }

        // 6. Create local booking record

        // Determine status from FTD response (Robustly handle nested Status objects in V2.5)
        const statusNode = ftdResult?.Status || ftdResult?.status || {};
        let rawStatus = ftdStatusNodeStr || 'Pending';
        if (isFtdError) rawStatus = 'Rejected';
        
        // Capitalize to match enum: 'Success', 'Pending', 'Rejected'
        const ftdStatus = String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1).toLowerCase();

        const ftdPnr = ftdResult?.pnr || 
                       ftdResult?.PNR || 
                       ftdResult?.airlinePnr || 
                       ftdResult?.ticket?.Onward?.passenger?.[0]?.pnr || 
                       ftdResult?.ticket?.Onward?.passenger?.["0"]?.pnr ||
                       (typeof statusNode === 'object' ? statusNode.pnr : '') || '';
                      
        const ftdBookingRef = (typeof statusNode === 'object' && statusNode.refID) ? statusNode.refID : 
                              (ftdResult?.bookingRef || ftdResult?.refID || refID);

        // Extract Source and Destination for persistent storage
        let flightsList = flattenFtdFlights(ftdResult?.Flights);
        let fromCity = flightsList.length > 0 ? (flightsList[0].depCName || flightsList[0].depCode) : '';
        let toCity = flightsList.length > 0 ? (flightsList[flightsList.length - 1].arrCName || flightsList[flightsList.length - 1].arrCode) : '';
        let airlineName = flightsList.length > 0 ? (flightsList[0].airName || flightsList[0].airline) : 'Flight';

        const finalFareType = req.body.fareType || validationFlags.fareType || 'Retail';
        const finalRefundType = refundType || validationFlags.refundType || 'Non-Refundable';

        const booking = await Booking.create({
            agentId: agent._id,
            serviceType: 'FLIGHT',
            providerReference: ftdPnr || ftdBookingRef || `FTD-${Date.now()}`,
            fromCity,
            toCity,
            airline: airlineName,
            contactEmail: email || '',
            contactMobile: mrdFinal || mobile || '',
            totalCost: bookingAmount,
            commissionEarned: commission,
            status: isFtdError ? 'FAILED' : (ftdStatus === 'Success' ? 'CONFIRMED' : 'PENDING'),
            passengerDetails: passenger,
            travelDate: new Date(),
            ftdBookingRef,
            pnr: ftdPnr,
            ftdStatus,
            netfare: parseFloat(netfare) || 0,
            adminMarkupApplied: adminMarkupApplied || 0,
            gstDetails: (gstind === '1' || gstind === 1) ? gst : undefined,
            fareType: finalFareType,
            refundType: finalRefundType,
            paymentMethod: razorpayPaymentId ? 'RAZORPAY' : 'WALLET',
            barcodeData: ftdResult?.barcodeText1 || '',
            flightDetails: flightsList,
            isInternational: isIntl,
            passportDetails: isIntl ? passenger.map(p => ({
                name: `${p.fName} ${p.lName}`,
                ppNo: p.ppNo, ppIss: p.ppIss, ppExp: p.ppExp, ppNat: p.ppNat
            })) : undefined
        });

        // 6.5. RETROACTIVE GDS SYNC (Critical Fix)
        // If FTD book response was empty, we pull missing route data from GDS status immediately
        if (!isFtdError && ftdBookingRef && (!fromCity || flightsList.length === 0)) {
            try {
                logger.info(`🔄 Triggering Retroactive GDS Sync for ${ftdBookingRef}...`);
                const statusRes = await ftdFlightService.checkBookingStatus(ftdBookingRef);
                const syncFlights = flattenFtdFlights(statusRes?.flights?.Flights || statusRes?.Flights);
                
                if (syncFlights.length > 0) {
                    const syncFrom = syncFlights[0].depCName || syncFlights[0].depCode;
                    const syncTo = syncFlights[syncFlights.length - 1].arrCName || syncFlights[syncFlights.length - 1].arrCode;
                    const syncAir = syncFlights[0].airName || syncFlights[0].airline;

                    booking.fromCity = syncFrom;
                    booking.toCity = syncTo;
                    booking.airline = syncAir;
                    booking.flightDetails = syncFlights;
                    await booking.save();
                    logger.info(`✅ GDS Sync Successful: ${syncFrom} -> ${syncTo}`);
                }
            } catch (syncErr) {
                logger.error(`❌ GDS Sync Failed for ${ftdBookingRef}: ${syncErr.message}`);
            }
        }

        if (isFtdError && razorpayPaymentId) {
            // Process Automatic Refund to Wallet since Razorpay payment succeeded but GDS failed
            const refundAmount = bookingAmount - commission;
            if (refundAmount > 0) {
                agent.walletBalance += refundAmount;
                await agent.save();
                
                await Transaction.create({
                    agentId: agent._id,
                    transactionType: 'CREDIT',
                    purpose: 'CANCEL_REFUND',
                    amount: refundAmount,
                    balanceAfterTransaction: agent.walletBalance,
                    referenceId: `REF-${booking._id}`,
                    status: 'SUCCESS',
                    paymentMethod: 'WALLET',
                    gross: bookingAmount,
                    comm: commission,
                    tds: commission * 0.05, // Standard 5% TDS
                    remark: `Refund for failed booking ${ftdPnr || ftdBookingRef}`
                });
            }
            return res.status(400).json({
                success: false,
                message: `${errorMsg}. Your payment of ₹${refundAmount} has been automatically refunded to your wallet.`
            });
        }

        // 7. Update Pending Transaction to SUCCESS
        if (!isFtdError && initialTransaction) {
            initialTransaction.status = 'SUCCESS';
            initialTransaction.referenceId = `B-${booking._id}`; // Update to point to local booking
            initialTransaction.description = `${fromCity} → ${toCity} | PNR: ${ftdPnr || 'Pending'}`;
            initialTransaction.remark = `Confirmed | PNR: ${ftdPnr || 'Pending'}`;
            await initialTransaction.save();
        }

        // 7.5. Dedicated Transaction for Razorpay (If applicable)
        if (!isFtdError && razorpayPaymentId) {
            await Transaction.create({
                agentId: agent._id,
                transactionType: 'CREDIT',
                purpose: 'FLIGHT_BOOKING',
                amount: (bookingAmount - commission),
                balanceAfterTransaction: agent.walletBalance,
                referenceId: `B-${booking._id}`,
                status: 'SUCCESS',
                paymentMethod: 'RAZORPAY',
                gross: bookingAmount,
                comm: commission,
                tds: commission * 0.05,
                remark: `${fromCity} -> ${toCity} | PNR: ${ftdPnr || 'Pending'}`
            });
        }

        // 9. Generate ticket and send email if confirmed immediately
        if (ftdStatus === 'Success') {
            try {
                const ticketUrl = await generatePDFTicket(booking);
                booking.ticketUrl = ticketUrl;
                await booking.save();
                
                // Send Confirmation Email
                if (agent.email && process.env.EMAIL_USER) {
                    const absPath = path.join(__dirname, '../../', ticketUrl);
                    const subject = `✈️ GoyaFly — E-Ticket Confirmation [PNR: ${booking.pnr}]`;
                    const body = `
                        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                            <h2 style="color: #1a237e;">Booking Successful!</h2>
                            <p>Dear ${agent.name},</p>
                            <p>Your flight booking (Reference: <b>${booking.ftdBookingRef}</b>) has been successfully confirmed.</p>
                            <p><b>PNR:</b> ${booking.pnr}</p>
                            <p>Your official E-ticket is attached to this email.</p>
                            <br/>
                            <p>Best Regards,<br/>GoyaFly Support Team</p>
                        </div>
                    `;
                    
                    await sendEmail(agent.email, subject, body, [
                        { filename: `Ticket-${booking.pnr}.pdf`, path: absPath }
                    ]);
                    logger.info(`Live Booking: Ticket email sent to agent ${agent.email}`);
                }
            } catch (err) {
                logger.error('Live Booking: Ticket/Email generation failed: ' + err.message);
            }
        }

        res.status(201).json({
            success: true,
            data: {
                booking,
                ftdResponse: ftdResult,
                ftdStatus,
                pnr: ftdPnr,
                message: ftdStatus === 'Pending'
                    ? 'Booking submitted. Status will be confirmed within 7 minutes.'
                    : 'Booking confirmed!'
            },
            newBalance: agent.walletBalance
        });

    } catch (error) {
        const errorData = error.response?.data;
        const errorMessage = typeof errorData === 'object' ? JSON.stringify(errorData) : (errorData || error.message);
        logger.error('FTD Book Controller Error: ' + errorMessage);
        
        // Return 400 if it's likely a GDS validation error, else use incoming status or 500
        const status = error.response?.status || error.statusCode || 500;
        res.status(status).json({ 
            success: false, 
            message: errorMessage,
            details: errorData || null
        });
    }
};


/**
 * @desc    Check booking status
 * @route   GET /api/booking/flights/booking-status/:ref
 */
const getBookingStatus = async (req, res) => {
    try {
        const { ref } = req.params;
        if (!ref) return res.status(400).json({ success: false, message: 'Booking reference (refID) is required.' });

        const localBooking = await Booking.findOne({
            $or: [{ ftdBookingRef: ref }, { providerReference: ref }]
        });

        if (!localBooking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // IDOR Security Check: Ensure the logged-in agent owns this booking
        if (localBooking.agentId && localBooking.agentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access: You do not have permission to access this booking.' });
        }

        // Always use the internal FTD reference for the API, even if 'ref' passed was the PNR
        const ftdRef = localBooking.ftdBookingRef || ref;

        let ftdStatus = null;
        try {
            ftdStatus = await ftdFlightService.checkBookingStatus(ftdRef);
            
            // --- SYNC-ON-DEMAND LOGIC ---
            const gdsStatusStr = String(ftdStatus?.status || '').toLowerCase();
            if ((gdsStatusStr === 'success' || gdsStatusStr === 'confirmed') && localBooking?.status === 'PENDING') {
                logger.info(`Manual Sync: Booking ${localBooking._id} confirmed by GDS during refresh.`);
                
                localBooking.status = 'CONFIRMED';
                localBooking.ftdStatus = 'Success';
                localBooking.pnr = ftdStatus.pnr || 
                                   ftdStatus.PNR || 
                                   ftdStatus.ticket?.Onward?.passenger?.[0]?.pnr || 
                                   ftdStatus.ticket?.Onward?.passenger?.["0"]?.pnr || 
                                   localBooking.pnr;
                localBooking.barcodeData = ftdStatus.barcodeText1 || localBooking.barcodeData;
                
                // Sync Passenger IDs from GDS
                const gdsPassengers = ftdStatus.ticket?.Onward?.passenger || [];
                if (gdsPassengers.length > 0 && localBooking.passengerDetails?.length > 0) {
                    localBooking.passengerDetails = localBooking.passengerDetails.map((pax, idx) => {
                        const gdsPax = gdsPassengers[idx];
                        if (gdsPax) {
                            return {
                                ...pax,
                                paxID: gdsPax.paxID,
                                // Update name if GDS shows numbers/corrections
                                fName: gdsPax.fName || pax.fName,
                                lName: gdsPax.lName || pax.lName
                            };
                        }
                        return pax;
                    });
                }

                if (ftdStatus.Flights || ftdStatus.results?.[0]?.Flights) {
                    localBooking.flightDetails = ftdStatus.Flights || ftdStatus.results?.[0]?.Flights;
                }
                
                // Generate Ticket
                try {
                    const ticketUrl = await generatePDFTicket(localBooking);
                    localBooking.ticketUrl = ticketUrl;
                    
                    // Send Email
                    const agent = await Agent.findById(localBooking.agentId);
                    if (agent && agent.email && process.env.EMAIL_USER) {
                        const absPath = path.join(__dirname, '../../', ticketUrl);
                        const subject = `✈️ GoyaFly — E-Ticket Confirmation [PNR: ${localBooking.pnr}]`;
                        const body = `
                            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                                <h2 style="color: #1a237e;">Manual Status Sync: Confirmed!</h2>
                                <p>Dear ${agent.name},</p>
                                <p>Your flight booking (Reference: <b>${localBooking.ftdBookingRef}</b>) has been successfully synchronized and confirmed.</p>
                                <p><b>PNR:</b> ${localBooking.pnr}</p>
                                <p>Please find your E-Ticket attached.</p>
                                <br/><p>Support Team,<br/>GoyaFly</p>
                            </div>
                        `;
                        await sendEmail(agent.email, subject, body, [
                            { filename: `Ticket-${localBooking.pnr}.pdf`, path: absPath }
                        ]);
                    }
                } catch (err) {
                    logger.error('Sync-on-Demand: Ticket/Email generation failed: ' + err.message);
                }
                
                await localBooking.save();
            }
        } catch (err) {
            logger.warn('FTD status check failed: ' + err.message);
        }

        res.status(200).json({
            success: true,
            data: { 
                localBooking, 
                ftdStatus, 
                currentStatus: (ftdStatus?.status && String(ftdStatus.status).toLowerCase() === 'success') ? 'CONFIRMED' : (localBooking?.status || 'Unknown') 
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Simple details fetch for cancellation/reissue pages
 */
const getBookingDetails = async (req, res) => {
    try {
        const { ref } = req.params;
        const mongoose = require('mongoose');
        
        const query = {
            $or: [
                { ftdBookingRef: ref }, 
                { providerReference: ref }, 
                { pnr: ref }
            ]
        };

        // If 'ref' is a valid MongoDB ObjectId, add it to the search
        if (mongoose.Types.ObjectId.isValid(ref)) {
            query.$or.push({ _id: ref });
        }

        const booking = await Booking.findOne(query);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // IDOR Security Check: Ensure the logged-in agent owns this booking
        if (booking.agentId && booking.agentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access: You do not have permission to access this booking.' });
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get seat map for a flight
 * @route   POST /api/booking/flights/seats
 */
const getSeatsController = async (req, res) => {
    try {
        const { flightID, refID, passenger } = req.body;
        if (!flightID || !refID || !passenger) {
            return res.status(400).json({ success: false, message: 'flightID, refID, and passenger are required.' });
        }
        const result = await ftdFlightService.getSeatMap(flightID, refID, passenger);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @desc    Cancel a flight booking
 * @route   POST /api/booking/flights/cancel
 */
const cancelFlightController = async (req, res) => {
    try {
        const { refID, paxId, paxIdr, canMode, canRemarks } = req.body;
        
        if (!refID || !paxId) {
            return res.status(400).json({ success: false, message: 'refID and paxId are required.' });
        }

        // Find the local booking to get the correct internal GDS reference
        const localBooking = await Booking.findOne({ 
            $or: [{ ftdBookingRef: refID }, { providerReference: refID }, { pnr: refID }] 
        });

        if (!localBooking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // IDOR Security Check: Ensure the logged-in agent owns this booking
        if (localBooking.agentId && localBooking.agentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access: You do not have permission to cancel this booking.' });
        }

        const ftdRef = localBooking.ftdBookingRef || refID;

        // --- POLICY #4: 24-HOUR DEPARTURE CHECK ---
        const now = new Date();
        const departureDate = new Date(localBooking.travelDate);
        const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60);

        if (hoursUntilDeparture < 24) {
            logger.warn(`Policy #4 Alert: Cancellation attempt for PNR ${localBooking.pnr} within 24h of departure.`);
            // Note: We still proceed if the user confirmed, but we log the risk.
            // Frontend should have already warned them.
        }

        const result = await ftdFlightService.cancelFlight({
            refID: ftdRef, paxId, paxIdr: paxIdr || '', canMode: canMode || 5, canRemarks: canRemarks || ''
        });

        // --- DEFERRED WALLET REFUND LOGIC ---
        let finalRefundStatus = 'PENDING_AIRLINE';
        
        // Update local booking status without crediting wallet
        const updatedBooking = await Booking.findOneAndUpdate(
            { $or: [{ ftdBookingRef: refID }, { providerReference: refID }] },
            { 
                status: 'CANCELLED', 
                ftdStatus: 'Rejected',
                refundStatus: finalRefundStatus,
                cancellationPolicyAcknowledged: true
            },
            { new: true }
        );

        logger.info(`[DeferredRefund] Cancellation successful for PNR: ${updatedBooking.pnr}. Status set to PENDING_AIRLINE. Waiting for Admin processing.`);

        // --- AUTOMATED NOTIFICATIONS ---
        try {
            const agent = await Agent.findById(updatedBooking.agentId);
            const pnr = updatedBooking.pnr || updatedBooking.providerReference || 'N/A';
            const route = `${updatedBooking.fromCity} ➔ ${updatedBooking.toCity}`;

            // 1. Email to Agent
            if (agent && agent.email) {
                const agentSubject = `🚫 CANCELLED: ${route} [PNR: ${pnr}]`;
                const agentBody = `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background-color: #003580; padding: 20px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0;">Cancellation Request Received</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p>Dear ${agent.name || agent.agentName},</p>
                            <p>Your flight cancellation request for booking <b>${updatedBooking.ftdBookingRef}</b> has been received and processed on the GDS.</p>
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #ff8c00;">
                                <p style="margin: 0; font-weight: bold; color: #003580;">PNR: ${pnr}</p>
                                <p style="margin: 5px 0 0 0;">Route: ${route}</p>
                                <p style="margin: 5px 0 0 0;">Status: CANCELLED (Refund Pending)</p>
                            </div>
                            <p style="margin-top: 20px;">We have received your cancellation request. Please wait for the refund to be credited to your wallet. The refund will be processed according to standard airline industry timelines once released by the airline.</p>
                            <br/><p>Regards,<br/><b>Goyafly Support Team</b></p>
                        </div>
                    </div>
                `;
                await sendEmail(agent.email, agentSubject, agentBody);
            }

            // 2. Email to User/Passenger
            const userEmail = updatedBooking.contactEmail || (updatedBooking.gstDetails?.email);
            if (userEmail) {
                const userSubject = `Flight Cancellation Confirmation [PNR: ${pnr}]`;
                const userBody = `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background-color: #ff8c00; padding: 20px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0;">Your Booking is Cancelled</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p>Hello,</p>
                            <p>We are writing to confirm that your flight from <b>${updatedBooking.fromCity}</b> to <b>${updatedBooking.toCity}</b> has been successfully cancelled as per your request.</p>
                            <div style="border: 1px dashed #cccccc; padding: 20px; text-align: center; border-radius: 8px;">
                                <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Airline PNR</p>
                                <h1 style="margin: 5px 0; color: #003580; letter-spacing: 2px;">${pnr}</h1>
                            </div>
                            <p style="margin-top: 20px; font-size: 13px; color: #666;">
                                If you did not authorize this cancellation, please contact your travel agent immediately.
                            </p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                            <p style="text-align: center; color: #999; font-size: 11px;">Thank you for using Goyafly via ${agent?.name || 'GoyaFly'}.</p>
                        </div>
                    </div>
                `;
                await sendEmail(userEmail, userSubject, userBody);
            }

        } catch (mailErr) {
            logger.error('Failed to send cancellation emails: ' + mailErr.message);
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @desc    Reschedule a flight
 * @route   POST /api/booking/flights/reschedule
 */
const rescheduleController = async (req, res) => {
    try {
        const { refID, paxId, travelDate, flightDetails, remarks } = req.body;
        
        // Find the local booking to get the correct internal GDS reference
        const localBooking = await Booking.findOne({ 
            $or: [{ ftdBookingRef: refID }, { providerReference: refID }, { pnr: refID }] 
        });

        if (!localBooking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // IDOR Security Check: Ensure the logged-in agent owns this booking
        if (localBooking.agentId && localBooking.agentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access: You do not have permission to reschedule this booking.' });
        }

        const ftdRef = localBooking.ftdBookingRef || refID;

        // FTD Reissue API call (Mirroring Section 10 of GDS Spec)
        let formattedTravelDate = travelDate || '';
        if (formattedTravelDate) {
            try {
                formattedTravelDate = ftdFlightService.formatDateYYYYMMDD(formattedTravelDate);
            } catch(e) {
                logger.warn('Date format issue for reschedule: ' + e.message);
            }
        }

        const result = await ftdFlightService.reschedule({
            refID: ftdRef,
            paxId: paxId || '',
            travelDate: formattedTravelDate,
            flightDetails: flightDetails || '',
            remarks: remarks || ''
        });

        // --- AUTOMATED NOTIFICATIONS ---
        try {
            const agent = await Agent.findById(localBooking.agentId);
            const pnr = localBooking.pnr || localBooking.providerReference || 'N/A';
            const route = `${localBooking.fromCity} ➔ ${localBooking.toCity}`;

            // 1. Email to Agent
            if (agent && agent.email) {
                const agentSubject = `🔄 RESCHEDULE REQUEST: ${route} [PNR: ${pnr}]`;
                const agentBody = `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background-color: #003580; padding: 20px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0;">Reschedule Request Received</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p>Dear ${agent.name},</p>
                            <p>A flight reschedule request for booking <b>${localBooking.ftdBookingRef}</b> has been received and queued in your Admin Dashboard.</p>
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #003580;">
                                <p style="margin: 0; font-weight: bold; color: #003580;">PNR: ${pnr}</p>
                                <p style="margin: 5px 0 0 0;">New Travel Date: ${travelDate || 'Not specified'}</p>
                                <p style="margin: 5px 0 0 0;">Requested Flights: ${flightDetails || 'N/A'}</p>
                            </div>
                            <p style="margin-top: 20px;">Our ticketing team is calculating the Fare Difference, Airline Penalty, and Admin Fees. You will receive an exact quotation shortly to review and accept.</p>
                            <br/><p>Regards,<br/><b>Goyafly Support Team</b></p>
                        </div>
                    </div>
                `;
                await sendEmail(agent.email, agentSubject, agentBody);
            }

            // 2. Email to User/Passenger
            const userEmail = localBooking.contactEmail || (localBooking.gstDetails?.email);
            if (userEmail) {
                const userSubject = `Flight Reschedule Request [PNR: ${pnr}]`;
                const userBody = `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background-color: #003580; padding: 20px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0;">Reschedule Requested</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p>Hello,</p>
                            <p>We have received your request to reschedule your flight from <b>${localBooking.fromCity}</b> to <b>${localBooking.toCity}</b>.</p>
                            <div style="border: 1px dashed #cccccc; padding: 20px; text-align: center; border-radius: 8px;">
                                <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Estimated New Date</p>
                                <h2 style="margin: 5px 0; color: #003580;">${travelDate || 'Pending Selection'}</h2>
                            </div>
                            <p style="margin-top: 20px; font-size: 13px; color: #666;">
                                Our team is currently processing this change with the airline. You will receive a separate confirmation once the new ticket is issued.
                            </p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                            <p style="text-align: center; color: #999; font-size: 11px;">Thank you for using Goyafly.</p>
                        </div>
                    </div>
                `;
                await sendEmail(userEmail, userSubject, userBody);
            }

        } catch (mailErr) {
            logger.error('Failed to send reschedule emails: ' + mailErr.message);
        }

        // --- CREATE RESCHEDULE REQUEST IN DB ---
        const rescheduleRecord = await RescheduleRequest.create({
            bookingId: localBooking._id,
            agentId: localBooking.agentId,
            paxIds: paxId ? paxId.split(',') : [],
            newTravelDate: travelDate || '',
            flightDetails: flightDetails || '',
            remarks: remarks || '',
            status: 'PENDING_QUOTE'
        });

        res.status(200).json({ success: true, data: result, request: rescheduleRecord });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @desc    Get fare rules
 * @route   POST /api/booking/flights/fare-rules
 */
const getFareRulesController = async (req, res) => {
    try {
        const { flightID } = req.body;
        if (!flightID) {
            return res.status(400).json({ success: false, message: 'flightID is required.' });
        }
        const result = await ftdFlightService.getFareRules(flightID);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @desc    FTD token diagnostics
 * @route   GET /api/booking/flights/token-status
 */
const getTokenStatusController = async (req, res) => {
    try {
        const status = await getTokenStatus();
        res.status(200).json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @desc    Search airports
 * @route   GET /api/booking/airports/search
 */
const getAirportsController = async (req, res) => {
    try {
        const { query } = req.query;
        const airports = await searchAirports(query);
        res.status(200).json({ success: true, data: airports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @desc    Generate and download E-Ticket PDF
 * @route   GET /api/booking/flights/download-ticket/:refID
 */
const downloadTicketController = async (req, res) => {
    try {
        const { refID } = req.params;
        const booking = await Booking.findOne({ 
            $or: [{ ftdBookingRef: refID }, { providerReference: refID }, { pnr: refID }] 
        });

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        // IDOR Security Check: Ensure the logged-in agent owns this booking
        if (booking.agentId && booking.agentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access: You do not have permission to download this ticket.' });
        }

        // Try to sync status before generating, but don't fail if GDS is down
        try {
            const ftdRef = booking.ftdBookingRef || booking.providerReference || booking.pnr;
            if (ftdRef && ftdRef.length > 3) {
                const ftdStatus = await ftdFlightService.getBookingStatus(ftdRef);
                if (ftdStatus.success) {
                    if (ftdStatus.pnr && ftdStatus.pnr !== booking.pnr) {
                        booking.pnr = ftdStatus.pnr;
                    }
                    if (ftdStatus.status) {
                        booking.status = ftdStatus.status;
                    }
                }
            }
        } catch (syncErr) {
            console.error('Download-time GDS sync failed (continuing with local data):', syncErr.message);
        }

        const ticketUrl = await generatePDFTicket(booking);
        booking.ticketUrl = ticketUrl;
        await booking.save();

        res.status(200).json({ success: true, url: ticketUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Generate/Download Invoice PDF
 * @route   GET /api/booking/flights/download-invoice/:refID
 */
const downloadInvoiceController = async (req, res) => {
    try {
        const { refID } = req.params;
        const booking = await Booking.findOne({ 
            $or: [{ ftdBookingRef: refID }, { providerReference: refID }, { pnr: refID }] 
        });

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        // IDOR Security Check: Ensure the logged-in agent owns this booking
        if (booking.agentId && booking.agentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access: You do not have permission to download this invoice.' });
        }
        
        const agent = await Agent.findById(booking.agentId);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found.' });

        const invoiceUrl = await generateInvoice(booking, agent);
        
        res.status(200).json({ success: true, url: invoiceUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    searchFlights,
    getFareDetails,
    verifyPriceController,
    getValidationFlagsController,
    bookFlightController,
    getBookingStatus,
    getSeatsController,
    cancelFlightController,
    rescheduleController,
    getFareRulesController,
    getTokenStatusController,
    getAirportsController,
    downloadTicketController,
    downloadInvoiceController,
    getBookingDetails
};
