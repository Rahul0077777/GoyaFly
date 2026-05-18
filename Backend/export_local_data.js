const mongoose = require('mongoose');
const Agent = require('./src/Models/Agent.model');
const Admin = require('./src/Models/Admin.model');

async function exportData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/Zaha_production');
        const agents = await Agent.find({}).lean();
        const admins = await Admin.find({}).lean();
        
        console.log("=== LOCAL AGENTS ===");
        console.log(JSON.stringify(agents, null, 2));
        
        console.log("\n=== LOCAL ADMINS ===");
        console.log(JSON.stringify(admins, null, 2));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

exportData();
