const mongoose = require('mongoose');
require('dotenv').config();

const getAgents = async () => {
    try {
        const uri = 'mongodb://localhost:27017/Zaha_production';
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const agentsCollection = db.collection('agents');
        
        const agents = await agentsCollection.find({})
            .project({ emailAddress: 1, agentName: 1, agencyName: 1, kycStatus: 1, isBlocked: 1, isActive: 1 })
            .limit(5)
            .toArray();
        
        console.log('\n======= AGENT CREDENTIALS =======\n');
        agents.forEach((agent, idx) => {
            console.log(`Agent ${idx + 1}:`);
            console.log(`  Email: ${agent.emailAddress || 'N/A'}`);
            console.log(`  Name: ${agent.agentName || 'N/A'}`);
            console.log(`  Agency: ${agent.agencyName || 'N/A'}`);
            console.log(`  KYC Status: ${agent.kycStatus || 'Unknown'}`);
            console.log(`  Is Active: ${agent.isActive}`);
            console.log(`  Is Blocked: ${agent.isBlocked}`);
            console.log('---');
        });
        
        if (agents.length === 0) {
            console.log('No agents found in database');
        }
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

getAgents();
