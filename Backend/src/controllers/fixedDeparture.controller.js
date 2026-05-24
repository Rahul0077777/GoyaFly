const FixedDeparture = require('../Models/FixedDeparture.model');
const FixedDepartureBooking = require('../Models/FixedDepartureBooking.model');
const Agent = require('../Models/Agent.model');
const Transaction = require('../Models/Transaction.model');
const mongoose = require('mongoose');
const { sendEmail } = require('../utils/notifier');

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

// @desc    Create a new fixed departure flight
// @route   POST /api/admin/fixed-departures
const createFlight = async (req, res) => {
    try {
        const flightData = { ...req.body };
        if (req.file) {
            flightData.airlineLogo = `uploads/${req.file.filename}`;
        }
        const flight = await FixedDeparture.create(flightData);
        res.status(201).json({ success: true, data: flight });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a fixed departure flight
// @route   PUT /api/admin/fixed-departures/:id
const updateFlight = async (req, res) => {
    try {
        const flightData = { ...req.body };
        if (req.file) {
            flightData.airlineLogo = `uploads/${req.file.filename}`;
        }
        const flight = await FixedDeparture.findByIdAndUpdate(req.params.id, flightData, { new: true, runValidators: true });
        if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
        res.status(200).json({ success: true, data: flight });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a fixed departure flight
// @route   DELETE /api/admin/fixed-departures/:id
const deleteFlight = async (req, res) => {
    try {
        const flight = await FixedDeparture.findByIdAndDelete(req.params.id);
        if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
        res.status(200).json({ success: true, message: 'Flight deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Confirm a booking request (Admin)
// @route   PUT /api/admin/fixed-departures/bookings/:id/confirm
const confirmBooking = async (req, res) => {
    const { pnr, ticketNumber } = req.body;
    try {
        const booking = await FixedDepartureBooking.findById(req.params.id).populate('flightId');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        
        if (!booking.paymentVerified) {
            return res.status(400).json({ success: false, message: 'Please verify payment before issuing the ticket' });
        }

        if (booking.status === 'Confirmed') {
            return res.status(400).json({ success: false, message: 'Booking already confirmed' });
        }

        booking.status = 'Confirmed';
        booking.pnr = pnr;
        booking.ticketNumber = ticketNumber;
        await booking.save();

        // Reduce available seats (Infants don't take a seat)
        const flight = await FixedDeparture.findById(booking.flightId._id);
        const seatsToDeduct = (booking.adults + booking.children) || booking.passengers.length;
        flight.availableSeats -= seatsToDeduct;
        if (flight.availableSeats <= 0) {
            flight.status = 'Sold Out';
        }
        await flight.save();

        // Auto Generate PDF Ticket
        const agent = await Agent.findById(booking.agentId);
        const adapterData = {
            pnr: booking.pnr,
            providerReference: booking.pnr,
            ftdBookingRef: `FTD-FIX-${booking._id}`,
            createdAt: booking.createdAt,
            fromCity: flight.fromCity,
            toCity: flight.toCity,
            airline: flight.airlineName,
            totalCost: booking.totalFare,
            netfare: booking.totalFare,
            passengerDetails: booking.passengers.map(p => ({
                title: p.gender === 'Female' ? 'Ms' : 'Mr',
                fName: p.name.split(' ')[0],
                lName: p.name.split(' ').slice(1).join(' ') || '',
                ticketNo: booking.ticketNumber
            })),
            flightDetails: [{
                depCode: flight.fromCity.substring(0, 3).toUpperCase(),
                arrCode: flight.toCity.substring(0, 3).toUpperCase(),
                airName: flight.airlineName,
                airCode: flight.airlineName.substring(0, 2).toUpperCase(),
                flightNo: flight.flightNumber,
                depCityName: flight.fromCity,
                arrCityName: flight.toCity,
                depDate: flight.departureDate,
                arrDate: flight.departureDate,
                depTerminal: '1',
                arrTerminal: '1',
                duration: `${flight.departureTime} - ${flight.arrivalTime}`
            }]
        };

        const { generatePDFTicket } = require('../utils/ticketGenerator');
        const pdfUrl = await generatePDFTicket(adapterData);
        booking.pdfUrl = pdfUrl;
        await booking.save();

        // Send Email Confirmation with Attached PDF
        if (agent && agent.emailAddress) {
            const path = require('path');
            const absPath = path.join(__dirname, '../../', pdfUrl);
            const subject = `✈️ Goyafly B2B Portal — Fixed Departure E-Ticket Confirmed [PNR: ${booking.pnr}]`;
            const bodyHtml = `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                    <div style="border-bottom: 2px solid #1D4171; padding-bottom: 20px; margin-bottom: 20px;">
                        <h2 style="color: #1D4171; margin: 0;">Fixed Departure Ticket Confirmed!</h2>
                        <p style="margin: 5px 0 0; color: #F07E21; font-weight: bold;">PNR: ${booking.pnr}</p>
                    </div>
                    <p>Dear <strong>${agent.agencyName || agent.agentName || 'Travel Partner'}</strong>,</p>
                    <p>Your Fixed Departure booking request has been fully processed and confirmed by our operations team.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; color: #1D4171;">Flight Itinerary</h3>
                        <p style="margin: 5px 0;"><strong>Flight:</strong> ${flight.airlineName} (${flight.flightNumber})</p>
                        <p style="margin: 5px 0;"><strong>Route:</strong> ${flight.fromCity} ✈️ ${flight.toCity}</p>
                        <p style="margin: 5px 0;"><strong>Timing:</strong> ${flight.departureTime} - ${flight.arrivalTime}</p>
                        <p style="margin: 5px 0;"><strong>Ticket Number:</strong> ${booking.ticketNumber}</p>
                    </div>

                    <p>Your official E-Ticket PDF is attached to this email. You can also download it anytime from your agent dashboard under <strong>Fixed Departure History</strong>.</p>
                    <br/>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="margin: 0; font-weight: bold;">Best Regards,</p>
                        <p style="margin: 0; color: #1D4171; font-weight: bold;">Goyafly B2B Travel Portal</p>
                    </div>
                </div>
            `;
            await sendEmail(agent.emailAddress, subject, bodyHtml, [
                { filename: `Ticket-${booking.pnr}.pdf`, path: absPath }
            ]);
        }

        // Create In-App Notification for Agent
        const Notification = require('../Models/Notification.model');
        await Notification.create({
            agentId: booking.agentId,
            title: `Fixed Departure Confirmed: ${booking.pnr}`,
            message: `Your ticket for ${flight.airlineName} (${flight.flightNumber}) from ${flight.fromCity} to ${flight.toCity} has been issued. PNR: ${booking.pnr}.`,
            type: 'SUCCESS',
            link: '/agent/fixed-departure-history'
        });

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify payment for a booking request (Admin)
// @route   PUT /api/admin/fixed-departures/bookings/:id/verify-payment
const verifyPayment = async (req, res) => {
    try {
        const booking = await FixedDepartureBooking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        
        booking.paymentVerified = true;
        await booking.save();

        res.status(200).json({ success: true, message: 'Payment verified successfully', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cancel/Reject a booking request (Admin)
// @route   PUT /api/admin/fixed-departures/bookings/:id/cancel
const cancelBooking = async (req, res) => {
    try {
        const { remarks } = req.body || {};
        const booking = await FixedDepartureBooking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        
        if (booking.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Booking already cancelled' });
        }

        booking.status = 'Cancelled';
        if (remarks) {
            booking.remarks = remarks;
        }
        await booking.save();

        // Refund Agent
        const agent = await Agent.findById(booking.agentId);
        if (agent) {
            agent.walletBalance += booking.totalFare;
            await agent.save();

            // Create Refund Transaction
            await Transaction.create({
                agentId: agent._id,
                transactionType: 'CREDIT',
                purpose: 'CANCEL_REFUND',
                amount: booking.totalFare,
                balanceAfterTransaction: agent.walletBalance,
                referenceId: `REF-CAN-${booking._id}-${Date.now()}`,
                status: 'SUCCESS',
                remark: `Refund for Fixed Departure Booking Cancelled (${booking._id})${remarks ? ` - Reason: ${remarks}` : ''}`
            });
        }

        // Create In-App Notification for Agent
        const Notification = require('../Models/Notification.model');
        await Notification.create({
            agentId: booking.agentId,
            title: `Fixed Departure Cancelled & Refunded`,
            message: `Your booking request (${booking._id}) has been cancelled by admin. ₹${booking.totalFare} has been credited back to your wallet.${remarks ? ` Reason: ${remarks}` : ''}`,
            type: 'WARNING',
            link: '/agent/fixed-departure-history'
        });

        res.status(200).json({ success: true, message: 'Booking cancelled and refunded' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// AGENT CONTROLLERS
// ==========================================

// @desc    Get available departure dates for a given route (Agent)
// @route   GET /api/fixed-departures/available-dates
const getAvailableDates = async (req, res) => {
    try {
        const { from, to } = req.query;
        let query = { isActive: true, status: 'Available' };
        
        if (from) query.fromCity = { $regex: from, $options: 'i' };
        if (to) query.toCity = { $regex: to, $options: 'i' };

        const flights = await FixedDeparture.find(query).select('departureDate');
        const dates = [...new Set(flights.map(f => {
            const d = new Date(f.departureDate);
            return d.toISOString().split('T')[0];
        }))].sort();

        res.status(200).json({ success: true, data: dates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Search flights (Agent)
// @route   GET /api/fixed-departures/search
const searchFlights = async (req, res) => {
    try {
        const { from, to, date } = req.query;
        let query = { isActive: true, status: 'Available' };
        
        if (from) query.fromCity = { $regex: from, $options: 'i' };
        if (to) query.toCity = { $regex: to, $options: 'i' };
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.departureDate = { $gte: startOfDay, $lte: endOfDay };
        }

        const flights = await FixedDeparture.find(query).sort({ departureDate: 1 });
        res.status(200).json({ success: true, data: flights });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Request a booking (Agent)
// @route   POST /api/fixed-departures/book
const bookFlight = async (req, res) => {
    const { flightId, passengers, isInternational, adults, children, infants } = req.body;
    try {
        const flight = await FixedDeparture.findById(flightId);
        if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
        
        const numAdults = parseInt(adults) || 1;
        const numChildren = parseInt(children) || 0;
        const numInfants = parseInt(infants) || 0;
        const seatConsumingPax = numAdults + numChildren;

        if (flight.availableSeats < seatConsumingPax) {
            return res.status(400).json({ success: false, message: 'Insufficient seats available' });
        }

        const agent = await Agent.findById(req.user._id);
        const totalFare = (numAdults * flight.fare) + (numChildren * (flight.childFare || 0)) + (numInfants * (flight.infantFare || 0));

        const isIntl = isInternational || flight.isInternational || false;

        // DOB Validation
        for (const pax of passengers) {
            if (isIntl) {
                if (!pax.dob) return res.status(400).json({ success: false, message: `DOB is mandatory for all international passengers (${pax.firstName} ${pax.lastName})` });
            } else {
                if ((pax.passengerType === 'Child' || pax.passengerType === 'Infant') && !pax.dob) {
                    return res.status(400).json({ success: false, message: `DOB is mandatory for Child/Infant passengers (${pax.firstName} ${pax.lastName})` });
                }
            }
        }

        if (agent.walletBalance < totalFare) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        const processedPassengers = passengers.map(pax => ({
            ...pax,
            name: pax.name || `${pax.firstName} ${pax.lastName}`.trim()
        }));

        // Create Booking
        const booking = await FixedDepartureBooking.create({
            agentId: agent._id,
            flightId: flight._id,
            adults: numAdults,
            children: numChildren,
            infants: numInfants,
            passengers: processedPassengers,
            totalFare,
            status: 'Pending',
            paymentVerified: false,
            isInternational: isIntl
        });

        // Deduct Wallet
        agent.walletBalance -= totalFare;
        await agent.save();

        // Create Transaction
        await Transaction.create({
            agentId: agent._id,
            transactionType: 'DEBIT',
            purpose: 'TICKET_BOOKING',
            amount: totalFare,
            balanceAfterTransaction: agent.walletBalance,
            referenceId: booking._id,
            status: 'SUCCESS',
            paymentMethod: 'WALLET',
            remark: `Booking Request for Fixed Departure: ${flight.flightNumber} (${flight.fromCity} -> ${flight.toCity})`
        });

        // Send Email Confirmation to Agent & Admin
        const dateStr = new Date(flight.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const passengerRows = processedPassengers.map(pax => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; border: 1px solid #eee;">${pax.firstName} ${pax.lastName}</td>
                <td style="padding: 10px; border: 1px solid #eee;">${pax.dob}</td>
                <td style="padding: 10px; border: 1px solid #eee;">${pax.gender}</td>
                <td style="padding: 10px; border: 1px solid #eee;">${pax.mobileNumber || 'N/A'}</td>
                <td style="padding: 10px; border: 1px solid #eee;">${pax.email || 'N/A'}</td>
                ${isIntl ? `<td style="padding: 10px; border: 1px solid #eee;">${pax.passportNumber || 'N/A'}</td><td style="padding: 10px; border: 1px solid #eee;">${pax.nationality || 'IN'}</td>` : ''}
            </tr>
        `).join('');

        const agentEmailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; padding: 30px;">
            <div style="border-bottom: 2px solid #1D4171; padding-bottom: 20px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #1D4171;">Fixed Departure Booking Request Received</h2>
                <p style="margin: 5px 0 0; color: #F07E21; font-weight: bold;">Booking Ref: ${booking._id}</p>
            </div>
            <p>Dear <strong>${agent.agencyName || agent.agentName || 'Travel Partner'}</strong>,</p>
            <p>We have successfully received your Fixed Departure booking request. Our operations team is currently reviewing your application and will issue the confirmed PNR and ticket numbers shortly.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin-top: 0; color: #1D4171;">Flight Summary ${isIntl ? '(International)' : '(Domestic)'}</h3>
                <p style="margin: 5px 0;"><strong>Airline:</strong> ${flight.airlineName} (${flight.flightNumber})</p>
                <p style="margin: 5px 0;"><strong>Route:</strong> ${flight.fromCity} ✈️ ${flight.toCity}</p>
                <p style="margin: 5px 0;"><strong>Departure Date:</strong> ${dateStr}</p>
                <p style="margin: 5px 0;"><strong>Timing:</strong> ${flight.departureTime} - ${flight.arrivalTime}</p>
            </div>

            <div style="margin: 20px 0;">
                <h3 style="color: #1D4171; margin-bottom: 10px;">Passenger Manifest & Contact Details</h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background-color: #1D4171; color: white;">
                        <tr>
                            <th style="padding: 10px;">Name</th>
                            <th style="padding: 10px;">DOB</th>
                            <th style="padding: 10px;">Gender</th>
                            <th style="padding: 10px;">Mobile</th>
                            <th style="padding: 10px;">Email</th>
                            ${isIntl ? `<th style="padding: 10px;">Passport No</th><th style="padding: 10px;">Nationality</th>` : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${passengerRows}
                    </tbody>
                </table>
            </div>

            <div style="background-color: #fff7ed; border-left: 4px solid #F07E21; padding: 15px; margin: 20px 0; border-radius: 0 12px 12px 0;">
                <p style="margin: 0; color: #c2410c;"><strong>Payment Status:</strong> ₹${totalFare} has been successfully deducted from your wallet balance.</p>
            </div>

            <p>You can track the live status of your booking anytime from your agent dashboard under <strong>Fixed Departure History</strong>.</p>
            <br/>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="margin: 0; font-weight: bold;">Best Regards,</p>
                <p style="margin: 0; color: #1D4171; font-weight: bold;">Goyafly B2B Travel Portal</p>
            </div>
        </div>
        `;
        await sendEmail(agent.emailAddress, `✈️ Goyafly — Fixed Departure Booking Request Received [Ref: ${booking._id}]`, agentEmailHtml);

        // Send Alert to Admin
        const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; padding: 30px;">
            <div style="border-bottom: 2px solid #dc2626; padding-bottom: 20px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #dc2626;">🚨 Action Required: New Fixed Departure Booking</h2>
                <p style="margin: 5px 0 0; color: #7f1d1d; font-weight: bold;">Booking Ref: ${booking._id}</p>
            </div>
            <p>A new Fixed Departure booking request has been submitted by an agent. Please verify the payment and assign PNR/Ticket numbers from the Admin Dashboard.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin-top: 0; color: #1e293b;">Agent Details</h3>
                <p style="margin: 5px 0;"><strong>Agency Name:</strong> ${agent.agencyName || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Agent Name:</strong> ${agent.agentName}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${agent.emailAddress}</p>
                <p style="margin: 5px 0;"><strong>Mobile:</strong> ${agent.mobileNumber}</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin-top: 0; color: #1e293b;">Flight & Payment Summary</h3>
                <p style="margin: 5px 0;"><strong>Flight:</strong> ${flight.airlineName} (${flight.flightNumber})</p>
                <p style="margin: 5px 0;"><strong>Route:</strong> ${flight.fromCity} ✈️ ${flight.toCity}</p>
                <p style="margin: 5px 0;"><strong>Departure Date:</strong> ${dateStr}</p>
                <p style="margin: 5px 0;"><strong>Passengers:</strong> ${passengers.length} Pax</p>
                <p style="margin: 5px 0; color: #16a34a; font-weight: bold;"><strong>Total Paid:</strong> ₹${totalFare} (Deducted from Wallet)</p>
            </div>

            <div style="margin: 20px 0;">
                <h3 style="color: #1e293b; margin-bottom: 10px;">Passenger Manifest & Contact Details</h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background-color: #1e293b; color: white;">
                        <tr>
                            <th style="padding: 10px;">Name</th>
                            <th style="padding: 10px;">DOB</th>
                            <th style="padding: 10px;">Gender</th>
                            <th style="padding: 10px;">Mobile</th>
                            <th style="padding: 10px;">Email</th>
                            ${isIntl ? `<th style="padding: 10px;">Passport No</th><th style="padding: 10px;">Nationality</th>` : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${passengerRows}
                    </tbody>
                </table>
            </div>

            <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/fixed-departure-bookings" style="background-color: #1D4171; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View in Admin Dashboard</a>
            </p>
        </div>
        `;
        await sendEmail(process.env.ADMIN_EMAIL || 'admin@goyafly.com', `🚨 ACTION REQUIRED: New Fixed Departure Booking [Ref: ${booking._id}]`, adminEmailHtml);

        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all booking requests (Admin)
// @route   GET /api/admin/fixed-departures/bookings
const getAllBookings = async (req, res) => {
    try {
        const bookings = await FixedDepartureBooking.find()
            .populate('agentId', 'agencyName agentName emailAddress mobileNumber')
            .populate('flightId')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get agent's own bookings
// @route   GET /api/fixed-departures/bookings/me
const getAgentBookings = async (req, res) => {
    try {
        const bookings = await FixedDepartureBooking.find({ agentId: req.user._id })
            .populate('flightId')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all flights (Admin)
// @route   GET /api/admin/fixed-departures
const getAllFlights = async (req, res) => {
    try {
        const flights = await FixedDeparture.find().sort({ departureDate: 1 });
        res.status(200).json({ success: true, data: flights });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createFlight, updateFlight, deleteFlight, getAllFlights,
    confirmBooking, cancelBooking, verifyPayment, getAllBookings,
    searchFlights, bookFlight, getAgentBookings, getAvailableDates
};
