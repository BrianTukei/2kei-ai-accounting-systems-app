#!/usr/bin/env node

/**
 * Setup Default Company for Demo Bookings
 * Run this once to initialize the database with a default company
 * 
 * Usage: node scripts/setup_default_company.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  website: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  createdAt: { type: Date, default: Date.now }
});

const Company = mongoose.model('Company', companySchema);

async function setupDefaultCompany() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2k-ai-accounting');
    
    console.log('✅ Connected to database');

    // Check if default company exists
    const existing = await Company.findOne({});
    if (existing) {
      console.log('✅ Default company already exists:', existing._id);
      return existing;
    }

    // Create default company
    const company = await Company.create({
      name: '2K AI Accounting Systems',
      email: 'info@2kaccounting.com',
      phone: '+1-800-2K-ACCT',
      website: 'https://2kaccounting.com',
      country: 'USA'
    });

    console.log('✅ Default company created successfully!');
    console.log('   ID:', company._id);
    console.log('   Name:', company.name);
    console.log('   Email:', company.email);

    return company;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setupDefaultCompany().then(() => process.exit(0));
