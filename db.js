const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'admin_pgresdb',
  password: 'Ui7e2n4$1',
  port: 5432,
  host: '84.46.241.145',
  database: 'admin_pgres',
});

module.exports = pool;


