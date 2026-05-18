/**
 * PDF417 Barcode Generator Utility
 * 
 * Takes the barcodeText1 string from FTD booking response,
 * decodes the Base64 encoded string, and converts it into
 * a PDF417 barcode image for E-ticket placement.
 */

const bwipjs = require('bwip-js');
const logger = require('./logger');

/**
 * Generate a PDF417 barcode image from a Base64-encoded string
 * 
 * @param {string} barcodeText1 - Base64 encoded barcode data from FTD
 * @returns {Promise<Buffer>} - PNG image buffer of the PDF417 barcode
 */
const generatePDF417Barcode = async (barcodeText1) => {
    try {
        if (!barcodeText1 || typeof barcodeText1 !== 'string') {
            logger.warn('Barcode Generator: No barcodeText1 provided, skipping barcode generation.');
            return null;
        }

        // 1. Decode the Base64 string to get the raw barcode data
        const decodedText = Buffer.from(barcodeText1, 'base64').toString('utf-8');

        logger.info(`Barcode Generator: Decoded barcode data (${decodedText.length} chars)`);

        // 2. Generate PDF417 barcode image using bwip-js
        const pngBuffer = await bwipjs.toBuffer({
            bcid: 'pdf417',           // Barcode type: PDF417
            text: decodedText,        // The decoded barcode content
            scale: 2,                 // Scale factor
            height: 15,              // Bar height in mm
            columns: 10,             // Number of data columns
            eclevel: 2,              // Error correction level
            padding: 5,              // Padding around barcode in px
            backgroundcolor: 'ffffff', // White background
            barcolor: '000000'        // Black bars
        });

        logger.info(`Barcode Generator: PDF417 barcode generated (${pngBuffer.length} bytes)`);
        return pngBuffer;

    } catch (error) {
        logger.error('Barcode Generator Error: ' + error.message);
        // Return null instead of throwing — barcode is optional for ticket
        return null;
    }
};

/**
 * Generate a simple barcode from raw text (fallback for non-Base64 data)
 * 
 * @param {string} text - Raw text to encode
 * @returns {Promise<Buffer>} - PNG image buffer
 */
const generateBarcodeFromText = async (text) => {
    try {
        if (!text) return null;

        const pngBuffer = await bwipjs.toBuffer({
            bcid: 'pdf417',
            text: text,
            scale: 2,
            height: 15,
            columns: 10,
            eclevel: 2,
            padding: 5,
            backgroundcolor: 'ffffff',
            barcolor: '000000'
        });

        return pngBuffer;
    } catch (error) {
        logger.error('Barcode (raw text) Error: ' + error.message);
        return null;
    }
};

module.exports = { generatePDF417Barcode, generateBarcodeFromText };
