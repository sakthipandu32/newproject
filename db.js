const Pool = require('pg').Pool;

// const pool = new Pool({
//   user: 'admin_pgresdb',
//   password: 'Ui7e2n4$1',
//   port: 5432,
//   host: '103.160.106.193',
//   database: 'admin_pgres',
// });

const pool = new Pool({
  user: 'postgres',
  password: 'sa2547',
  port: 5432,
  host: 'localhost',
  database: 'kv_metaldbase',
});

module.exports = pool;



// https://gsmns.gsmetalcraft.in/quotation
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






// app.post('/products', async (req, res) => {
//   const { productname, description, price, secret_code } = req.body;

//   if (!productname || !secret_code) {
//     return res.status(400).json({ error: 'Product name and secret code are required' });
//   }

//   try {
//     // Generate barcode as a PNG buffer
//     const barcodeBuffer = await bwipjs.toBuffer({
//       bcid: 'code128',       // Barcode type
//       text: `${productname}-${secret_code}`, // Text to encode
//       scale: 3,              // Scaling factor
//       height: 10,            // Bar height, in millimeters
//       includetext: true,     // Include human-readable text
//       textxalign: 'center',  // Center-aligned text
//     });

//     // Save product details along with barcode in the database
//     const product = await Product.create({
//       productname,
//       description,
//       price,
//       secret_code,
//       barcode: barcodeBuffer, // Save binary barcode
//     });

//     res.status(201).json({
//       message: 'Product added successfully',
//       product,
//     });
//   } catch (error) {
//     console.error('Error adding product:', error);
//     res.status(500).json({ error: 'Failed to add product' });
//   }
// });