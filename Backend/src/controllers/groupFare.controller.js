const logger = require('../utils/logger');
const { sendEmail } = require('../services/notificationService');

/**
 * @desc    Submit a Group Fare Request
 * @route   POST /api/booking/group-fare
 * @access  Private (Agent)
 */
const submitGroupFareController = async (req, res) => {
    try {
        const {
            agentEmail, agentId, mobileNumber, purpose, journey,
            fromCity, toCity, departureDate, returnDate,
            noOfAdult, noOfChildren, noOfInfants,
            expectedFare, onwardFlightDetails, returnFlightDetails, remark
        } = req.body;

        const agent = req.user;

        if (!journey || !fromCity || !toCity || !departureDate) {
            return res.status(400).json({ success: false, message: 'Mandatory flight details are missing.' });
        }

        // 1. Send Email to Admin/Support Team
        const adminEmail = process.env.ADMIN_EMAIL || 'support@goyafly.com';
        const adminSubject = `🚨 NEW GROUP FARE REQUEST | ${fromCity} to ${toCity}`;
        
        const adminHtmlBody = `
            <div style="font-family: inherit; padding: 20px;">
                <h2 style="color: #1D4171; border-bottom: 2px solid #F07E21; padding-bottom: 10px;">Group Fare Request</h2>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
                    <p><strong>Agent Identity:</strong> ${agent.name} (Agency: ${agent.agencyName || agentId})</p>
                    <p><strong>Agent Email:</strong> ${agentEmail}</p>
                    <p><strong>Mobile Number:</strong> ${mobileNumber}</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;"/>
                    <p><strong>Journey:</strong> ${journey} (${purpose})</p>
                    <p><strong>Sector:</strong> ${fromCity} &rarr; ${toCity}</p>
                    <p><strong>Departure Date:</strong> ${departureDate}</p>
                    ${returnDate ? `<p><strong>Return Date:</strong> ${returnDate}</p>` : ''}
                    <p><strong>Passengers:</strong> ${noOfAdult || 0} Adt, ${noOfChildren || 0} Chd, ${noOfInfants || 0} Inf</p>
                    <p><strong>Expected Fare (per pax):</strong> ${expectedFare || 'Not specified'}</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;"/>
                    <p><strong>Onward Preference:</strong> ${onwardFlightDetails || 'None'}</p>
                    ${returnFlightDetails ? `<p><strong>Return Preference:</strong> ${returnFlightDetails}</p>` : ''}
                    <p><strong>Remarks:</strong> ${remark || 'None'}</p>
                </div>
            </div>
        `;
        
        await sendEmail(adminEmail, adminSubject, adminHtmlBody);

        // 2. Send Acknowledgement Email to Agent
        const agentSubject = `Goyafly Group Fare Request: ${fromCity} to ${toCity}`;
        const agentHtmlBody = `
            <div style="font-family: inherit; padding: 20px;">
                <p>Dear ${agent.name},</p>
                <p>We have successfully received your group fare request for <strong>${fromCity} to ${toCity}</strong>.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #1D4171; margin: 15px 0;">
                    <p style="margin: 0;"><strong>Date:</strong> ${departureDate}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Passengers:</strong> ${parseInt(noOfAdult||0) + parseInt(noOfChildren||0)} Pax</p>
                </div>
                <p>Our dedicated team is securing the best quotes from the airlines. If you have any immediate questions, please contact our support desk.</p>
                <br/>
                <p>Regards,<br/><b>Goyafly Team</b></p>
            </div>
        `;

        await sendEmail(agentEmail || agent.email, agentSubject, agentHtmlBody);

        // Optionally, we could save this request to MongoDB here.
        // For now, logging and email delivery marks a successful submission according to specs.
        logger.info(`Group Fare requested by Agent: ${agentId} for ${fromCity}-${toCity}`);

        res.status(200).json({ success: true, message: 'Group fare request submitted successfully.' });
    } catch (error) {
        logger.error(`Group Fare Submission Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to submit group fare request. Please try again.' });
    }
};

module.exports = { submitGroupFareController };
