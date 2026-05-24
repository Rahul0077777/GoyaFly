const Ticket = require('../Models/Ticket.model');
const mongoose = require('mongoose');
const { sendEmail, sendSMS } = require('../utils/notifier');

// @desc    Create new support ticket
// @route   POST /api/agents/tickets
const createTicket = async (req, res) => {
    try {
        const subject = req.body.subject || 'Support Request';
        const category = (req.body.category || 'OTHER').toUpperCase();
        const priority = (req.body.priority || 'MEDIUM').toUpperCase();
        const initialMsg = req.body.initialMessage || req.body.message || 'No message provided';
        
        const agentObjId = new mongoose.Types.ObjectId(req.user._id);

        const ticket = await Ticket.create({
            agentId: agentObjId,
            subject,
            category,
            priority,
            messages: [{
                senderModel: 'Agent',
                senderId: agentObjId,
                message: initialMsg
            }]
        });

        // Trigger immediate email alert to Admin with Agent's Email and Phone Number
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@goyafly.com';
        const emailSubject = `🚨 URGENT Support Ticket Alert: ${subject} (${priority} Priority)`;
        const emailBody = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; padding: 30px;">
                <h2 style="color: #1D4171; border-bottom: 2px solid #F07E21; padding-bottom: 10px;">🚨 New Support Ticket Created</h2>
                <p><strong>Agency Name:</strong> ${req.user.agencyName || 'N/A'}</p>
                <p><strong>Agent Name:</strong> ${req.user.agentName || 'N/A'}</p>
                <p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 8px; font-size: 16px;">
                    <strong>📞 Contact Phone:</strong> ${req.user.mobileNumber || 'N/A'}<br/>
                    <strong>✉️ Contact Email:</strong> ${req.user.emailAddress || 'N/A'}
                </p>
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>Priority:</strong> <span style="color: red; font-weight: bold;">${priority}</span></p>
                <h3 style="margin-top: 20px; color: #1D4171;">Message:</h3>
                <blockquote style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #1D4171; font-style: italic; border-radius: 8px;">
                    ${initialMsg}
                </blockquote>
                <p style="margin-top: 30px; font-size: 12px; color: #777;">
                    Please login to the Goyafly Admin Portal to reply or contact the agent directly via phone/email above.
                </p>
            </div>
        `;
        
        sendEmail(adminEmail, emailSubject, emailBody).catch(err => console.error('Failed to send admin ticket alert email:', err));
        sendSMS(req.user.mobileNumber || 'Admin', `New Support Ticket created by ${req.user.agencyName || req.user.agentName}. Ph: ${req.user.mobileNumber}. Subject: ${subject}`).catch(err => console.error(err));

        // Email to Agent confirming ticket creation
        if (req.user.emailAddress) {
            const agentSubject = `Support Ticket Created: ${subject}`;
            const agentBody = `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; padding: 30px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1D4171; margin: 0;">GoyaFly</h2>
                        <p style="color: #7f8c8d; font-size: 14px; margin-top: 5px;">Ticket Received</p>
                    </div>
                    <p>Dear ${req.user.agentName},</p>
                    <p>We have successfully received your support ticket regarding <b>"${subject}"</b>.</p>
                    <p>Our support team will review your request and get back to you shortly.</p>
                    <div style="margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 20px;">
                        <p style="margin: 0; color: #333; font-weight: bold;">Best Regards,</p>
                        <p style="margin: 0; color: #333;">GoyaFly Support Team</p>
                    </div>
                </div>
            `;
            sendEmail(req.user.emailAddress, agentSubject, agentBody).catch(err => console.error('Failed to send agent ticket creation email:', err));
        }

        res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        console.error('CREATE TICKET ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all tickets for logged-in agent
// @route   GET /api/agents/tickets
const getAgentTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ agentId: req.user._id }).sort({ lastUpdate: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add message to existing ticket
// @route   POST /api/agents/tickets/:id/message
const addTicketMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await Ticket.findOne({ _id: req.params.id, agentId: req.user._id });

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        ticket.messages.push({
            senderModel: 'Agent',
            senderId: req.user._id,
            message
        });
        
        ticket.status = 'PENDING_ADMIN';
        await ticket.save();

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Get all tickets
// @route   GET /api/admin/tickets
const adminGetAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({}).populate('agentId', 'agentName agencyName emailAddress mobileNumber').sort({ lastUpdate: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin: Reply to ticket
// @route   POST /api/admin/tickets/:id/reply
const adminReplyTicket = async (req, res) => {
    try {
        const { message, status } = req.body;
        const ticket = await Ticket.findById(req.params.id).populate('agentId', 'agentName emailAddress');

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        ticket.messages.push({
            senderModel: 'Admin',
            senderId: req.user._id,
            message
        });

        if (status) ticket.status = status;
        else ticket.status = 'PENDING_AGENT';

        await ticket.save();

        // Notify Agent of Admin Reply
        if (ticket.agentId && ticket.agentId.emailAddress) {
            const agentSubject = `Update on your Support Ticket: ${ticket.subject}`;
            const agentBody = `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; padding: 30px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1D4171; margin: 0;">GoyaFly</h2>
                        <p style="color: #7f8c8d; font-size: 14px; margin-top: 5px;">Ticket Update</p>
                    </div>
                    <p>Dear ${ticket.agentId.agentName},</p>
                    <p>Our support team has responded to your ticket <b>"${ticket.subject}"</b>.</p>
                    <blockquote style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #1D4171; font-style: italic; border-radius: 8px;">
                        ${message}
                    </blockquote>
                    <p>Please log in to your dashboard to view the full conversation and reply.</p>
                    <div style="margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 20px;">
                        <p style="margin: 0; color: #333; font-weight: bold;">Best Regards,</p>
                        <p style="margin: 0; color: #333;">GoyaFly Support Team</p>
                    </div>
                </div>
            `;
            sendEmail(ticket.agentId.emailAddress, agentSubject, agentBody).catch(err => console.error('Failed to send agent ticket reply email:', err));
        }

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete support ticket
// @route   DELETE /api/agents/tickets/:id
const deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOneAndDelete({ _id: req.params.id, agentId: req.user._id });
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found or unauthorized' });
        res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('DELETE TICKET ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTicket,
    getAgentTickets,
    addTicketMessage,
    adminGetAllTickets,
    adminReplyTicket,
    deleteTicket
};
