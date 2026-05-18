const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { generatePDF417Barcode } = require('./barcodeGenerator');
const logger = require('./logger');

/**
 * Generate a professional E-Ticket PDF matching EaseMyTrip premium layout
 */
const generatePDFTicket = async (bookingData) => {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Setup
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            const pnr = bookingData.pnr || bookingData.providerReference || `REF-${Math.floor(Math.random() * 999999)}`;
            const fileName = `TICKET-${pnr}-${Date.now()}.pdf`;
            
            const uploadsDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            const filePath = path.join(uploadsDir, fileName);
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // =============================================
            // BRAND & THEME CONSTANTS
            // =============================================
            const emtBlue = '#2196F3';       // EaseMyTrip-style Sky Blue
            const headerBlue = '#EAF5FE';    // Light blue for table headers
            const darkBlue = '#0D4771';      // Text/Accent blue
            const grayText = '#666666';      // Standard text gray
            const borderColor = '#E0E0E0';   // Table borders
            const successGreen = '#4CAF50';  // Status green

            // =============================================
            // HELPERS
            // =============================================
            const drawSectionHeader = (title, y) => {
                doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text(title, 35, y);
                doc.moveTo(35, y + 14).lineTo(150, y + 14).lineWidth(1.5).strokeColor(emtBlue).stroke();
                return y + 25;
            };

            const drawSimpleTable = (y, columns, rows) => {
                const rowHeight = 22;
                const totalWidth = 535;
                
                // Header background
                doc.rect(30, y, totalWidth, rowHeight).fill(headerBlue);
                doc.rect(30, y, totalWidth, rowHeight).lineWidth(0.5).strokeColor(borderColor).stroke();

                let currentX = 30;
                columns.forEach(col => {
                    doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue)
                       .text(col.title, currentX + 5, y + 7, { width: col.width - 10, align: 'left' });
                    currentX += col.width;
                });

                let currentY = y + rowHeight;
                rows.forEach((row, i) => {
                    doc.rect(30, currentY, totalWidth, rowHeight).lineWidth(0.5).strokeColor(borderColor).stroke();
                    let x = 30;
                    row.forEach((cell, cellIdx) => {
                        doc.fontSize(8).font('Helvetica').fillColor('#333')
                           .text(String(cell || '-'), x + 5, currentY + 7, { width: columns[cellIdx].width - 10, align: 'left' });
                        x += columns[cellIdx].width;
                    });
                    currentY += rowHeight;
                });
                return currentY;
            };

            // =============================================
            // 1. TOP HEADER & LOGO
            // =============================================
            // Logo (Left)
            doc.fontSize(28).font('Helvetica-Bold').fillColor(darkBlue).text('Goyafly', 35, 40, { continued: true })
               .fillColor(emtBlue).text('.com');
            
            // Status (Right)
            doc.fontSize(14).font('Helvetica-Bold').fillColor(successGreen).text('✔ Booking Confirmed', 380, 42);
            doc.fontSize(8).font('Helvetica').fillColor(grayText);
            const bookingDate = new Date(bookingData.createdAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
            doc.text(`Booking Date: ${bookingDate}`, 380, 60, { width: 180, align: 'left' });

            doc.moveTo(35, 90).lineTo(560, 90).lineWidth(0.5).strokeColor('#EEE').stroke();

            // =============================================
            // 2. GREETING & ROUTE INFO
            // =============================================
            let pasMain = 'Guest';
            if (bookingData.passengerDetails?.[0]) {
                const p = bookingData.passengerDetails[0];
                pasMain = `${p.title || ''} ${p.fName || p.firstName || ''} ${p.lName || p.lastName || ''}`.trim();
            }
            
            doc.fontSize(10).font('Helvetica').fillColor(darkBlue).text(`Hi, ${pasMain}`, 35, 105);
            doc.fillColor(grayText).text('Your flight ticket for ', 35, 125, { continued: true })
               .font('Helvetica-Bold').fillColor(emtBlue).text(`${bookingData.fromCity || 'Source'}-${bookingData.toCity || 'Destination'}`, { continued: true })
               .font('Helvetica').fillColor(grayText).text(' is confirm. Your ticket is attached along with the email.');
            
            doc.fontSize(10).text('Your Booking ID is ', 35, 145, { continued: true })
               .font('Helvetica-Bold').fillColor(emtBlue).text(`${bookingData.ftdBookingRef || pnr}`, { continued: true })
               .font('Helvetica').fillColor(grayText).text(' . Please use it for any further communication with us.');

            // =============================================
            // 3. FLIGHT SUMMARY (The Arrow Line)
            // =============================================
            let segmentY = 175;
            let parsedFlights = [];
            if (bookingData.flightDetails && typeof bookingData.flightDetails === 'object' && !Array.isArray(bookingData.flightDetails)) {
                // Handle case where it's the Onward/Return object directly
                const fd = bookingData.flightDetails;
                if (fd.Onward) Object.keys(fd.Onward).forEach(k => parsedFlights.push(fd.Onward[k]));
                if (fd.Return) Object.keys(fd.Return).forEach(k => parsedFlights.push(fd.Return[k]));
            }

            if (parsedFlights.length === 0) {
                parsedFlights.push({ 
                    depCode: bookingData.fromCity || 'ORG', 
                    arrCode: bookingData.toCity || 'DST', 
                    airName: bookingData.airline || 'Airline',
                    airCode: (bookingData.airline || '').substring(0, 2).toUpperCase()
                });
            }

            parsedFlights.forEach((seg, idx) => {
                const depTime = seg.depDate ? seg.depDate.split('T')[1]?.substring(0, 5) : '00:00';
                const arrTime = seg.arrDate ? seg.arrDate.split('T')[1]?.substring(0, 5) : '00:00';
                const depDate = seg.depDate ? new Date(seg.depDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD';
                
                const airlineDisplay = seg.airName || seg.airLineName || seg.airline || bookingData.airline || 'Carrier';
                const airlineCode = seg.airCode || seg.airlineCode || seg.carrier || (airlineDisplay.length <= 3 ? airlineDisplay : '');
                
                doc.fontSize(9).font('Helvetica-Bold').fillColor(grayText).text(airlineDisplay, 35, segmentY + 15);
                doc.fontSize(8).font('Helvetica').text(`${airlineCode}${airlineCode ? '-' : ''}${seg.flightNo || seg.FlightNo || ''}`, 35, segmentY + 28);

                // Departure
                doc.fontSize(12).font('Helvetica-Bold').fillColor(emtBlue).text(seg.depCityName || bookingData.fromCity, 140, segmentY + 15);
                doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue).text(depTime, 175, segmentY + 15);
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#333').text(depDate, 140, segmentY + 28);
                doc.text(`Terminal ${seg.depTerminal || '-'}`, 140, segmentY + 38);

                // Arrow
                doc.moveTo(230, segmentY + 32).lineTo(360, segmentY + 32).lineWidth(0.5).strokeColor('#BBB').stroke();
                doc.moveTo(355, segmentY + 29).lineTo(360, segmentY + 32).lineTo(355, segmentY + 35).lineWidth(0.5).strokeColor('#BBB').stroke();
                doc.fontSize(7).font('Helvetica').fillColor(grayText).text(seg.duration || 'Direct', 230, segmentY + 35, { width: 130, align: 'center' });

                // Arrival
                doc.fontSize(12).font('Helvetica-Bold').fillColor(emtBlue).text(seg.arrCityName || bookingData.toCity, 400, segmentY + 15);
                doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue).text(arrTime, 460, segmentY + 15);
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#333').text(depDate, 400, segmentY + 28);
                doc.text(`Terminal ${seg.arrTerminal || '-'}`, 400, segmentY + 38);

                segmentY += 60;
            });

            doc.moveTo(35, segmentY).lineTo(560, segmentY).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#CCC').stroke().undash();
            segmentY += 20;

            // =============================================
            // 4. PASSENGER TABLE
            // =============================================
            const paxCols = [
                { title: 'Passenger', width: 140 },
                { title: 'Airline', width: 60 },
                { title: 'Status', width: 65 },
                { title: 'Sector', width: 65 },
                { title: 'AirLine PNR', width: 85 },
                { title: 'Ticket Number', width: 120 }
            ];
            const paxRows = (bookingData.passengerDetails || []).map(p => {
                const airlineDisplay = parsedFlights[0]?.airName || parsedFlights[0]?.airLineName || parsedFlights[0]?.airline || bookingData.airline || '-';
                return [
                    `${p.title || ''} ${p.fName || p.firstName || ''} ${p.lName || p.lastName || ''}`.toUpperCase(),
                    airlineDisplay,
                    'Confirm',
                    `${bookingData.fromCity}-${bookingData.toCity}`,
                    bookingData.pnr || '-',
                    p.ticketNo || 'TBD'
                ];
            });
            
            segmentY = drawSectionHeader(`Passengers - ${(bookingData.passengerDetails || []).length} Adults`, segmentY);
            segmentY = drawSimpleTable(segmentY, paxCols, paxRows);
            segmentY += 25;

            // =============================================
            // 5. FLIGHT INCLUSION
            // =============================================
            const incCols = [
                { title: 'Passenger', width: 140 },
                { title: 'Sector', width: 80 },
                { title: 'Airline', width: 60 },
                { title: 'Flight Insurance Status', width: 95 },
                { title: 'Free Cancellation', width: 95 },
                { title: 'Meal Type', width: 65 }
            ];
            const incRows = (bookingData.passengerDetails || []).map(p => {
                 const airlineDisplay = parsedFlights[0]?.airName || parsedFlights[0]?.airLineName || parsedFlights[0]?.airline || bookingData.airline || '-';
                 return [
                     `${p.title || ''} ${p.fName || ''} ${p.lName || ''}`.toUpperCase(),
                     `${bookingData.fromCity}-${bookingData.toCity}`,
                     airlineDisplay,
                     'Confirmed',
                     'Not Confirmed',
                     p.ssrInfo?.meal || 'Not Selected'
                 ];
            });
            segmentY = drawSectionHeader('Flight Inclusion', segmentY);
            segmentY = drawSimpleTable(segmentY, incCols, incRows);
            segmentY += 25;

            // =============================================
            // 6. BAGGAGE INFO
            // =============================================
            const bagCols = [
                { title: 'Airline', width: 100 },
                { title: 'Sector', width: 150 },
                { title: 'Check in', width: 142 },
                { title: 'Cabin', width: 143 }
            ];
            const bagRows = [[
                parsedFlights[0]?.airName || parsedFlights[0]?.airline || bookingData.airline || '-',
                `${bookingData.fromCity}-${bookingData.toCity}`,
                '15KG',
                '7KG'
            ]];
            segmentY = drawSectionHeader('Baggage Info', segmentY);
            segmentY = drawSimpleTable(segmentY, bagCols, bagRows);
            segmentY += 30;

            if (segmentY > 600) { doc.addPage(); segmentY = 40; }

            // =============================================
            // 7. FARE DETAILS
            // =============================================
            doc.rect(30, segmentY, 535, 160).strokeColor(borderColor).stroke();
            doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('Fare Details', 45, segmentY + 15);
            doc.text('Amount (INR)', 465, segmentY + 15);

            const basic = bookingData.netfare || (bookingData.totalCost * 0.85);
            const other = bookingData.totalCost - basic;

            doc.fontSize(9).font('Helvetica');
            let fareY = segmentY + 45;
            const fareItems = [
                ['Total Basic Fare :', basic],
                ['Other Charges (Taxes/Fees) :', other],
                ['Discount :', 0, '-'],
                ['Meal Amount :', 0],
                ['Seat Amount :', 0],
                ['Insurance Fee :', 0]
            ];

            fareItems.forEach(([label, val, prefix]) => {
                doc.fillColor(grayText).text(label, 45, fareY);
                doc.fillColor('#333').text(`${prefix || ''}Rs. ${Number(val).toFixed(2)}`, 450, fareY, { width: 100, align: 'right' });
                fareY += 16;
            });

            doc.moveTo(40, fareY + 5).lineTo(555, fareY + 5).lineWidth(0.5).strokeColor(borderColor).stroke();
            doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('Total', 45, fareY + 15);
            doc.fontSize(12).text(`Rs. ${Number(bookingData.totalCost || 0).toFixed(2)}`, 450, fareY + 15, { width: 100, align: 'right' });

            segmentY += 190;

            // =============================================
            // 8. CANCELLATION CHARGES
            // =============================================
            if (segmentY > 650) { doc.addPage(); segmentY = 40; }
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('Cancellation Charges', 35, segmentY);
            doc.fontSize(9).font('Helvetica').fillColor(grayText).text('Goyafly Fee: ', 35, segmentY + 15, { continued: true })
               .font('Helvetica-Bold').fillColor(darkBlue).text('Rs. 250 per pax per sector');
            
            segmentY += 40;
            const canCols = [{ title: 'Airline', width: 250 }, { title: 'Charges', width: 285 }];
            const canRows = [[parsedFlights[0]?.airName || 'Airline', 'As per Airline Policy + Rs. 250 fee']];
            segmentY = drawSimpleTable(segmentY, canCols, canRows);

            // =============================================
            // 9. TERMS & CONDITIONS
            // =============================================
            segmentY += 30;
            if (segmentY > 600) { doc.addPage(); segmentY = 40; }
            doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue).text('Terms & Conditions', 35, segmentY);
            doc.fontSize(7).font('Helvetica').fillColor(grayText).lineGap(2);
            const tc = [
                "• All passengers must present valid ID proof at the time of check-in.",
                "• Check-in begins 2 hours prior to scheduled departure and closes 45-60 minutes before.",
                "• Carriage and other facilities provided by the carrier are subject to their Terms and Conditions.",
                "• Baggage allowance is 15KG Check-in and 7KG Cabin unless specified otherwise.",
                "• For modifications or cancellations, please contact Goyafly support or the airline directly.",
                "• This is an electronically generated document and does not require a physical signature."
            ];
            doc.text(tc.join('\n'), 35, segmentY + 15, { width: 525 });

            // Final footer
            doc.fontSize(7).font('Helvetica-Oblique').fillColor('#CCC')
               .text('Thank you for choosing Goyafly. Visit www.goyafly.com for all your travel needs.', 30, 800, { align: 'center', width: 535 });

            // Finalize
            doc.end();
            stream.on('finish', () => resolve(`/uploads/${fileName}`));
            stream.on('error', (err) => reject(err));

        } catch (error) {
            logger.error('❌ Ticket Gen Error: ' + error.message);
            reject(error);
        }
    });
};

module.exports = { generatePDFTicket };
