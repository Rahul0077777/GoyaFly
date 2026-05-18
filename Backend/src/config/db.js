const mongoose = require('mongoose');
const Admin = require('../Models/Admin.model');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Automatically seed Super Admin if none exists in the new cloud database
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const admin = new Admin({
                name: 'Super Admin',
                email: process.env.ADMIN_EMAIL || 'admin@zayafly.com',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                role: 'SuperAdmin'
            });
            await admin.save();
            console.log('👑 Default Super Admin seeded successfully: admin@zayafly.com');
        }

        // Automatically seed active Demo Agent if none exists in the new cloud database
        const Agent = require('../Models/Agent.model');
        const agentCount = await Agent.countDocuments();
        if (agentCount === 0) {
            const agent = new Agent({
                agentName: 'Demo Agent',
                agencyName: 'GoyaFly Demo Agency',
                mobileNumber: '9876543210',
                emailAddress: 'agent@goyafly.com',
                password: 'agent123',
                address: '123 Cloud Street, Tech City',
                kycStatus: 'APPROVED',
                isKycVerified: true,
                walletBalance: 50000
            });
            await agent.save();
            console.log('💼 Default Demo Agent seeded successfully: agent@goyafly.com');
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        // Exit the process with failure if the database doesn't connect
        process.exit(1);
    }
};

module.exports = connectDB;
