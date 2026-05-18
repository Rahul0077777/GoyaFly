const mongoose = require('mongoose');

const commissionRuleSchema = new mongoose.Schema({
    serviceType: { 
        type: String, 
        enum: ['DOMESTIC_FLIGHT', 'INTERNATIONAL_FLIGHT', 'HOTEL', 'BUS', 'TRAIN'], 
        required: true, 
        unique: true 
    },
    baseCommission: { type: Number, required: true },
    agentShare: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.models.CommissionRule || mongoose.model('CommissionRule', commissionRuleSchema);
