const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Admin = require('../src/Models/Admin.model');

// 1. Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        // 2. Connect to DB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for Seeding...');

        // 3. Define Admin Credentials
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@zayafly.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        // 4. Check if Admin already exists
        const adminExists = await Admin.findOne({ email: adminEmail });
        if (adminExists) {
            console.log('Admin already exists! Updating password and role if needed...');
            adminExists.password = adminPassword;
            adminExists.role = 'SuperAdmin';
            await adminExists.save();
            console.log('Admin updated successfully.');
        } else {
            // 5. Create Admin if not exists
            await Admin.create({
                name: 'Super Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'SuperAdmin'
            });
            console.log('Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};

seedAdmin();
