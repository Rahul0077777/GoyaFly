const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
    paxType: { type: String, enum: ['Adult', 'Child', 'Infant'], required: true },
    title: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
});

const otbRequestSchema = new mongoose.Schema({
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer',
        required: false // Optional if guest can apply
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: false // If agent applies for customer
    },
    airline: { type: String, required: true },
    noOfAdults: { type: Number, default: 1 },
    noOfChildren: { type: Number, default: 0 },
    noOfInfants: { type: Number, default: 0 },
    
    travelDetails: {
        destination: { type: String, required: true },
        dateOfTravel: { type: Date, required: true },
        pnr: { type: String, required: true },
        contactNo: { type: String, required: true },
        email: { type: String, required: true }
    },
    
    passengers: [passengerSchema],
    
    documents: {
        passportCopy: { type: String }, // URL/Path
        visaCopy: { type: String },
        onwardTicket: { type: String },
        returnTicket: { type: String }
    },
    
    fees: {
        airlineFee: { type: Number, required: true },
        surcharge: { type: Number, default: 0 },
        urgentSurcharge: { type: Number, default: 0 },
        otbFee: { type: Number }, // Keep as optional for legacy
        handlingFee: { type: Number }, // Keep as optional for legacy
        igst: { type: Number, required: true },
        totalFare: { type: Number, required: true }
    },
    
    receiptNumber: { 
        type: String, 
        unique: true, 
        required: true 
    },
    
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING'
    },
    
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    
    adminNotes: { type: String },
    
    isUrgent: { type: Boolean, default: false }
}, { timestamps: true });

// receiptNumber index already created by unique:true on the field

otbRequestSchema.index({ 'travelDetails.contactNo': 1 });
otbRequestSchema.index({ status: 1 });

module.exports = mongoose.models.OTBRequest || mongoose.model('OTBRequest', otbRequestSchema);
