// Simple test script to verify registration API
async function testRegistration() {
  try {
    const response = await fetch('http://localhost:3000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123456',
        role: 'student'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('Registration successful!');
    } else {
      console.log('Registration failed:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

// Run the test
testRegistration();
