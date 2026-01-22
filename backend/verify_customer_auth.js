const API_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
    const email = `testcustomer_${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Test Customer';

    try {
        console.log('--- Registering Customer ---');
        const registerRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name,
                phone: '1234567890',
                address: '123 Baker St',
                role: 'CUSTOMER'
            })
        });

        const registerData = await registerRes.json();
        console.log('Register Response:', registerRes.status, registerData);

        if (registerRes.status !== 201) throw new Error('Registration failed');

        console.log('\n--- Logging in Customer ---');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                role: 'CUSTOMER'
            })
        });

        const loginData = await loginRes.json();
        console.log('Login Response:', loginRes.status);
        console.log('Token:', loginData.token ? 'Received' : 'Missing');
        if (loginData.user) {
            console.log('User Role:', loginData.user.role);
        }

        if (loginData.user && loginData.user.role === 'CUSTOMER') {
            console.log('\n✅ CUSTOMER AUTH VERIFIED SUCCESSFUL');
        } else {
            console.error('\n❌ WRONG ROLE OR LOGIN FAILED');
        }

    } catch (error) {
        console.error('\n❌ Auth verfication failed:', error);
    }
}

testAuth();
