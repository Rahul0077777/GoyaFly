const nodemailer = require('nodemailer');

// @desc    Send automated emails (e.g., Welcome emails, Ticket confirmations)
const sendEmail = async (toEmail, subject, htmlBody, attachments = []) => {
    try {
        // Configure your mail server (Using Gmail as a standard example)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // e.g., 'your.email@gmail.com'
                pass: process.env.EMAIL_PASS  // e.g., 'your-16-char-app-password'
            }
        });

        const mailOptions = {
            from: `"GoyaFly B2B Portal" <${process.env.EMAIL_USER}>`,
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
