const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('password123', 10);
  await db.collection('agents').updateOne(
    { emailAddress: 'rahul@zahatravels.com' },
    { $set: { 
        password: hash, 
        'wallet.balance': 50000,
        status: 'approved',
        emailVerified: true
      } 
    }
  );
  console.log('Wallet updated for rahul@zahatravels.com');
  process.exit(0);
}).catch(console.error);
