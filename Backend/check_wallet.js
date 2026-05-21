const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goyafly').then(async () => {
  const db = mongoose.connection.db;
  const agents = await db.collection('agents').find({'wallet.balance': {$gt: 0}}).toArray();
  console.log(agents.map(a => ({ email: a.emailAddress, balance: a.wallet.balance })));
  process.exit(0);
}).catch(console.error);
