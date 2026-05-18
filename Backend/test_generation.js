const mongoose = require('mongoose');
const Agent = require('./src/Models/Agent.model');
require('dotenv').config();

async function testGeneration() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const agent = await Agent.findOne({ kycStatus: 'APPROVED', agentCode: { $exists: false } });
    if (!agent) {
        console.log('No approved agent without code found. Finding any approved agent...');
        const anyApproved = await Agent.findOne({ kycStatus: 'APPROVED' });
        if (anyApproved) {
            console.log('Found approved agent:', anyApproved.agentName, 'Code:', anyApproved.agentCode);
        } else {
            console.log('No approved agents found at all.');
        }
        process.exit(0);
    }

    console.log('Found agent to update:', agent.agentName);
    agent.isKycVerified = true; // ensure this is set
    await agent.save();
    console.log('Saved. New Agent Code:', agent.agentCode);
    process.exit(0);
}

testGeneration();
