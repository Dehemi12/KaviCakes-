const { execSync } = require('child_process');

const mysqlPath = '"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe"';
const auth = '-u root -proot123';

const dbsRaw = execSync(`${mysqlPath} ${auth} -e "SHOW DATABASES;"`).toString();
const dbs = dbsRaw.split('\n').slice(1).map(line => line.trim()).filter(line => line && !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(line));

console.log('--- Database Audit ---');
dbs.forEach(db => {
  console.log(`DB: ${db}`);
  try {
    const tablesRaw = execSync(`${mysqlPath} ${auth} -e "USE ${db}; SHOW TABLES;"`).toString();
    const tables = tablesRaw.split('\n').slice(1).map(line => line.trim()).filter(line => line);
    
    tables.forEach(table => {
      const countRaw = execSync(`${mysqlPath} ${auth} -e "USE ${db}; SELECT COUNT(*) FROM ${table};"`).toString();
      const count = countRaw.split('\n')[1].trim();
      if (parseInt(count) > 0) {
        console.log(`  [Data Found] ${table}: ${count} rows`);
      }
    });
  } catch (e) {
    console.log(`  Error checking ${db}`);
  }
});
