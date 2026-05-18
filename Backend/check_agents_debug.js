const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const AgentSchema = new mongoose.Schema({
    agentName: String,
    otbAccessStatus: String
}, { strict: false });

const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);

async function check() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        
        const agents = await Agent.find({ otbAccessStatus: { $ne: 'NONE' } });
        console.log(`Agents with OTB Status: ${agents.length}`);
        agents.forEach(a => {
            console.log(`- ${a.agentName}: ${a.otbAccessStatus}`);
        });
        
        const all = await Agent.countDocuments();
        console.log(`Total Agents: ${all}`);

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

check();
