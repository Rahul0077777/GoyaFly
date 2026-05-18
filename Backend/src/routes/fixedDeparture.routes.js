const express = require('express');
const router = express.Router();
const { searchFlights, bookFlight, getAgentBookings, getAvailableDates } = require('../controllers/fixedDeparture.controller');
const { protect } = require('../middlewares/auth.middleware');

// All agent routes require authentication
router.use(protect);

router.get('/search', searchFlights);
router.get('/available-dates', getAvailableDates);
router.post('/book', bookFlight);
router.get('/my-bookings', getAgentBookings);

module.exports = router;
