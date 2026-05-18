const mongoose = require('mongoose');
require('dotenv').config();
const GlobalSetting = require('./src/Models/GlobalSetting.model');

const disableMaintenance = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const settings = await GlobalSetting.findOne();
        if (settings) {
            settings.maintenanceMode = false;
            await settings.save();
            console.log('Maintenance mode DISABLED');
        } else {
            await GlobalSetting.create({
                maintenanceMode: false,
                siteName: 'Zaya Travels',
                supportEmail: 'support@zayafly.com'
            });
            console.log('New settings created with maintenance mode DISABLED');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

disableMaintenance();
