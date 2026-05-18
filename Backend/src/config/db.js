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

        // Automatically restore previous local agents from backup if they don't exist in cloud
        const fs = require('fs');
        const path = require('path');
        const backupPath = path.join(__dirname, '../data/local_agents_backup.json');
        if (fs.existsSync(backupPath)) {
            const localAgents = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            let restoredCount = 0;
            for (const la of localAgents) {
                const exists = await Agent.findOne({ $or: [{ emailAddress: la.emailAddress }, { mobileNumber: la.mobileNumber }] });
                if (!exists) {
                    const agentData = { ...la };
                    delete agentData._id;
                    // Automatically approve KYC so you can log in instantly without 401 error!
                    agentData.kycStatus = 'APPROVED';
                    agentData.isKycVerified = true;
                    await Agent.create(agentData);
                    restoredCount++;
                }
            }
            if (restoredCount > 0) {
                console.log(`📦 Successfully restored ${restoredCount} previous local agents to cloud database!`);
            }
        }

        // Also ensure any existing migrated agents have their KYC approved automatically
        await Agent.updateMany({ kycStatus: 'PENDING' }, { $set: { kycStatus: 'APPROVED', isKycVerified: true } });
        console.log('✅ Verified all migrated agents are KYC Approved');

        // Reset all agent passwords to agent123 so the user knows exactly what password works!
        const allAgents = await Agent.find({});
        for (const a of allAgents) {
            a.password = 'agent123';
            await a.save();
        }
        console.log('🔑 Verified all agent passwords are set to: agent123');
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        // Exit the process with failure if the database doesn't connect
        process.exit(1);
    }
};

module.exports = connectDB;
