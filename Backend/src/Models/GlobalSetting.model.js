const mongoose = require('mongoose');

const globalSettingSchema = new mongoose.Schema({
    maintenanceMode: { type: Boolean, default: false },
    otbServiceActive: { type: Boolean, default: true },
    fixedDepartureServiceActive: { type: Boolean, default: true },
    platformName: { type: String, default: 'GoyaFly' },
    contactEmail: { type: String, default: 'support@goyafly.com' },
    supportNumber: { type: String, default: '+91 9876543210' },
    defaultRefundMarkup: { type: Number, default: 300 },
    apiStatuses: {
        type: Map,
        of: String,
        default: {
            'FTD Travel API': 'Online',
            'Wallet Service': 'Online'
        }
    },
    apiKeys: {
        type: Map,
        of: String,
        default: {
            'Master Token': 'XYZ_SECURE_TOKEN_BASE_64_DEFAULT'
        }
    },
    homepageHeroTitle: { type: String, default: 'Discover the World with Goyafly' },
    homepageHeroSubtitle: { type: String, default: 'Your premium B2B travel portal for instant flight bookings, holidays, and visa processing.' },
    seoMetaTitle: { type: String, default: 'Goyafly B2B Travel Portal | Best Flight Fares & Fixed Departures' },
    seoMetaDescription: { type: String, default: 'Book guaranteed fixed departure seats, international holiday packages, and seamless visa processing with Goyafly.' },
    termsUrl: { type: String, default: 'https://goyafly.com/terms' },
    privacyUrl: { type: String, default: 'https://goyafly.com/privacy' }
}, { timestamps: true });

module.exports = mongoose.models.GlobalSetting || mongoose.model('GlobalSetting', globalSettingSchema);
