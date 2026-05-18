require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./src/Models/Admin.model');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = new Admin({
            name: 'Super Admin',
            email: 'admin@zayafly.com',
            password: 'admin123',
            role: 'SuperAdmin'
        });
        await admin.save();
        console.log('Admin created successfully');
        console.log('Email: admin@zayafly.com');
        console.log('Password: admin123');
        process.exit();
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();