const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String },
    color: { type: String, default: 'bg-primary-600' },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
