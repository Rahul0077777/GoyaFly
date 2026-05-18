const mongoose = require('mongoose');
const Transaction = require('./Models/Transaction.model');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkTransactions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);
        console.log(`Found ${transactions.length} recent transactions.`);
        
        transactions.forEach(t => {
            console.log(`- Type: ${t.transactionType} | Amount: ${t.amount} | Purpose: ${t.purpose} | Ref: ${t.referenceId} | Created: ${t.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkTransactions();
