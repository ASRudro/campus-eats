const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function sync() {
  const dbPath = path.join(__dirname, '..', 'campuseats.sqlite');
  const sqlite = new sqlite3.Database(dbPath);

  const myConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campuseats'
  });

  console.log('🔗 Connected to MySQL and SQLite...');
  await myConn.query('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'categories',
    'users',
    'pickup_slots',
    'menu_items',
    'loyalty_rewards',
    'orders',
    'order_items',
    'favorites',
    'ratings',
    'weekly_schedules',
    'group_orders',
    'group_order_items',
    'group_order_contributions',
    'loyalty_transactions'
  ];

  for (const t of tables) {
    const rows = await new Promise((resolve, reject) => {
      sqlite.all(`SELECT * FROM ${t}`, [], (err, r) => (err ? reject(err) : resolve(r || [])));
    });

    if (!rows || rows.length === 0) continue;

    const cols = Object.keys(rows[0]);
    const placeholders = cols.map(() => '?').join(', ');
    const colNames = cols.map((c) => `\`${c}\``).join(', ');
    const updateClause = cols
      .filter((c) => c !== 'id')
      .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(', ');

    const sql = `INSERT INTO \`${t}\` (${colNames}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause || '`id`=`id`'}`;

    for (const row of rows) {
      const vals = cols.map((c) => row[c]);
      await myConn.query(sql, vals);
    }
    console.log(`✅ Synced ${rows.length} rows for ${t}`);
  }

  await myConn.query('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('🎉 All SQLite data successfully synced into MySQL database!');
  await myConn.end();
  sqlite.close();
}

sync().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
