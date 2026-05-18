const mongoose = require('mongoose');
const Agent = require('./src/Models/Agent.model');
const fs = require('fs');
const path = require('path');

async function backupAgents() {
    try {
        await mongoose.connect('mongodb://localhost:27017/Zaha_production');
        const agents = await Agent.find({}).lean();
        
        const backupDir = path.join(__dirname, 'src', 'data');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(backupDir, 'local_agents_backup.json'), JSON.stringify(agents, null, 2));
        console.log(`✅ Successfully backed up ${agents.length} local agents to src/data/local_agents_backup.json`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

backupAgents();
