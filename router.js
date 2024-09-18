const express = require('express');
const router = express.Router();
const controller = require('./controller')
const create = require('./create');
const update = require('./update');
const remove = require('./remove');
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./swagger');


router.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

//controller...
router.get('/get/:TableName', controller.getData);
router.post('/login', controller.login);
router.post('/createuser', controller.createUser);
router.get('/getcos', controller.getCustomer);
router.get('/getsales', controller.getSalesPerson);
router.get('/pdf/:quotationId', controller.getQuotationpdf);
router.get('/quotation', controller.getQuotation);
router.get('/products', controller.getJobwork);
router.post('/forgotpassword', controller.forgotPassword);

//create...
router.post('/company', create.createCompany);
router.post('/unit', create.createUnit);
router.post('/jobwork', create.createJob);
router.post('/terms', create.TermsConditions);
router.post('/product', express.raw({type: '*/*', limit: '10mb'}), create.createProduct);
router.post('/quotation', create.insertQuotation);
router.post('/pacage', create.pacage);
router.get('/pacage', create.getAllPackages);
router.post('/duplicate/:quotationId', create.copyQuotation);


//update...
router.put('/users/:user_id', update.updateCustomer); 
router.put('/updatecom/:company_id', update.updateCompany);
router.put('/updatejob/:jobwork_id', update.updateJobwork);
router.put('/updatepro/:product_id', update.updateProduct);
router.put('/updateunit/:unit_id', update.updateUnit);
router.put('/updatetc/:tc_id', update.updateTerms);  
router.put('/updatequotation/:quotationId', update.updateQuotation);
router.put('/updatepassword', update.updatepassword);
router.put('/approved/:quotationId', update.aprovedQuotation);



//delete...
router.delete('/deletecom/:company_id', remove.deleteCompany);
router.delete('/deletejob/:jobwork_id', remove.deleteJobwork);
router.delete('/deleteunit/:unit_id', remove.deleteunit);
router.delete('/deletepro/:product_id', remove.deleteproduct);
router.delete('/deletetc/:tc_id', remove.deleteterm);
router.delete('/deleteuser/:user_id', remove.deleteCustomer);
router.delete('/deletequotation/:quotationId', remove.deleteQuotation);

module.exports = router;





// html += `
// <div>
//     <table id="customers" style="border-collapse: collapse; width: 100%;">
//         <thead>
//             <tr>
//                 <th style="width: 10mm; text-align: center;">S/No</th>
//                 <th style="width: 35mm;">Product Name</th>
//                 <th style="width: 10mm;">Unit</th>
//                 <th style="width: 20mm; text-align: center;">Quantity</th>
//                 <th style="width: 20mm; text-align: right;">Price</th>
//                 <th style="width: 20mm; text-align: right;">Amount</th>
//             </tr>
//         </thead>
//         <tbody>
// `;

// let totalAmount = 0;

// for (const jobwork of jobworks) {
// const jobworkHeading = jobwork.jobwork_description
//     ? `${jobwork.jobwork_name} - ${jobwork.jobwork_description}`
//     : jobwork.jobwork_name;

// html += `
//     <tr>
//         <td colspan="6" style="font-weight: bold; color:#000000">${jobworkHeading}</td>
//     </tr>
// `;

// const productQuery = `SELECT * FROM quotation_product WHERE qj_id = $1`;
// const productValues = [jobwork.qj_id];
// const productResult = await pool.query(productQuery, productValues);
// const products = productResult.rows;

// let jobworkSubtotal = 0;
// let serialNumber = 1;

// for (const product of products) {
//     const proQuery = `SELECT * FROM product WHERE product_id = $1`;
//     const proValues = [product.prd_id];
//     const proResult = await pool.query(proQuery, proValues);
//     const pro = proResult.rows[0];

//     const productName = product.product_name && product.product_name.toLowerCase().includes("others")
//         ? product.other_productname
//         : product.product_name;

//     const price = quotation.selectedpricemethod === 'WholeSalePrice' ? product.product_wholesale_price : product.product_price;

//     let unitType = product.unit_type;
//     if (!isNaN(unitType)) {
//         const unitTypeQuery = `SELECT unit_type FROM unit WHERE unit_id = $1`;
//         const unitTypeResult = await pool.query(unitTypeQuery, [unitType]);
//         unitType = unitTypeResult.rows[0] ? unitTypeResult.rows[0].unit_type : unitType;
//     }


//     jobworkSubtotal += parseFloat(formattedAmount);
//     totalAmount += parseFloat(formattedAmount);

//     html += `
//         <tr>
//             <td style="width: 10mm; text-align: center;">${serialNumber++}</td>
//             <td style="width: 35mm;">
//                 ${productName}<br>
//                 ${pro && pro.product_description ? `
//                     <span style="display: inline-block; max-width: 100%; text-align: left; padding-left: 5mm; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
//                         ${pro.product_description}
//                     </span>
//                 ` : ''}
//             </td>
//             <td style="width: 10mm;">${unitType}</td>
//             <td style="width: 20mm; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formattedQuantity}</td>
//             <td style="width: 20mm; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">₹${formattedPrice}</td>
//             <td style="width: 20mm; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">₹${formattedAmount}</td>
//         </tr>
//     `;
// }
