const mongoose = require('mongoose');
const Booking = require('./Models/Booking.model');
const Agent = require('./Models/Agent.model');
const Transaction = require('./Models/Transaction.model');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const manualRefund = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const ids = ['FTD4JGX9G7M6XXC', 'FTD4JHS01BTEA0W'];
        
        for (const ref of ids) {
            const booking = await Booking.findOne({ ftdBookingRef: ref });
            if (!booking) {
                console.log(`Booking ${ref} not found.`);
                continue;
            }

            console.log(`Processing ${ref}. Status: ${booking.status}`);

            // If it's already FAILED in our DB but we haven't created a refund transaction
            const existingRefund = await Transaction.findOne({ referenceId: booking._id, purpose: 'CANCEL_REFUND' });
            
            if (!existingRefund) {
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

                        console.log(`✅ Refunded ₹${refundAmount} to agent ${agent.email} for ${ref}.`);
                    }
                }
            } else {
                console.log(`Refund for ${ref} already exists.`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

manualRefund();
