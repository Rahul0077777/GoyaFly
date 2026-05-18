const GlobalSetting = require('../Models/GlobalSetting.model');

const getSettings = async (req, res) => {
    try {
        let settings = await GlobalSetting.findOne();
        if (!settings) {
            settings = await GlobalSetting.create({});
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const settings = await GlobalSetting.findOneAndUpdate({}, req.body, { 
            new: true, 
            upsert: true,
            setDefaultsOnInsert: true
        });
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getSettings, updateSettings };
