const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'postgres',
  password: 'sa2547',
  port: 5432,
  host: 'localhost',
  database: 'kv_metaldbase',
});

module.exports = pool;


