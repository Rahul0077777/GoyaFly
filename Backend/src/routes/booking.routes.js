const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Legacy booking controller (hotels, buses, trains, wallet payment)
const bookingController = require('../controllers/booking.controller');
const {
    getFlights, bookFlight, createFlightOrder, payFromWallet, getAirports, getPopularAirports,
    getHotels, bookHotel,
    getBuses, bookBus,
    getTrains, bookTrain,
    getAllBookings, getAgentBookings, createServiceRequest
} = bookingController;

const { submitGroupFareController } = require('../controllers/groupFare.controller');

// FTD Flight controller (production GDS integration)
const ftdController = require('../controllers/ftdFlight.controller');
const {
    searchFlights: ftdSearchFlights,
    getFareDetails: ftdGetFareDetails,
    verifyPriceController: ftdVerifyPrice,
    bookFlightController: ftdBookFlight,
    getBookingStatus: ftdGetBookingStatus,
    getSeatsController: ftdGetSeats,
    cancelFlightController: ftdCancelFlight,
    rescheduleController: ftdReschedule,
    getFareRulesController: ftdFareRules,
    getTokenStatusController: ftdTokenStatus,
    getAirportsController: ftdGetAirports,
    getValidationFlagsController: ftdGetValidationFlags,
    downloadTicketController: ftdDownloadTicket,
    downloadInvoiceController: ftdDownloadInvoice,
    getBookingDetails: ftdGetBookingDetails
} = ftdController;

// 🔒 Lock down all routes below this line to logged-in users
router.use(protect);

// =============================================
// FTD FLIGHT ROUTES (Production GDS)
// =============================================
router.post('/flights/search', ftdSearchFlights);                // postSearchFlightV2
router.post('/flights/fare-details', ftdGetFareDetails);         // postFareDetails
router.post('/flights/verify-price', ftdVerifyPrice);            // postPriceVerify
router.post('/flights/book', ftdBookFlight);                     // bookFlight
router.get('/flights/booking-status/:ref', ftdGetBookingStatus); // bookingStatus
router.post('/flights/seats', ftdGetSeats);                      // seats
router.post('/flights/cancel', ftdCancelFlight);                 // cancelFlight
router.post('/flights/reschedule', ftdReschedule);               // reschedule
router.post('/flights/fare-rules', ftdFareRules);                // postFareRules
router.post('/flights/validation-flags', ftdGetValidationFlags); // Validation Node
router.get('/flights/token-status', ftdTokenStatus);             // Token diagnostics
router.get('/flights/download-ticket/:refID', ftdDownloadTicket);
router.get('/flights/download-invoice/:refID', ftdDownloadInvoice);
router.get('/flights/details/:ref', ftdGetBookingDetails);

router.post('/flights/accept-reschedule-quote', bookingController.acceptRescheduleQuote);

// =============================================
// LEGACY FLIGHT ROUTES (Now proxied to FTD)
// =============================================
router.get('/flights/search', ftdSearchFlights);                  // GET search uses FTD
router.post('/flights/create-order', createFlightOrder);         // Razorpay order
router.post('/flights/pay-wallet', payFromWallet);               // Wallet payment
router.post('/group-fare', submitGroupFareController);           // Submit Group Fares form
router.post('/service-request', createServiceRequest);           // Submit Holiday/Visa/Insurance request

// =============================================
// AIRPORT ROUTES
// =============================================
router.get('/airports/search', ftdGetAirports);
router.get('/airports/popular', getPopularAirports);

// =============================================
// HOTEL, BUS, TRAIN ROUTES
// =============================================
router.get('/hotels/search', getHotels);
router.post('/hotels/book', bookHotel);

router.get('/buses/search', getBuses);
router.post('/buses/book', bookBus);

router.get('/trains/search', getTrains);
router.post('/trains/book', bookTrain);

// =============================================
// BOOKING HISTORY
// =============================================
router.get('/history/agent', getAgentBookings);
router.get('/history/all', authorizeRoles('SuperAdmin', 'Manager'), getAllBookings);

module.exports = router;
