const Notification = require('../Models/Notification.model');

// @desc    Get all notifications for logged-in agent
// @route   GET /api/agents/notifications
// @access  Agent
const getAgentNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ agentId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/agents/notifications/:id/read
// @access  Agent
const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, agentId: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get count of unread notifications
// @route   GET /api/agents/notifications/unread-count
// @access  Agent
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ 
            agentId: req.user._id, 
            isRead: false 
        });
        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/agents/notifications/:id
// @access  Agent
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ 
            _id: req.params.id, 
            agentId: req.user._id 
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getAgentNotifications,
    markNotificationRead,
    getUnreadCount,
    deleteNotification
};
