import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const usersCollection = mongoose.connection.db.collection('users');
  const users = await usersCollection.find({}).toArray();
  
  for (const user of users) {
    if (typeof user.organizationId === 'string') {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { organizationId: new mongoose.Types.ObjectId(user.organizationId) } }
      );
    }
  }
  console.log('✅ Fixed organizationId casting issues!');
  process.exit(0);
});
