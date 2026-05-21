const mongoose = require('mongoose');

const markupRuleSchema = new mongoose.Schema({
    serviceType: { 
        type: String, 
        enum: ['DOMESTIC_FLIGHT', 'INTERNATIONAL_FLIGHT', 'HOTEL', 'BUS', 'TRAIN'], 
        default: 'DOMESTIC_FLIGHT' 
    },
    airline: { 
        type: String, 
        default: 'ALL' // '6E', 'SG', 'QP', 'IX', 'AI', 'ALL'
    },
    refundType: { 
        type: String, 
        enum: ['All', 'Refundable', 'P Refundable', 'Non-Refundable', 'Refundable & P Refundable'], 
        default: 'All' 
    },
    markupType: { 
        type: String, 
        enum: ['Fixed', 'Percentage'], 
        default: 'Fixed' 
    },
    markupValue: { 
        type: Number, 
        required: true 
    },
    targetAgentCode: { 
        type: String, 
        default: 'ALL' // Can be an Agent Code like 'GF10005'
    },
    priority: { 
        type: Number, 
        default: 0 // Specific rules should have higher priority (e.g., 10)
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.models.MarkupRule || mongoose.model('MarkupRule', markupRuleSchema);
