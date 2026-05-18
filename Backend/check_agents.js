const mongoose = require('mongoose');
const Agent = require('./src/Models/Agent.model');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sksharma715:Saurabh123@cluster0.v284v.mongodb.net/Zaha?retryWrites=true&w=majority";

async function checkAgents() {
    try {
        await mongoose.connect(MONGO_URI);
        const agents = await Agent.find({});
        console.log("Registered Agents:");
        agents.forEach(a => {
            console.log(`- Email: ${a.emailAddress} | Mobile: ${a.mobileNumber} | KYC Verified: ${a.isKycVerified}`);
        });

        const verified = agents.find(a => a.isKycVerified);
        if (!verified) {
            console.log("No verified agents found. Attempting to verify the first one...");
            if (agents.length > 0) {
                agents[0].isKycVerified = true;
                await agents[0].save();
                console.log(`Verified agent: ${agents[0].emailAddress}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkAgents();
