const axios = require('axios');

async function testApi() {
  try {
    const res = await axios.get('http://localhost:5000/api/reports/sales-revenue', {
      params: {
        startDate: '2026-04-01',
        endDate: '2026-05-31'
      }
    });

    console.log('--- API Response Summary ---');
    console.log('Selected Range:', res.data.dateRange);
    console.log('Total Orders:', res.data.summary.totalOrders);
    console.log('Total Revenue:', res.data.summary.totalRevenue);
    console.log('Daily Revenue:', res.data.summary.dailyRevenue);
    
    console.log('\nTrends Data:', res.data.trends);
  } catch (e) {
    console.error('API Error:', e.message);
  }
}

testApi();
