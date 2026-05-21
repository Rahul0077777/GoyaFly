const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('password123', 10);
  await db.collection('agents').updateOne(
    { emailAddress: 'dummy@zaha.com' },
    { $set: { 
        password: hash, 
        wallet: { balance: 50000, currency: 'INR' },
        status: 'approved',
        emailVerified: true,
        agencyName: 'Dummy Agency',
        firstName: 'Dummy',
        lastName: 'Agent',
        mobileNumber: '9999999999'
      } 
    },
    { upsert: true }
  );
  console.log('Dummy agent created/updated.');
  process.exit(0);
}).catch(console.error);
