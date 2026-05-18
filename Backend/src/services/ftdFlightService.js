const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const { getValidToken, getApiHeaders, getBookingHeaders, FTD_CONFIG } = require('./ftdTokenService');

/**
 * Helper: Clean and parse FTD JSON responses that may contain prepended PHP error warnings.
 */
const cleanFtdJson = (data) => {
    if (typeof data !== 'string' || !data) return data;
    try {
        // Find the boundary of the JSON object
        const firstOpen = data.indexOf('{');
        const lastClose = data.lastIndexOf('}');
        
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            const cleanStr = data.substring(firstOpen, lastClose + 1);
            try {
                return JSON.parse(cleanStr);
            } catch (innerParseError) {
                // If it looks like JSON but still fails to parse, log it and return data as-is
                logger.warn(`Failed to parse isolated JSON string: ${cleanStr.substring(0, 50)}...`);
            }
        }
    } catch (e) {
        logger.error(`Error in cleanFtdJson utility: ${e.message}`);
    }
    return data;
};

// Configured axios instance for FTD to handle resilient parsing
const ftdApi = axios.create({
    transformResponse: [
        ...axios.defaults.transformResponse,
        data => cleanFtdJson(data)
    ]
});

// Cache search results for 10 minutes
const searchCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Helper: Format date to YYYYMMDD as required by FTD
 */
const formatDateYYYYMMDD = (dateStr) => {
    if (!dateStr) return '';
    let d;
    if (dateStr instanceof Date) {
        d = dateStr;
    } else if (dateStr.includes('-') && dateStr.length > 8) {
        d = new Date(dateStr);
    } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else if (dateStr.length === 8 && !dateStr.includes('-')) {
        return dateStr; // Already YYYYMMDD
    } else {
        d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD or DD/MM/YYYY.`);
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};

/**
 * Helper: Format date to DD-MM-YYYY (for passenger DOB, passport dates)
 */
const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    let d;
    if (dateStr instanceof Date) {
        d = dateStr;
    } else {
        d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr; // Return as-is if unparseable
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};



// ============================================================
// 1. SEARCH FLIGHTS — postSearchFlightV2
// ============================================================

/**
 * Search flights using FTD postSearchFlightV2
 * 
 * FTD Request Body:
 * {
 *   "tripType": 0,      // 0=ONEWAY, 1=ROUNDTRIP
 *   "serType": 1,        // 1=DOM, 2=INTL
 *   "depCity": "DEL",
 *   "arrCity": "BLR",
 *   "onDate": "20260227",
 *   "reDate": "",
 *   "adt": 1,
 *   "chd": 0,
 *   "inf": 0,
 *   "cabin": "E",
 *   "fareType": "A"
 * }
 * 
 * Headers: x-api-key (token), mode
 */
const searchFlights = async (params) => {
    try {
        const {
            depCity, arrCity, onDate, reDate,
            adt = 1, chd = 0, inf = 0,
            cabin = 'E', tripType = 0, serType = 1,
            fareType = 'A', isSME = 0, isFlexi = 0
        } = params;

        if (!depCity || !arrCity || !onDate) {
            throw new Error('Missing required fields: depCity, arrCity, and onDate are mandatory.');
        }

        // Past date check (String-based comparison to avoid timezone ambiguity)
        const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        const formattedOnDate = formatDateYYYYMMDD(onDate);
        const searchOnDateStr = `${formattedOnDate.substring(0, 4)}-${formattedOnDate.substring(4, 6)}-${formattedOnDate.substring(6, 8)}`;

        if (searchOnDateStr < todayStr) {
            throw new Error(`Cannot search for flights in the past. (Search: ${searchOnDateStr}, Today: ${todayStr})`);
        }

        const formattedReDate = reDate ? formatDateYYYYMMDD(reDate) : '';

        // Caching disabled: FTD requires a fresh stateless refID per booking session.

        // FTD Section 5: reDate is required for Round Trip (tripType=1)
        const requestBody = {
            onDate: formattedOnDate,
            reDate: (parseInt(tripType) === 1) ? formattedReDate : '',   // send for RT, empty for OW
            adt: parseInt(adt) || 1,
            chd: parseInt(chd) || 0,
            inf: parseInt(inf) || 0,
            depCity: depCity.toUpperCase(),
            arrCity: arrCity.toUpperCase(),
            depDate: formattedOnDate,
            retDate: (parseInt(tripType) === 1) ? formattedReDate : '',
            AD: parseInt(adt) || 1,
            CH: parseInt(chd) || 0,
            IN: parseInt(inf) || 0,
            mode: parseInt(FTD_CONFIG.mode),
            isSME: parseInt(isSME) || 0,
            isFlexi: parseInt(isFlexi) || 0,
            tripType: parseInt(tripType),
            serType: parseInt(serType),
            cabin: cabin || 'E',
            fareType: fareType || 'A'
        };

        const token = await getValidToken();
        const headers = getApiHeaders(token);

        logger.info(`FTD Search Request Body (Hybrid): ${JSON.stringify(requestBody)}`);

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/postSearchFlightV2`,
            requestBody,
            { headers, timeout: 45000 }
        );

        const result = response.data;
        const refID = result?.Status?.refID || '';
        const rawFlights = (result?.results && Array.isArray(result.results)) 
            ? result.results 
            : (result?.data && Array.isArray(result.data)) ? result.data 
            : (result?.Flights && Array.isArray(result.Flights)) ? result.Flights : [];
        
        if (rawFlights.length === 0) {
            logger.warn(`FTD Search returned 0 flights for ${refID}. Response: ${JSON.stringify(result)}`);
        }

        // Helper to handle FTD's inconsistent array/object responses
        const ensureArray = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            // If it's an object like {"0": {...}, "1": {...}}, convert to array
            if (typeof val === 'object') {
                return Object.keys(val)
                    .filter(key => !isNaN(parseInt(key)))
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(key => val[key]);
            }
            return [];
        };

        const normalizedFlights = rawFlights.map((f, index) => {
            const onward = ensureArray(f.Flights?.Onward);
            const returnLeg = ensureArray(f.Flights?.Return);
            const firstSeg = onward[0] || returnLeg[0] || {};
            const lastSeg = onward[onward.length - 1] || firstSeg;

            // DIAGNOSTIC LOG for Same-Day/Early-Morning verification
            if (index < 3) {
                logger.info(`[GDS SYNC] Flight ${index}: DEP=${firstSeg.depDate}, ARR=${lastSeg.arrDate}, TimeStr=${firstSeg.depTime || 'N/A'}`);
            }

            // Resilient ID extraction (V2.5 prioritizes segment ID, Fare ID fallback)
            const fID = f.flightID || f.FlightID || f.ID || 
                        firstSeg.flightID || firstSeg.FlightID || 
                        f.Fare?.flightID || f.Fare?.FlightID ||
                        `FTD-${refID}-${index}`;

            const depCName = firstSeg.depCName || '';
            const depAName = firstSeg.depAName || '';
            const arrCName = lastSeg.arrCName || '';
            const arrAName = lastSeg.arrAName || '';
            
            // FTD V2.5 uses Fare.total.netfare
            const fare = f.Fare || {};
            const total = fare.total || {};
            const currentNetfare = parseFloat(fare.netfare || total.netfare || 0);
            const currentBase = parseFloat(fare.base || total.base || 0);
            const currentTax = parseFloat(fare.tax || total.tax || 0);

            const formatTime = (dt) => {
                if (!dt || dt.length < 12) return '--:--';
                return `${dt.substring(8, 10)}:${dt.substring(10, 12)}`;
            };

            return {
                id: fID,
                flightID: fID,
                refID: refID,
                airline: firstSeg.airName || 'Airline',
                airlineIata: firstSeg.airCode || '',
                flightNumber: `${firstSeg.airCode || ''}-${firstSeg.flightNo || ''}`,
                from: firstSeg.depCode || depCity,
                to: firstSeg.arrCode || arrCity,
                departureTime: formatTime(firstSeg.depDate),
                arrivalTime: formatTime(lastSeg.arrDate),
                price: currentNetfare,
                baseFare: currentBase,
                tax: currentTax,
                netfare: currentNetfare,
                refundType: f.Fare?.refundType === 'R' ? 'Refundable' : (f.Fare?.refundType === 'P' ? 'P Refundable' : 'Non-Refundable'),
                refType: f.Fare?.refundType || 'N',
                baggage: {
                    checkin: f.Fare?.bagCkin || '15KG',
                    cabin: f.Fare?.bagCbin || '7KG'
                },
                depCName, depAName, arrCName, arrAName,
                depTer: firstSeg.depTer || '',
                arrTer: lastSeg.arrTer || '',
                airCodeOp: firstSeg.airCodeOp || firstSeg.airCode || '',
                airNameOp: firstSeg.airNameOp || firstSeg.airName || '',
                rawSegments: onward
            };
        });

        const finalResult = { refID, flights: normalizedFlights };
        return finalResult;

    } catch (error) {
        logger.error('FTD Search Error: ' + (error.response?.data?.message || error.message));
        throw error;
    }
};


// ============================================================
// 2. FARE DETAILS — postFareDetails
// ============================================================

/**
 * Get fare details for a selected flight.
 * Called when agent clicks "View Price".
 * 
 * FTD Request: { "flightID": 57210, "refID": "FTD48QYATRPQ868" }
 * Headers: x-api-key (token), mode
 */
const getFareDetails = async (flightID, refID) => {
    try {
        if (!flightID || !refID) {
            throw new Error('flightID and refID are required for fare details.');
        }

        const token = await getValidToken();
        const headers = getApiHeaders(token);

        logger.info(`FTD Fare Details: flightID=${flightID}, refID=${refID}`);

        const parsedID = parseInt(flightID);
        if (isNaN(parsedID) || parsedID <= 0) {
            throw new Error(`Invalid Flight ID: ${flightID}. Numeric ID required by GDS.`);
        }

        const requestBody = { flightID: parsedID, refID };
        logger.info(`FTD Fare Details Request: ${JSON.stringify(requestBody)}`);

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/postFareDetails`,
            requestBody,
            { headers, timeout: 30000 }
        );

        const data = response.data;
        if (data?.code === 'error' || data?.Status?.code === 0) {
            throw new Error(data.error_msg || data.Status?.message || 'FTD Fare Details Error');
        }

        // Normalize data to ensure refType is present for each fare option
        if (data?.results && Array.isArray(data.results)) {
            data.results = data.results.map(fare => ({
                ...fare,
                refType: fare.Fare?.refundType || fare.refundType || 'N'
            }));
        } else if (Array.isArray(data)) {
            // Some responses return an array directly
            return data.map(fare => ({
                ...fare,
                refType: fare.Fare?.refundType || fare.refundType || 'N'
            }));
        }

        return data;

    } catch (error) {
        logger.error('FTD Fare Details Error: ' + (error.response?.data || error.message));
        throw error;
    }
};


// ============================================================
// 3. PRICE VERIFY — postPriceVerify
// ============================================================

/**
 * Verify price before booking.
 * 
 * FTD Request: { "flightID": 57215, "refID": "FTD48QYATRPQ868" }
 * Headers: x-api-key (token), mode
 */
const verifyPrice = async (flightID, refID, originalNetfare) => {
    try {
        if (!flightID || !refID) {
            throw new Error('flightID and refID are required for price verification.');
        }

        const token = await getValidToken();
        const headers = getApiHeaders(token);

        // Strip any whitespace or hidden characters from IDs
        const cleanFlightID = String(flightID).trim();
        const cleanRefID = String(refID).trim();

        logger.info(`FTD Price Verify Attempt: flightID=${cleanFlightID}, refID=${cleanRefID}`);

        const parsedID = parseInt(cleanFlightID);
        if (isNaN(parsedID) || parsedID <= 0) {
            throw new Error(`Invalid Flight ID: ${cleanFlightID} for price verification.`);
        }

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/postPriceVerify`,
            { flightID: parsedID, refID: cleanRefID },
            { headers, timeout: 30000 }
        );

        const data = response.data;

        // FTD Error Detection
        if (data?.code === 'error' || data?.Status?.code === 0 || data?.error_msg || data?.Status?.message?.toLowerCase().includes('mismatch')) {
            const msg = data.error_msg || data.Status?.message || data.message || 'FTD Price Verify Error';
            logger.error(`FTD GDS Rejected Price Verify: ${msg} (Data: ${JSON.stringify(data)})`);
            throw new Error(msg);
        }

        // Extract netfare from FTD response for comparison
        const currentNetfare = data?.netfare || data?.netFare || data?.NetFare ||
                               data?.data?.netfare || 0;

        const fareDiff = currentNetfare - (originalNetfare || 0);
        const verified = fareDiff === 0;

        return {
            verified,
            currentNetfare,
            originalNetfare: originalNetfare || 0,
            fareDiff,
            warning: !verified
                ? (fareDiff > 0
                    ? `⚠️ Price increased by ₹${fareDiff.toFixed(2)}. Original: ₹${originalNetfare}, Current: ₹${currentNetfare}.`
                    : `ℹ️ Price decreased by ₹${Math.abs(fareDiff).toFixed(2)}. Original: ₹${originalNetfare}, Current: ₹${currentNetfare}.`)
                : null,
            ftdResponse: data
        };

    } catch (error) {
        const ftdErrorMsg = error.response?.data?.error_msg || error.response?.data?.Status?.message || error.message;
        logger.error('FTD Price Verify Service Exception: ' + ftdErrorMsg);
        throw error;
    }
};


// ============================================================
// 4. BOOK FLIGHT — bookFlight
// ============================================================

/**
 * Book a flight via FTD.
 * 
 * FTD Domestic Request:
 * {
 *   "passenger": [{ "title":"Mr", "fName":"SEQ One", "lName":"Booking II", "pType":"A", "gender":"M", "dob":"02-02-1985" }],
 *   "refID": "FTD48QYATRPQ868",
 *   "clientID": "10390",
 *   "flightID": 57215,
 *   "mobile": "9891186874",
 *   "email": "admin@gmail.com",
 *   "gst": { "number":"29OUI46545", "email":"supp@gmail.com", "mobile":"8803333333", "address":"Bangalore", "company":"XYZ Company" }
 * }
 * 
 * FTD International adds per-passenger: ppNo, ppIss, ppExp, ppNat
 * FTD SSR adds per-passenger: ssrInfo { Onward: { Meal[], Seat[], Bagg }, Return: { ... } }
 * 
 * Headers: apikey, mode (NOT x-api-key)
 */
const bookFlight = async (bookingData) => {
    try {
        const {
            passenger, refID, clientID, flightID,
            mobile, mrd, email, gst, first_pax_pan_no
        } = bookingData;

        if (!refID || !flightID) {
            throw new Error('refID and flightID are required for booking.');
        }
        if (!passenger || !Array.isArray(passenger) || passenger.length === 0) {
            throw new Error('At least one passenger is required.');
        }

        // Build exact FTD booking payload
        const requestBody = {
            passenger: passenger.map(pax => {
                const paxData = {
                    title: pax.title,
                    fName: pax.fName,
                    lName: pax.lName,
                    pType: pax.pType,   // A=Adult, C=Child, I=Infant
                    gender: pax.gender,
                    dob: pax.dob        // DD-MM-YYYY format
                };

                // International passport fields
                if (pax.ppNo) {
                    paxData.ppNo = pax.ppNo;
                    paxData.ppIss = pax.ppIss;    // DD-MM-YYYY
                    paxData.ppExp = pax.ppExp;    // DD-MM-YYYY
                    paxData.ppNat = pax.ppNat || 'IN';
                }

                // SSR: support both Baggage.Onward (Section 9) and legacy ssrInfo
                if (pax.Baggage) {
                    paxData.Baggage = pax.Baggage;
                } else if (pax.ssrInfo) {
                    paxData.ssrInfo = pax.ssrInfo;
                }

                return paxData;
            }),
            refID,
            clientID: clientID || FTD_CONFIG.agentId,
            flightID: parseInt(flightID),
            mobile,
            // mrd: mobile with country code (FTD Section 8: Mandatory)
            mrd: mrd || (mobile ? (mobile.startsWith('+') ? mobile : `+91${mobile}`) : ''),
            email
        };

        // GST details (if applicable)
        if (gst) {
            requestBody.gst = {
                number: gst.number,
                email: gst.email,
                mobile: gst.mobile,
                address: gst.address,
                company: gst.company
            };
        }

        // PAN number (if required)
        if (first_pax_pan_no) {
            requestBody.first_pax_pan_no = first_pax_pan_no;
        }

         const token = await getValidToken();
        const headers = {
            ...getBookingHeaders(),
            'x-api-key': token 
        };

        logger.info(`FTD Book Request Payload: ${JSON.stringify(requestBody)}`);
        logger.info(`FTD Book Headers: ${JSON.stringify(headers)}`);
        logger.info(`FTD Book: refID=${refID}, flightID=${flightID}, passengers=${passenger.length}`);

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/bookFlight`,
            requestBody,
            { headers, timeout: 60000 }
        );

        logger.info(`FTD Booking Response: ${JSON.stringify(response.data).substring(0, 200)}`);
        return response.data;

    } catch (error) {
        logger.error('FTD Booking Error: ' + (error.response?.data || error.message));
        throw error;
    }
};


// ============================================================
// 5. BOOKING STATUS — bookingStatus
// ============================================================

/**
 * Check booking status.
 * 
 * FTD Request: { "refID": "FTD48QZ46TTUMZK" }
 * Headers: apikey, mode
 */
const checkBookingStatus = async (refID) => {
    try {
        if (!refID) {
            throw new Error('refID is required to check booking status.');
        }

        const headers = getBookingHeaders();

        logger.info(`FTD Status Check: refID=${refID}`);

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/bookingStatus`,
            { 
                refID, 
                agentid: FTD_CONFIG.agentId,
                Apikey: FTD_CONFIG.apiKey,
                Mode: FTD_CONFIG.mode
            },
            { headers, timeout: 30000 }
        );

        logger.info(`FTD Status Check Response [${refID}]: ${JSON.stringify(response.data)}`);
        return response.data;

    } catch (error) {
        logger.error('FTD Status Check Error: ' + (error.response?.data || error.message));
        throw error;
    }
};


// ============================================================
// 6. SEAT MAP — seats
// ============================================================

/**
 * Get seat map for a flight.
 * 
 * FTD Request: { "flightID": 154217, "refID": "...", "passenger": [{title, fName, lName, pType}] }
 * Headers: x-api-key (token), mode
 */
const getSeatMap = async (flightID, refID, passenger) => {
    try {
        const token = await getValidToken();
        const headers = getApiHeaders(token);

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/seats`,
            { flightID: parseInt(flightID), refID, passenger },
            { headers, timeout: 30000 }
        );

        return response.data;

    } catch (error) {
        logger.error('FTD Seat Map Error: ' + (error.response?.data || error.message));
        throw error;
    }
};


// ============================================================
// 7. CANCEL FLIGHT — cancelFlight
// ============================================================

/**
 * Cancel a booking.
 * 
 * FTD Request: { "refID": "...", "paxId": "691182", "paxIdr": "", "canMode": 5, "canRemarks": "..." }
 * Headers: apikey, mode
 */
const cancelFlight = async (cancelData) => {
    try {
        const headers = getBookingHeaders();

        logger.info(`FTD Cancel: refID=${cancelData.refID}, paxId=${cancelData.paxId}`);

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/cancelFlight`,
            cancelData,
            { headers, timeout: 30000 }
        );

        return response.data;

    } catch (error) {
        logger.error('FTD Cancel Error: ' + (error.response?.data || error.message));
        throw error;
    }
};


// ============================================================
// 8. RESCHEDULE — reschedule
// ============================================================

/**
 * Reschedule/Reissue a booking.
 * 
 * FTD Request: { "refID", "paxId", "paxIdr", "travelDate", "flightDetail", ... }
 * Headers: apikey, mode
 */
const reschedule = async (reissueData) => {
    try {
        const headers = getBookingHeaders();

        logger.info(`FTD Reschedule: refID=${reissueData.refID}`);

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/reschedule`,
            reissueData,
            { headers, timeout: 30000 }
        );

        return response.data;

    } catch (error) {
        logger.error('FTD Reschedule Error: ' + (error.response?.data || error.message));
        throw error;
    }
};


// ============================================================
// 9. FARE RULES — postFareRules
// ============================================================

/**
 * Get fare rules for a flight.
 * 
 * FTD Request: { "flightID": 6060 }
 * Headers: x-api-key (token), mode
 */
const getFareRules = async (flightID) => {
    try {
        const token = await getValidToken();
        const headers = getApiHeaders(token);

        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/postFareRules`,
            { flightID: parseInt(flightID) },
            { headers, timeout: 30000 }
        );

        return response.data;

    } catch (error) {
        logger.error('FTD Fare Rules Error: ' + (error.response?.data || error.message));
        throw error;
    }
};

/**
 * Retrieve only the Validation Node for a given flightID/refID.
 * This is used by the frontend to decide which extra fields (GST, PAN, docs) are required.
 */
const getValidationFlags = async (flightID, refID) => {
    try {
        if (!flightID || !refID) {
            throw new Error('flightID and refID are required for validation flags.');
        }
        const token = await getValidToken();
        const headers = getApiHeaders(token);
        const response = await ftdApi.post(
            `${FTD_CONFIG.baseUrl}/postPriceVerify`,
            { flightID: parseInt(flightID), refID },
            { headers, timeout: 30000 }
        );
        const data = response.data;
        const validation = data?.validation || data?.Validation || {};
        return validation;
    } catch (error) {
        logger.error('FTD Validation Flags Error: ' + (error.response?.data || error.message));
        throw error;
    }
};

/**
 * Compute fare difference between original netfare (from search) and current netfare (from price verify).
 */
const extractFareDiff = (originalNetfare, currentNetfare) => {
    const orig = parseFloat(originalNetfare) || 0;
    const curr = parseFloat(currentNetfare) || 0;
    return curr - orig;
};


module.exports = {
    searchFlights,
    getFareDetails,
    verifyPrice,
    bookFlight,
    checkBookingStatus,
    getSeatMap,
    cancelFlight,
    reschedule,
    getFareRules,
    formatDateYYYYMMDD,
    formatDateDDMMYYYY,
    getValidationFlags,
    extractFareDiff,
    cleanFtdJson
};
