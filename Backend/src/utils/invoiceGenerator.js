const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Generate a professional Tax Invoice PDF for GoyaFly
 * 
 * @param {Object} bookingData - Booking document from MongoDB
 * @param {Object} agentData - Agent document from MongoDB
 * @returns {Promise<string>} - URL path to the generated PDF
 */
const generateInvoice = async (bookingData, agentData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const pnr = bookingData.pnr || bookingData.providerReference || `REF-${Math.floor(Math.random() * 10000)}`;
            const fileName = `INVOICE-${pnr}-${Date.now()}.pdf`;
            
            const uploadsDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filePath = path.join(uploadsDir, fileName);
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Styles
            const blue = '#1e3a8a';
            const gray = '#6b7280';
            const black = '#111827';

            // 1. Header (Agency Details)
            doc.fontSize(24).font('Helvetica-Bold').fillColor(blue).text('GOYAFLY', 40, 40);
            doc.fontSize(10).font('Helvetica').fillColor(gray).text('Premium B2B Travel Portal', 40, 70);
            
            doc.fontSize(14).font('Helvetica-Bold').fillColor(black).text('TAX INVOICE', 350, 40, { align: 'right', width: 200 });
            doc.fontSize(10).font('Helvetica').fillColor(gray).text(`Invoice No: INV-${pnr}`, 350, 60, { align: 'right', width: 200 });
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, 75, { align: 'right', width: 200 });

            doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#e5e7eb').stroke();

            // 2. Bill To & Agency Info
            doc.fontSize(10).font('Helvetica-Bold').fillColor(black).text('BILL TO:', 40, 120);
            doc.font('Helvetica').text(agentData.agencyName || 'Valued Agent', 40, 135);
            doc.text(agentData.emailAddress || '', 40, 150);
            doc.text(`Agent ID: ${agentData._id.toString().substring(0, 8)}`, 40, 165);

            doc.fontSize(10).font('Helvetica-Bold').text('ISSUED BY:', 300, 120);
            doc.font('Helvetica').text('GoyaFly Support', 300, 135);
            doc.text('Mumbai, Maharashtra, India', 300, 150);
            doc.text('GSTIN: 27AABCZ1234F1Z1 (Sample)', 300, 165);

            // 3. Item Table
            const tableY = 210;
            doc.rect(40, tableY, 515, 30).fill(blue);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
            doc.text('Description', 50, tableY + 10);
            doc.text('PNR/Ref', 250, tableY + 10);
            doc.text('Amount', 450, tableY + 10, { width: 90, align: 'right' });

            const itemY = tableY + 40;
            doc.fontSize(10).font('Helvetica').fillColor(black);
            const from = bookingData.from || 'Source';
            const to = bookingData.to || 'Destination';
            doc.text(`Flight Booking: ${from} to ${to}`, 50, itemY);
            doc.text(pnr, 250, itemY);
            
            const totalAmount = bookingData.totalCost || 0;
            const netFare = bookingData.netfare || totalAmount;
            const taxAmount = totalAmount - netFare;

            doc.text(`INR ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, itemY, { width: 90, align: 'right' });

            doc.moveTo(40, itemY + 20).lineTo(555, itemY + 20).strokeColor('#f3f4f6').stroke();

            // 4. Totals
            const totalY = itemY + 60;
            doc.fontSize(10).font('Helvetica').text('Sub Total (Net Fare):', 350, totalY);
            doc.text(`INR ${netFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalY, { width: 90, align: 'right' });

            doc.text('Taxes & Surcharges:', 350, totalY + 20);
            doc.text(`INR ${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalY + 20, { width: 90, align: 'right' });

            doc.fontSize(12).font('Helvetica-Bold').fillColor(blue).text('Total Amount Paid:', 350, totalY + 50);
            doc.text(`INR ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalY + 50, { width: 95, align: 'right' });

            // 5. Footer
            doc.fontSize(8).font('Helvetica').fillColor(gray).text('Thank you for your business. This is a computer generated invoice and does not require a signature.', 40, 750, { align: 'center', width: 515 });

            doc.end();

            stream.on('finish', () => {
                logger.info(`📄 Invoice Generated: ${fileName}`);
                resolve(`/uploads/${fileName}`);
            });

            stream.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateInvoice };
