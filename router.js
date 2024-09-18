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
router.get('/getjob/:jobworkName', controller.getJobwork);
router.get('/quotations/:salespersonId', controller.getSalespersonQuotations);
router.post('/forgotpassword', controller.forgotPassword);

//create...
router.post('/company', create.createCompany);
router.post('/unit', create.createUnit);
router.post('/jobwork', create.createJob);
router.post('/terms', create.TermsConditions);
router.post('/product', create.createProduct);
router.post('/quotation', create.insertQuotation);

//update...
router.put('/users/:user_id', update.updateCustomer); 
router.put('/updatecom/:company_id', update.updateCompany);
router.put('/updatejob/:jobwork_id', update.updateJobwork);
router.put('/updatepro/:product_id', update.updateProduct);
router.put('/updateunit/:unit_id', update.updateUnit);
router.put('/updatetc/:tc_id', update.updateTerms);  
router.put('/updatequotation/:quotationId', update.updateQuotation);
router.put('/updatepassword', update.updatepassword);


//delete...
router.delete('/deletecom/:company_id', remove.deleteCompany);
router.delete('/deletejob/:jobwork_id', remove.deleteJobwork);
router.delete('/deleteunit/:unit_id', remove.deleteunit);
router.delete('/deletepro/:product_id', remove.deleteproduct);
router.delete('/deletetc/:tc_id', remove.deleteterm);
router.delete('/deleteuser/:user_id', remove.deleteCustomer);
router.delete('/deletequotation/:quotationId', remove.deleteQuotation);

module.exports = router;
