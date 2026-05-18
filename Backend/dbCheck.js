const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const collection = db.collection('markuprules');
        const indexes = await collection.indexes();
        console.log('MARKUP RULES INDEXES:', JSON.stringify(indexes, null, 2));
        
        const commissionCollection = db.collection('commissionrules');
        const commIndexes = await commissionCollection.indexes();
        console.log('COMMISSION RULES INDEXES:', JSON.stringify(commIndexes, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

checkIndexes();
