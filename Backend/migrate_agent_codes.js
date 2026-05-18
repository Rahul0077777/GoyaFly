const mongoose = require('mongoose');
const Agent = require('./src/Models/Agent.model');
require('dotenv').config();

async function migrateAgents() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const approvedAgents = await Agent.find({ 
        isKycVerified: true, 
        agentCode: { $exists: false } 
    });

    console.log(`Found ${approvedAgents.length} verified agents without codes.`);

    for (const agent of approvedAgents) {
        console.log(`Generating code for ${agent.agentName}...`);
        // Saving will trigger the pre-save hook we just updated
        await agent.save();
        console.log(`Done: ${agent.agentCode}`);
    }

    console.log('Migration complete.');
    process.exit(0);
}

migrateAgents();
