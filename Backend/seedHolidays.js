const mongoose = require('mongoose');
const HolidayPackage = require('./src/Models/HolidayPackage.model');
require('dotenv').config();

const packages = [
    { 
        pkgId: 'PK-001', 
        title: 'Eternal Dubai Experience', 
        days: '4N/5D', 
        price: 42500, 
        iconType: 'DUBAI', 
        highlights: ['Burj Khalifa', 'Desert Safari', 'Dhow Cruise'] 
    },
    { 
        pkgId: 'PK-002', 
        title: 'Tropical Maldives Bliss', 
        days: '3N/4D', 
        price: 85000, 
        iconType: 'MALDIVES', 
        highlights: ['Water Villa', 'Snorkeling', 'Private Dinner'] 
    },
    { 
        pkgId: 'PK-003', 
        title: 'Royal Rajasthan Heritage', 
        days: '6N/7D', 
        price: 28000, 
        iconType: 'RAJASTHAN', 
        highlights: ['Jaipur Forts', 'Udaipur Lakes', 'Jodhpur'] 
    }
];

const seedHolidays = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        await HolidayPackage.deleteMany({}); // Clear existing
        await HolidayPackage.insertMany(packages);

        console.log('Holiday packages seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding holidays:', error);
        process.exit(1);
    }
};

seedHolidays();
