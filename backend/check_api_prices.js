
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/cakes?limit=5',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const cakes = JSON.parse(data);
                console.log('API Response Cakes:');
                cakes.forEach(c => {
                    console.log(`Cake: ${c.name}, Display Price: ${c.price}, Base: ${c.basePrice}`);
                });
            } catch (e) {
                console.error('Error parsing JSON:', e);
            }
        } else {
            console.log(`Status Code: ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
