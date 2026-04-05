const Company = require('../models/Company');

async function seedDemoData() {
  try {
    const defaultOwnerId = '000000000000000000000000'; // Or some real admin user ID, but Mongoose validation might fail if it's not a real ObjectId, but 24 hex is fine.
    
    const count = await Company.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding demo companies...');
      await Company.insertMany([
        {
          name: 'Demo Company',
          email: 'info@democompany.com',
          phone: '0700000001',
          address: { country: 'Uganda', street: 'Kampala' },
          owner: defaultOwnerId,
          isActive: true
        },
        {
          name: 'Test Company',
          email: 'info@testcompany.com',
          phone: '0700000002',
          address: { country: 'Uganda', street: 'Entebbe' },
          owner: defaultOwnerId,
          isActive: true
        },
        {
          name: 'Sample Company',
          email: 'info@samplecompany.com',
          phone: '0700000003',
          address: { country: 'Uganda', street: 'Jinja' },
          owner: defaultOwnerId,
          isActive: true
        }
      ]);
      console.log('✅ Demo companies seeded.');
    }
  } catch (error) {
    console.error('❌ Failed to seed demo data:', error.message);
  }
}

module.exports = seedDemoData;
