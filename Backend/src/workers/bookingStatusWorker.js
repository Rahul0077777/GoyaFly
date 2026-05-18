/**
 * Booking Status Polling Worker
 * 
 * Background worker that polls FTD bookingStatus API for pending bookings.
 * - Waits 7 minutes after initial booking before first check
 * - Polls every 7 minutes until status becomes 'Success' or 'Rejected'
 * - On Success: triggers ticket generation
 * - On Rejected: logs rejection and updates booking
 */

const Booking = require('../Models/Booking.model');
const Agent = require('../Models/Agent.model');
const Transaction = require('../Models/Transaction.model');
const { checkBookingStatus } = require('../services/ftdFlightService');
const { generatePDFTicket } = require('../utils/ticketGenerator');
const { sendEmail } = require('../utils/notifier');
const logger = require('../utils/logger');
const path = require('path');

const POLL_INTERVAL_MS = 7 * 60 * 1000; // 7 minutes in milliseconds
const MIN_AGE_MS = 7 * 60 * 1000;       // Minimum 7 minutes after booking

let workerInterval = null;
let isProcessing = false;

/**
 * Process a single pending booking
 */
const processPendingBooking = async (booking) => {
    try {
        const refID = booking.ftdBookingRef;
        if (!refID) {
            logger.warn(`Worker: Booking ${booking._id} has no ftdBookingRef (refID), skipping.`);
            return;
        }

        logger.info(`Worker: Checking status for booking ${booking._id} (refID: ${refID})`);

        const statusResult = await checkBookingStatus(refID);
        const newStatus = statusResult?.status?.toLowerCase();

        if (newStatus === 'success' || newStatus === 'confirmed') {
            // === BOOKING CONFIRMED ===
            logger.info(`Worker: Booking ${booking._id} CONFIRMED! PNR: ${statusResult.pnr}`);

            booking.status = 'CONFIRMED';
            booking.ftdStatus = 'Success';
            booking.pnr = statusResult.pnr || booking.pnr;
            booking.barcodeData = statusResult.barcodeText1 || booking.barcodeData;

            // Generate E-Ticket PDF
            try {
                const ticketUrl = await generatePDFTicket(booking);
                booking.ticketUrl = ticketUrl;
                logger.info(`Worker: Ticket generated for booking ${booking._id}: ${ticketUrl}`);

                // Send Ticket Email to Agent
                const agent = await Agent.findById(booking.agentId);
                if (agent && agent.email && process.env.EMAIL_USER) {
                    const absPath = path.join(__dirname, '../../', ticketUrl);
                    const subject = `✈️ GoyaFly — E-Ticket Confirmation [PNR: ${booking.pnr}]`;
                    const body = `
                        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                            <h2 style="color: #1a237e;">Booking Confirmed!</h2>
                            <p>Dear ${agent.name},</p>
                            <p>Your flight booking (Reference: <b>${booking.ftdBookingRef}</b>) has been successfully confirmed by the GDS.</p>
                            <p><b>PNR:</b> ${booking.pnr}</p>
                            <p>Please find your official E-Ticket attached to this email.</p>
                            <br/>
                            <p>Best Regards,<br/>GoyaFly Support Team</p>
                        </div>
                    `;
                    
                    await sendEmail(agent.email, subject, body, [
                        { filename: `Ticket-${booking.pnr}.pdf`, path: absPath }
                    ]);
                    logger.info(`Worker: Ticket email sent to agent ${agent.email}`);
                }
            } catch (ticketError) {
                logger.error(`Worker: Ticket/Email generation failed for ${booking._id}: ${ticketError.message}`);
            }

            await booking.save();

        } else if (newStatus === 'rejected' || newStatus === 'failed' || newStatus === 'cancelled' || statusResult.code === 'error') {
            // === BOOKING REJECTED OR NOT FOUND ===
            const isNotFound = statusResult.error_msg === 'Booking Id does not exists';
            const reason = isNotFound ? 'Booking ID not found in GDS' : (statusResult.message || statusResult.error_msg || 'Unknown');
            
            logger.warn(`Worker: Booking ${booking._id} REJECTED/CLEANED. Reason: ${reason}`);

            booking.status = 'FAILED';
            booking.ftdStatus = 'Rejected';
            await booking.save();

            // === AUTOMATIC REFUND ===
            try {
                const agent = await Agent.findById(booking.agentId);
                if (agent) {
                    const refundAmount = (booking.totalCost || 0) - (booking.commissionEarned || 0);
                    
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
                            paymentMethod: 'WALLET'
                        });

                        logger.info(`Worker: Refunded ₹${refundAmount} to agent ${agent.email} for failed booking ${booking._id}`);
                    }
                }
            } catch (refundError) {
                logger.error(`Worker: Automatic refund failed for ${booking._id}: ${refundError.message}`);
            }

        } else {
            // Still pending — log and continue
            logger.info(`Worker: Booking ${booking._id} still Pending (status: ${statusResult.status})`);
        }

    } catch (error) {
        logger.error(`Worker: Error processing booking ${booking._id}: ${error.message}`);
    }
};

/**
 * Main polling cycle — finds and processes all pending FTD bookings
 */
const pollPendingBookings = async () => {
    if (isProcessing) {
        logger.info('Worker: Previous cycle still running, skipping...');
        return;
    }

    isProcessing = true;

    try {
        // Find bookings that:
        // 1. Have ftdStatus = 'Pending'
        // 2. Were created at least 7 minutes ago
        const cutoffTime = new Date(Date.now() - MIN_AGE_MS);

        const pendingBookings = await Booking.find({
            ftdStatus: 'Pending',
            createdAt: { $lte: cutoffTime }
        }).limit(50); // Process max 50 per cycle to avoid overload

        if (pendingBookings.length === 0) {
            // No pending bookings — silent log
            return;
        }

        logger.info(`Worker: Found ${pendingBookings.length} pending FTD bookings to check.`);

        // Process each booking sequentially to avoid FTD rate limits
        for (const booking of pendingBookings) {
            await processPendingBooking(booking);
            // Small delay between checks to be respectful to FTD API
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (error) {
        logger.error('Worker: Polling cycle error: ' + error.message);
    } finally {
        isProcessing = false;
    }
};

/**
 * Start the background worker
 */
const startBookingStatusWorker = () => {
    if (workerInterval) {
        logger.warn('Worker: Booking status worker is already running.');
        return;
    }

    logger.info(`✈️  FTD Booking Status Worker started (polling every ${POLL_INTERVAL_MS / 60000} minutes)`);

    // Run first cycle after a 30-second startup delay
    setTimeout(() => {
        pollPendingBookings();
    }, 30000);

    // Then run every 7 minutes
    workerInterval = setInterval(pollPendingBookings, POLL_INTERVAL_MS);
};

/**
 * Stop the background worker (for graceful shutdown)
 */
const stopBookingStatusWorker = () => {
    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
        logger.info('Worker: Booking status worker stopped.');
    }
};

module.exports = { startBookingStatusWorker, stopBookingStatusWorker };
