import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hash = await bcrypt.hash('123456', 10);
  await mongoose.connection.db.collection('users').updateMany(
    { role: { $ne: 'SUPER_ADMIN' } },
    { $set: { passwordHash: hash, isActive: true } }
  );
  console.log('✅ All Admin and Consumer passwords have been reset to: 123456');
  process.exit(0);
});
