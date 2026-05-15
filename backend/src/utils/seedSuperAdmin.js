import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

export const seedSuperAdmin = async () => {
  try {
    // 1. Create or find Super Admin master organization
    let org = await Organization.findOne({ slug: 'superadmin' });
    if (!org) {
      org = await Organization.create({
        name: 'Super Admin HQ',
        slug: 'superadmin',
        contactEmail: 'superadmin@energi.com',
        footerText: 'EnergI Platform Administration'
      });
    }

    // 2. Create or find Super Admin user
    const email = 'ansh@gmail.com';
    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash('ansh12345', 12);
      user = await User.create({
        organizationId: org._id,
        name: 'Ansh Babel',
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
      });
      console.log(`👑 Super Admin account seeded successfully [${email}]`);
    }
  } catch (err) {
    console.error('⚠️ Failed to seed Super Admin account:', err.message);
  }
};
