const logger = require('../utils/logger');
const Notification = require('../Models/Notification.model');

/**
 * Helper to create an in-app notification and trigger an email log
 */
const createAgentNotification = async ({ agentId, title, message, type = 'INFO', link = null }) => {
    try {
        // 1. Create In-App Notification
        await Notification.create({
            agentId,
            title,
            message,
            type,
            link
        });

        // 2. Log Email Trigger (Mimicking actual mail send)
        logger.info(`[SYSTEM NOTIFICATION EMAIL] Agent: ${agentId} | Title: ${title} | Message: ${message}`);
        
        return true;
    } catch (error) {
        logger.error(`Failed to create notification: ${error.message}`);
        return false;
    }
};

/**
 * Service to handle Email and SMS notifications for OTB system
 * Currently mocked for development/demo purposes
 */
const sendOTBStatusUpdate = async (otbRequest) => {
    const { receiptNumber, status, adminNotes, travelDetails } = otbRequest;
    const { contactNo, email } = travelDetails;

    // Simulate SMS
    const smsMessage = `Dear Customer, your OTB application ${receiptNumber} status has been updated to ${status}. ${adminNotes ? 'Remarks: ' + adminNotes : ''} - GoyaFly`;
    logger.info(`[SMS MOCK] To: ${contactNo} | Message: ${smsMessage}`);

    let emailSubject;
    let emailBody;

    if (status === 'Approved') {
        emailSubject = `OTB Document Uploaded - ${receiptNumber}`;
        emailBody = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                <p>Dear Travel Partner,</p>
                <p>This is to inform you that an OTB document has been uploaded for reference number <strong>${receiptNumber}</strong>.</p>
                <p>Please find the attached document for your reference.</p>
                <br />
                <p>
                    Thank you for giving us an opportunity to serve you. For updated information, log on to 
                    <a href="https://goyafly.com" style="color: #2980b9; text-decoration: none;">https://goyafly.com</a>
                </p>
                <div style="margin-top: 30px;">
                    <p style="margin: 0;">Regards,</p>
                    <p style="margin: 0;">GoyaFly.com</p>
                </div>
            </div>
        `;
    } else {
        emailSubject = `Update: OTB Application ${receiptNumber}`;
        emailBody = `
            Hello,
            
            The status of your OK TO BOARD (OTB) application ${receiptNumber} has been updated.
            
            Current Status: ${status}
            Remarks: ${adminNotes || 'None'}
            
            You can track your application status at: https://goyafly.com/otb/status
            
            Thank you for choosing GoyaFly!
        `;
    }

    logger.info(`[EMAIL MOCK] To: ${email} | Subject: ${emailSubject} | Body: ${emailBody}`);

    // In a real scenario, you'd use nodemailer or an SMS API like Twilio/Msg91
    return true;
};

const sendOTBAccessNotification = async (agent, status, adminNotes) => {
    const { emailAddress, agentName, mobileNumber } = agent;

    const message = `Hello ${agentName}, your OTB lifetime access request has been ${status}. ${adminNotes ? 'Note: ' + adminNotes : ''} - GoyaFly`;
    
    logger.info(`[OTB ACCESS NOTIFICATION MOCK] To: ${emailAddress} / ${mobileNumber} | Status: ${status} | Message: ${message}`);
    return true;
};

const sendOTBConfirmation = async (otbRequest, agent) => {
    const { receiptNumber, airline, travelDetails, passengers, createdAt } = otbRequest;
    const date = new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const agentName = agent.agencyName || agent.agentName || 'Travel Partner';
    const recipientEmail = agent.emailAddress;

    const passengerRows = passengers.map(pax => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; border: 1px solid #eee;">${receiptNumber}</td>
            <td style="padding: 10px; border: 1px solid #eee; font-weight: bold;">${pax.firstName} ${pax.lastName}</td>
            <td style="padding: 10px; border: 1px solid #eee;">${airline}</td>
            <td style="padding: 10px; border: 1px solid #eee;">${travelDetails.pnr}</td>
            <td style="padding: 10px; border: 1px solid #eee; color: #27ae60; font-weight: bold;">Received</td>
            <td style="padding: 10px; border: 1px solid #eee;">-</td>
        </tr>
    `).join('');

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden; padding: 40px;">
        <div style="border-bottom: 2px solid #1D4171; padding-bottom: 20px; marginBottom: 30px;">
            <h2 style="margin: 0; color: #1D4171; font-size: 18px;">
                Kind Attention: <span style="text-transform: uppercase;">${agentName}</span>
            </h2>
        </div>
        <p style="font-weight: bold;">Dear Travel Partner,</p>
        <p>
            We are pleased to receive your OTB application vide reference number 
            <strong style="color: #1D4171;"> ${receiptNumber} </strong> 
            on ${date} and shall be processing the same at earliest.
        </p>
        <p>
            Please make a note of your application reference number and quote the same during further correspondence with us.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px; margin-bottom: 30px; font-size: 12px;">
            <thead>
                <tr style="background-color: #2980b9; color: #fff;">
                    <th style="padding: 12px; border: 1px solid #2980b9; text-align: left;">App Ref No.</th>
                    <th style="padding: 12px; border: 1px solid #2980b9; text-align: left;">Applicant's Name</th>
                    <th style="padding: 12px; border: 1px solid #2980b9; text-align: left;">Airline Code</th>
                    <th style="padding: 12px; border: 1px solid #2980b9; text-align: left;">PNR</th>
                    <th style="padding: 12px; border: 1px solid #2980b9; text-align: left;">Status</th>
                    <th style="padding: 12px; border: 1px solid #2980b9; text-align: left;">Remarks</th>
                </tr>
            </thead>
            <tbody>
                ${passengerRows}
            </tbody>
        </table>
        <p>
            Thank you for giving us an opportunity to serve you. For updated information, log on to 
            <a href="https://goyafly.com" style="color: #2980b9; text-decoration: none;"> https://goyafly.com </a>
        </p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0; font-weight: bold;">Regards,</p>
            <p style="margin: 0;">GoyaFly.com</p>
        </div>
    </div>
    `;

    logger.info(`[OTB CONFIRMATION EMAIL MOCK] To: ${recipientEmail} | Subject: OTB Confirmation - ${receiptNumber} | Content Built for ${agentName}`);
    // In production, use nodemailer here
    return true;
};

module.exports = {
    sendOTBStatusUpdate,
    sendOTBAccessNotification,
    sendOTBConfirmation,
    createAgentNotification
};
