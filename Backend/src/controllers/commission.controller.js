const CommissionRule = require('../Models/CommissionRule.model');

const setCommissionRule = async (req, res, next) => {
    try {
        const { serviceType, baseCommission, agentShare } = req.body;
        const rule = await CommissionRule.findOneAndUpdate(
            { serviceType }, 
            { baseCommission, agentShare }, 
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, message: 'Commission architecture updated', data: rule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getCommissionRules = async (req, res, next) => {
    try {
        const rules = await CommissionRule.find();
        res.status(200).json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { setCommissionRule, getCommissionRules };
