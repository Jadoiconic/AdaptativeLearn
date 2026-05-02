// Test script to verify User model functionality
const mongoose = require('mongoose');

// Test the User model directly
async function testUserModel() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test User model import
    const UserModel = require('./database/models/User').default;
    console.log('✅ User model imported successfully');

    // Test creating a user
    const testUser = new UserModel({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123456',
      role: 'student'
    });

    console.log('✅ User instance created successfully');
    console.log('User data:', {
      name: testUser.name,
      email: testUser.email,
      role: testUser.role
    });

    // Test saving (this will trigger the pre-save hook)
    const savedUser = await testUser.save();
    console.log('✅ User saved successfully');
    console.log('Saved user ID:', savedUser._id);

    // Test password comparison
    const isValid = await savedUser.comparePassword('test123456');
    console.log('✅ Password comparison works:', isValid);

    // Clean up
    await UserModel.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user cleaned up');

    console.log('🎉 All User model tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testUserModel();
