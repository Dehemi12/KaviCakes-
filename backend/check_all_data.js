const mysql = require('mysql2/promise');

async function checkAllData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root123'
    });
    
    const dbs = ['kavicakes', 'kavicakes_db', 'cakeshop'];
    for (const db of dbs) {
      console.log(`--- Checking DB: ${db} ---`);
      await connection.query(`USE ${db}`);
      const [tables] = await connection.query('SHOW TABLES');
      for (const t of tables) {
        const tableName = Object.values(t)[0];
        const [[{count}]] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        if (count > 0) {
          console.log(`${tableName}: ${count} rows`);
        }
      }
    }
    await connection.end();
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

checkAllData();
