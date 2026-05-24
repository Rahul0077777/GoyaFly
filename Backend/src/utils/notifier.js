const nodemailer = require('nodemailer');

// @desc    Send automated emails (e.g., Welcome emails, Ticket confirmations)
const sendEmail = async (toEmail, subject, htmlBody, attachments = []) => {
    try {
        // Configure your custom SMTP server (e.g., support@goyafly.com)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: process.env.SMTP_PORT || 465,
            secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || process.env.EMAIL_USER,
                pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
            }
        });

        const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER || 'support@goyafly.com';

        const mailOptions = {
            from: `"GoyaFly Support" <${fromEmail}>`,
            to: toEmail,
            subject: subject,
            html: htmlBody,
            attachments: attachments // Array: [{ filename: 'ticket.pdf', path: '/abs/path/to/file.pdf' }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email successfully sent to ${toEmail} | Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        return false;
    }
};

// @desc    Placeholder for SMS Gateway (e.g., Twilio, MSG91)
const sendSMS = async (mobileNumber, message) => {
    // To make this live, you would install 'twilio' and use your account SID/Token here.
    console.log(`📱 SMS Gateway Triggered -> To: ${mobileNumber} | Msg: ${message}`);
    return true;
};

module.exports = { sendEmail, sendSMS };
