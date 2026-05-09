import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@rahbar.edu'; // You can change this
    const adminPassword = 'adminpassword123'; // CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log('⚠ Admin user already exists.');
      process.exit(0);
    }

    await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      campusID: 'ADMIN-001',
      department: 'Administration',
    });

    console.log('\x1b[32m✔ Admin account created successfully!\x1b[0m');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m✖ Error seeding admin:\x1b[0m', err.message);
    process.exit(1);
  }
};

seedAdmin();
