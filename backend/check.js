import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await mongoose.connection.db.collection('users').find({ email: 'consumer@gmail.com' }).toArray();
  const orgs = await mongoose.connection.db.collection('organizations').find({ slug: 'lpu-slug' }).toArray();
  console.log('USERS:', users.map(u => ({ email: u.email, orgId: u.organizationId, isActive: u.isActive, hasHash: !!u.passwordHash })));
  console.log('ORGS:', orgs.map(o => ({ slug: o.slug, id: o._id, isActive: o.isActive })));
  process.exit(0);
});
