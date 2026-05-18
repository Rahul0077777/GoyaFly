const mongoose = require('mongoose');
const Agent = require('./src/Models/Agent.model');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sksharma715:Saurabh123@cluster0.v284v.mongodb.net/Zaha?retryWrites=true&w=majority";

async function verifyAll() {
    try {
        await mongoose.connect(MONGO_URI);
        const result = await Agent.updateMany({}, { $set: { isKycVerified: true } });
        console.log(`Updated ${result.modifiedCount} agents to verified status.`);
        
        const agents = await Agent.find({ emailAddress: /zayafly/ });
        console.log("Zayafly Agents available for login:");
        agents.forEach(a => console.log(`- ${a.emailAddress} (Verified: ${a.isKycVerified})`));
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAll();
