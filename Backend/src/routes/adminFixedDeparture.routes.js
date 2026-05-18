const express = require('express');
const router = express.Router();
const { 
    createFlight, updateFlight, deleteFlight, getAllFlights,
    confirmBooking, cancelBooking, verifyPayment, getAllBookings 
} = require('../controllers/fixedDeparture.controller');
const { protectAdmin } = require('../middlewares/adminAuth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// All admin routes require authentication and high-privilege roles
router.use(protectAdmin, authorizeRoles('SuperAdmin', 'Manager'));

router.get('/', getAllFlights);
router.post('/', upload.single('airlineLogo'), createFlight);
router.put('/:id', upload.single('airlineLogo'), updateFlight);
router.delete('/:id', deleteFlight);

router.get('/bookings', getAllBookings);
router.put('/bookings/:id/confirm', confirmBooking);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/bookings/:id/verify-payment', verifyPayment);

module.exports = router;
