const mongoose = require('mongoose');

const ftdTokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL index: auto-delete after 24h
    expiresAt: { type: Date, required: true },
    dateKey: { type: String, required: true }, // Format: YYYY-MM-DD for daily tracking
    tokenNumber: { type: Number, required: true } // Which token # this is for the day (max 25)
}, { timestamps: false });

// Index for fast lookup of valid tokens
ftdTokenSchema.index({ dateKey: 1, createdAt: -1 });
ftdTokenSchema.index({ expiresAt: 1 });

module.exports = mongoose.models.FtdToken || mongoose.model('FtdToken', ftdTokenSchema);
