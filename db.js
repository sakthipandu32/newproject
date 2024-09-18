const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'admin_pgresdb',
  password: 'Ui7e2n4$1',
  port: 5432,
  host: '84.46.241.145',
  database: 'admin_pgres',
});

// const pool = new Pool({
//   user: 'postgres',
//   password: 'sa2547',
//   port: 5432,
//   host: 'localhost',
//   database: 'kv_metaldbase',
// });

module.exports = pool;




// kavisoftek.in
// gsmetal@kavisoftek.in
// 54p@y1yQ7
// const totalAmount = parseFloat(quotation.amount_wo_gst, quotation.totalamount || 0);
// const roundedTotal = Math.round(totalAmount);
// const roundOffDifference = (roundedTotal - totalAmount).toFixed(2);

// <tr class="total-amount">
// <td>Round Off</td>
// <td style="text-align: right;">₹${roundOffDifference}</td>
// </tr>