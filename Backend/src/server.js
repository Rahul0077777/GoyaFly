const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('../src/config/db');
const app = require('./app');

// Connect to MongoDB, then start server and workers
connectDB().then(() => {
    // Start the FTD Booking Status Polling Worker
    const { startBookingStatusWorker } = require('./workers/bookingStatusWorker');
    startBookingStatusWorker();

    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server is running on 0.0.0.0:${PORT}`);
        console.log(`✈️  FTD Booking Status Worker is active`);
    });
}).catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});
