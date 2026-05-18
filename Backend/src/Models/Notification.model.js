const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['INFO', 'SUCCESS', 'WARNING', 'ALERT'],
        default: 'INFO'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        default: null
    }
}, { 
    timestamps: true 
});

// Index for faster fetching of agent notifications
notificationSchema.index({ agentId: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
