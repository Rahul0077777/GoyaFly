const mongoose = require('mongoose');

const taxRuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    type: { type: String, enum: ['Percentage', 'Flat'], required: true },
    applyTo: { type: String, required: true }, // e.g., 'Commission', 'Gross Fare', 'Transaction'
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.TaxRule || mongoose.model('TaxRule', taxRuleSchema);
