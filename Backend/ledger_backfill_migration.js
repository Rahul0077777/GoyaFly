const mongoose = require('mongoose');
const Transaction = require('./src/Models/Transaction.model');
const Booking = require('./src/Models/Booking.model');

// ==============================================================================
// CONFIGURATION
// ==============================================================================
const MONGO_URI = 'mongodb://localhost:27017/Zaha_production';

async function runMigration() {
    console.log('🚀 Starting Agency Statement Backfill Migration...');
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to Database.');

        const transactions = await Transaction.find({ 
            purpose: { $in: ['FLIGHT_BOOKING', 'WALLET_RECHARGE', 'CANCEL_REFUND', 'REFUND'] }
        });

        console.log(`📊 Found ${transactions.length} candidate transactions for repair.`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const tx of transactions) {
            let updateData = {};

            if (tx.purpose === 'FLIGHT_BOOKING' || tx.purpose === 'CANCEL_REFUND' || tx.purpose === 'REFUND') {
                // Determine Booking ID from Reference
                // Pattern: "B-69d4..."
                const bookingId = tx.referenceId.startsWith('B-') ? tx.referenceId.replace('B-', '') : null;
                
                if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
                    const booking = await Booking.findById(bookingId);
                    if (booking) {
                        updateData = {
                            gross: booking.totalCost || tx.amount,
                            comm: booking.commissionEarned || 0,
                            tds: (booking.commissionEarned || 0) * 0.05,
                            txnFees: tx.transactionType === 'DEBIT' ? 12 : 0,
                            remark: `${booking.fromCity || 'Flight'} -> ${booking.toCity || 'Dest'} | PNR: ${booking.pnr || 'N/A'}`
                        };
                    } else {
                        updateData = { remark: tx.description || 'Flight Transaction' };
                    }
                } else {
                    updateData = { remark: tx.description || 'Manual Flight Entry' };
                }
            } else if (tx.purpose === 'WALLET_RECHARGE') {
                updateData = {
                    gross: tx.amount,
                    remark: tx.description || 'Wallet Recharge via UPI/Razorpay'
                };
            }

            // Perform Update
            if (Object.keys(updateData).length > 0) {
                await Transaction.updateOne({ _id: tx._id }, { $set: updateData });
                updatedCount++;
            } else {
                skippedCount++;
            }

            if (updatedCount % 50 === 0) console.log(`...processed ${updatedCount} records`);
        }

        console.log('\n🏁 Migration Complete!');
        console.log(`✅ Updated: ${updatedCount}`);
        console.log(`⏭️  Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runMigration();
