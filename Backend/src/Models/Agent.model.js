const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema({
    agentCode: { type: String, unique: true, sparse: true },
    agentName: { type: String, required: true },
    agencyName: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    emailAddress: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    gstNumber: { type: String, default: null }, 
    address: { type: String, required: true },
    logo: { type: String, default: null }, // Agency branding logo
    
    // Modernized Structured KYC
    kycDocuments: {
        aadharFront: { type: String, default: null },
        aadharBack: { type: String, default: null },
        panCard: { type: String, default: null },
        shopDoc: { 
            category: { type: String, enum: ['Visiting Card', 'CSC ID', 'Shop Image'], default: 'Visiting Card' },
            url: { type: String, default: null }
        }
    },
    kycStatus: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED'], 
        default: 'PENDING' 
    },
    kycRejectReason: { type: String, default: null },
    isKycVerified: { type: Boolean, default: false }, // Legacy support
    
    walletBalance: { 
        type: Number, 
        default: 0, 
        min: [0, 'Transaction failed: Insufficient wallet balance.'] 
    },
    fdWalletBalance: { 
        type: Number, 
        default: 0, 
        min: [0, 'Transaction failed: Insufficient Fixed Departure wallet balance.'] 
    },
    
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    otbAccessStatus: { 
        type: String, 
        enum: ['NONE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'], 
        default: 'NONE' 
    },
    parentAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
    markups: {
        flightDomestic: { 
            type: { type: String, enum: ['Flat', 'Percentage'], default: 'Flat' }, 
            value: { type: Number, default: 0 } 
        },
        flightInternational: { 
            type: { type: String, enum: ['Flat', 'Percentage'], default: 'Flat' }, 
            value: { type: Number, default: 0 } 
        },
        hotel: { 
            type: { type: String, enum: ['Flat', 'Percentage'], default: 'Percentage' }, 
            value: { type: Number, default: 0 } 
        },
        bus: { 
            type: { type: String, enum: ['Flat', 'Percentage'], default: 'Flat' }, 
            value: { type: Number, default: 0 } 
        },
        train: { 
            type: { type: String, enum: ['Flat', 'Percentage'], default: 'Flat' }, 
            value: { type: Number, default: 0 } 
        }
    }
}, { 
    timestamps: true 
});

// Optimization Indexes for 10k+ Agents
agentSchema.index({ agentName: 'text', agencyName: 1 });
agentSchema.index({ isKycVerified: 1 });
agentSchema.index({ createdAt: -1 });

// Auto-generate agentCode before saving (when KYC is verified)
agentSchema.pre('save', async function() {
    // Generate agent code only when KYC is verified and code doesn't exist
    if (this.isKycVerified && !this.agentCode) {
        const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);
        // Find the last agent with a code to increment (sort by the code itself)
        const lastAgent = await Agent.findOne({ agentCode: { $ne: null } })
            .sort({ agentCode: -1 })
            .select('agentCode');
            
        let nextNum = 10001;
        if (lastAgent && lastAgent.agentCode) {
            // Extract numeric part from GF10005 -> 10005
            const match = lastAgent.agentCode.match(/\d+/);
            if (match) {
                nextNum = parseInt(match[0]) + 1;
            }
        }
        this.agentCode = `GF${nextNum}`;
    }

    // Password hashing
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Password Verification Method
agentSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// --- FIX STARTS HERE ---
// Check if the model exists in the mongoose.models object first
const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

module.exports = Agent;
// --- FIX ENDS HERE ---
