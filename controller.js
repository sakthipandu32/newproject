const bcrypt = require('bcrypt');
const pool = require('./db');
const fs = require('fs');

//create user...
const createUser = async (request, response) => {
    const { first_name, last_name, user_password, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number, client_name } = request.body;

    try {
        const userCheckQuery = 'SELECT * FROM "users" WHERE email_id = $1';
        if (email_id && email_id.trim() !== '') {
            const userCheckResult = await pool.query(userCheckQuery, [email_id]);
            if (userCheckResult.rows.length > 0) {
                return response.status(400).json({ error: 'Email already exists' });
            }
        }
        let hashedPassword = null;

        if (user_password) {
            hashedPassword = await bcrypt.hash(user_password, 10);
        }

        const insertUserQuery = `
        INSERT INTO "users" (first_name, last_name, user_password, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number, client_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`;

        const userValues = [first_name, last_name, hashedPassword, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number, client_name];
        await pool.query(insertUserQuery, userValues);

        response.status(201).json({ message: 'User created successfully', password: user_password });


    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

//login...
const login = async (req, res) => {
    const { email_id, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM "users" WHERE email_id = $1', [email_id]);

        if (userResult.rows.length > 0) {
            const storedPassword = userResult.rows[0].user_password;
            const passwordMatch = await bcrypt.compare(password, storedPassword);

            if (passwordMatch) {
                const userRole = userResult.rows[0].user_role;
                const userId = userResult.rows[0].user_id;
                const firstletter = userResult.rows[0].first_name.charAt(0);
                const lastletter = userResult.rows[0].last_name.charAt(0);
                const initial = { firstletter, lastletter };

                if (userRole === 'admin') {
                    const responseData = ['user', 'company', 'jobwork', 'terms&condition', 'product', 'unit', 'quotation'];
                    res.json({ success: true, message: 'Login successful', data: responseData, user_id: userId, userRole, initial });
                }
                else if (userRole === 'salesperson') {
                    const responseData = ['user', 'quotation'];
                    res.json({ success: true, message: 'Login successful', data: responseData, user_id: userId, userRole, initial });
                } 
               else if (userRole === 'staff') {
                    const responseData = ['user', 'jobwork', 'terms&condition', 'product', 'unit', 'quotation'];
                    res.json({ success: true, message: 'Login successful', data: responseData, user_id: userId, userRole, initial });
                } else {
                    res.status(401).json({ success: false, message: 'Invalid user role' });
                }
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            } 
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//forgot Password...
const nodemailer = require('nodemailer');
const generator = require('generate-password');

const forgotPassword = async (req, res) => {
    const { email_id } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM "users" WHERE email_id = $1', [email_id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newPassword = generator.generate({ length: 10, numbers: true, uppercase: true, strict: true });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE "users" SET user_password = $1 WHERE email_id = $2',
            [hashedPassword, email_id]
        );

        const transporter = nodemailer.createTransport({
            host: "mail.gsmetalcraft.in",
            port: 587,
            secure: false,
            auth: {
                user: 'admin@gsmetalcraft.in',
                pass: '0bioV@z^}V}R',
            },
            tls: {
                rejectUnauthorized: false
            },
        });

        const mailOptions = {
            from: 'admin@gsmetalcraft.in',
            to: email_id,
            subject: 'Password Reset',
            html: `
                 <div style=" font-family: Arial, Helvetica, sans-serif;  padding: 20px;  text-align: center;  background-color: #EEEEF5;  border: 1px solid #CCCCCC;  border-radius: 10px; max-width: 650px;  margin: 0 auto;">
                 <h1 style="color: #213785; margin: 0;">Password Reset</h1>
                 <p style="font-size: 16px; color: #333; margin: 10px 0;">
                     Your new password is: 
                 </p>
                 <div style="font-size: 20px; color: #2196F3; background-color: #FFFFFF; border: 1px solid #CCCCCC; border-radius: 5px; padding: 10px; display: inline-block;">
                     ${newPassword}
                      </div>
                 <p style="font-size: 16px; color: #333; margin: 10px 0;">
                     Please change your password after logging in.
                 </p>
             </div>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error during forgot-password:', error);
                res.status(500).json({ success: false, message: error.message || 'Error sending email' });
            } else {
                console.log('Password reset email sent:', info.response);
                res.json({ success: true, message: 'Password reset email sent' });
            }
        });


    } catch (error) {
        console.error('Error during forgot-password:', error);
        res.status(500).json({ success: false, message: error });
    }
};

//getdata...
const getData = async (request, response) => {
    const TableName = request.params.TableName;
    const orderBy = request.query.orderBy || TableName;
    const orderDirection = request.query.orderDirection || 'ASC';

    try {
        let query;
        if (TableName === 'users') {
            query = `SELECT * FROM ${TableName} WHERE user_id <> 0 ORDER BY ${orderBy} ${orderDirection}`;
        } else {
            query = `SELECT * FROM ${TableName} ORDER BY ${orderBy} ${orderDirection}`;
        }


        const { rows } = await pool.query(query);

        if (rows.length > 0) {
            const data = rows.map(row => {
                if (row.tc_value) {
                    const term = row.tc_value;
                    const tc_value = term.replace(/[\[\]{}"\\]/g, '').trim();
                    row.tc_value = tc_value;
                }
                if (row.product_name) {
                    const text = row.product_name;
                    const product_name = text.replace(/&#39;/g, "'").trim();
                    row.product_name = product_name;
                }
                
                if (TableName === 'users' && row.user_password !== '') {
                    row.user_password = '';
                }

                if (TableName === 'company' && row.company_logo) {
                    const base64 = row.company_logo;
                    const src = "" + base64;
                    row.editImage = src;
                }

                if (TableName === 'product' && row.product_image) {
                    const base64 = row.product_image;
                    const src = "" + base64;
                    row.editImage = src;
                }
                return row;
            });
            response.status(200).json({ TableName: data });
        } else {
            return response.status(200).json({ TableName: [] });
        }

    } catch (error) {
        console.error('Error:', error.message);
        response.status(500).json({ error: 'Failed to get data' });
    }
};


//getcustomer...
const getCustomer = async (request, response) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE user_role = 'customer'");
        response.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
};


//getsalesperson...
const getSalesPerson = async (request, response) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE user_role = 'salesperson'");
        response.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
};


const getQuotation = async (request, response) => {
    const orderBy = request.query.orderBy || 'quotation_id';
    const orderDirection = request.query.orderDirection || 'DESC';

    try {
        const quotationQuery = `
        SELECT 
            q.*, 
            CONCAT(cust.first_name, cust.last_name) AS customer_name,
            CONCAT(sales.first_name, sales.last_name) AS salesperson_name,
            CONCAT(prep.first_name, prep.last_name) AS preparedby_name,
            cust.address1, cust.address2, cust.city, cust.phone_no, cust.zip_code,
            comp.company_name,
            json_agg(
                json_build_object(
                    'qj_id', jq.qj_id,
                    'q_id', jq.q_id,
                    'job_id', jq.job_id,
                    'jobwork_name', jq.jobwork_name,
                    'jobwork_description', jq.jobwork_description,
                    'productData', (
                        SELECT json_agg(
                            json_build_object(
                                'qp_id', qp.qp_id,
                                'qj_id', qp.qj_id,
                                'prd_id', qp.prd_id,
                                'product_name', qp.product_name,
                                'product_quantity', qp.product_quantity,
                                'product_price', qp.product_price,
                                'product_description', qp.product_description,
                                'unit_type', qp.unit_type,
                                'amount', qp.amount,
                                'other_productname', qp.other_productname,
                                'product_wholesale_price', qp.product_wholesale_price,
                                'actual_price', qp.actual_price,
                                'actual_wholesale_price', qp.actual_wholesale_price
                            )
                            ORDER BY qp.qp_id ASC
                        )
                        FROM quotation_product qp 
                        WHERE qp.qj_id = jq.qj_id
                    )
                )
                ORDER BY jq.qj_id ASC
            ) AS jobworkData
        FROM 
            quotation q
        LEFT JOIN users cust ON q.customer_id = cust.user_id
        LEFT JOIN users sales ON q.salesperson_id = sales.user_id
        LEFT JOIN users prep ON q.prepared_by = prep.user_id
        LEFT JOIN company comp ON q.company_id = comp.company_id
        LEFT JOIN quotation_jobwork jq ON jq.q_id = q.quotation_id
        GROUP BY q.quotation_id, cust.user_id, sales.user_id, prep.user_id, comp.company_id
        ORDER BY ${orderBy} ${orderDirection}`;

        const quotationResult = await pool.query(quotationQuery);
        const quotations = quotationResult.rows;

        for (const quotation of quotations) {
            quotation.address = `${quotation.address1 || ''}, ${quotation.address2 || ''}, ${quotation.city || ''}, ${quotation.zip_code || ''}, ${quotation.phone_no || ''}`;
            quotation.customer_phone_no = quotation.phone_no || '';

            const date = new Date(quotation.date);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            quotation.quotation_date = formattedDate;

            quotation.approved_status = quotation.approved_status === '1' ? 'Approved' : 'Unapproved';
        }

        response.status(200).json({ quotations });
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' });
        console.error('Error fetching quotations:', error);
    }
};




const getproduct = async (request, response) => {
    try {
        const productQuery = await pool.query(`
            SELECT p.*, u.unit_id, u.unit_type
            FROM product p
            LEFT JOIN unit u ON p.u_id = u.unit_id
        `);

        const products = productQuery.rows.map(product => {
            const { u_id, product_image, unit_id, unit_type, ...productData } = product;
            return {
                ...productData,
                unit: {
                    unit_id: unit_id,
                    unit_type: unit_type
                }
            };
        });
        response.status(200).json({
            products: products
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

//get salesperson quotation...
const getSalespersonQuotations = async (request, response) => {
    const { salespersonId } = request.params;
    try {
        const quotationQuery = `SELECT * FROM quotation WHERE salesperson_id = $1`;
        const quotationResult = await pool.query(quotationQuery, [salespersonId]);

        if (quotationResult.rowCount === 0) {
            return response.status(200).json({ error: 'No quotations found' });
        }

        const quotations = quotationResult.rows;

        for (const quotation of quotations) {
            const customerQuery = `SELECT first_name, last_name, address1 FROM users WHERE user_id = $1`;
            const customerValues = [quotation.customer_id];
            const customerResult = await pool.query(customerQuery, customerValues);
            const customer = customerResult.rows[0];

            const salesQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1`;
            const salesValues = [quotation.salesperson_id];
            const salesResult = await pool.query(salesQuery, salesValues);
            const sales = salesResult.rows[0];

            const preparedQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1`;
            const preparedValues = [quotation.prepared_by];
            const preparedResult = await pool.query(preparedQuery, preparedValues);
            const prepared = preparedResult.rows[0];

            const companyQuery = `SELECT company_name FROM company WHERE company_id = $1`;
            const companyValues = [quotation.company_id];
            const companyResult = await pool.query(companyQuery, companyValues);
            const company = companyResult.rows[0];

            quotation.customer_name = customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer';
            quotation.salesperson_name = sales ? `${sales.first_name} ${sales.last_name}` : 'Unknown Salesperson';
            quotation.preparedby_name = prepared ? `${prepared.first_name} ${prepared.last_name}` : 'Unknown Preparer';
            quotation.company_name = company ? company.company_name : 'Unknown Company';

            const date = new Date(quotation.date);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            quotation.quotation_date = formattedDate;

            console.log(`Quotation ID: ${quotation.quotation_id}, Approved Status: ${quotation.approved_status}`);

            quotation.approved_status = quotation.approved_status === 1 ? 'Approved' : 'Unapproved';

            const jobworkQuery = `SELECT * FROM quotation_jobwork WHERE q_id = $1`;
            const jobworkValues = [quotation.quotation_id];
            const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
            const jobworks = jobworkResult.rows;

            for (const jobwork of jobworks) {
                const productQuery = `SELECT * FROM quotation_product WHERE qj_id = $1`;
                const productValues = [jobwork.qj_id];
                const productResult = await pool.query(productQuery, productValues);

                jobwork.productData = productResult.rows;
            }
            quotation.jobworkData = jobworks;
        }
        response.status(200).json({ quotations });
    } catch (error) {
        console.error('Error fetching quotations:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

//get jobwork...
const getJobwork = async (request, response) => {
    try {
        const productQuery = await pool.query(`
            SELECT p.*, u.unit_id, u.unit_type
            FROM product p
            LEFT JOIN unit u ON p.u_id = u.unit_id
        `);

        const products = productQuery.rows.map(product => {
            if (product.product_name) {
                const text = product.product_name;
                const processedName = text.replace(/&#39;/g, "'").trim();
                product.product_name = processedName;
            }
            
            const { u_id, product_image, unit_id, unit_type, ...productData } = product;
            return {
                ...productData,
                unit: {
                    unit_id: unit_id,
                    unit_type: unit_type
                }
            };
        });
        response.status(200).json({
            products: products
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

//quotation pdf...
const puppeteer = require('puppeteer');

const getQuotationpdf = async (request, response) => {
    let { quotationId } = request.params;
    let { bp } = request.query;

    try {
        const quotationQuery = `SELECT * FROM quotation WHERE quotation_id = $1`;
        const quotationResult = await pool.query(quotationQuery, [quotationId]);

        if (quotationResult.rows.length === 0) {
            return response.status(404).json({ error: 'Quotation not found' });
        }

        const quotation = quotationResult.rows[0];

        if (bp !== 'y' && quotation.approved_status !== '1') {
            return response.status(404).json({ error: 'Quotation is not approved' });
        }

        const customerQuery = `SELECT first_name, last_name, address1, address2,client_name , city FROM users WHERE user_id = $1`;
        const customerValues = [quotation.customer_id];
        const customerResult = await pool.query(customerQuery, customerValues);
        const customer = customerResult.rows[0];


        const salesQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1`;
        const salesValues = [quotation.salesperson_id];
        const salesResult = await pool.query(salesQuery, salesValues);
        const sales = salesResult.rows[0];

        const PreparedQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1`;
        const PreparedValues = [quotation.prepared_by];
        const PreparedResult = await pool.query(PreparedQuery, PreparedValues);
        const Prepared = PreparedResult.rows[0];

        const companyQuery = `
        SELECT company_name, company_logo, address1, address2, company_phone_no, alter_no,landline_no,bank_name, bank_branch, bank_ac_no, ifsc_number FROM company WHERE company_id = $1 `;
        const companyValues = [quotation.company_id];
        const companyResult = await pool.query(companyQuery, companyValues);
        const company = companyResult.rows[0];

        const approvedQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1 `;
        const approvedValues = [quotation.approved_by];
        const approvedResult = await pool.query(approvedQuery, approvedValues);
        const approved = approvedResult.rows[0];

        const quotationDate = new Date(quotation.date);
        const formattedQuotationDate = `${quotationDate.getDate()}-${quotationDate.getMonth() + 1}-${quotationDate.getFullYear()}`;

        const jobworkQuery = `SELECT * FROM quotation_jobwork WHERE q_id = $1 ORDER BY qj_id ASC`;
        const jobworkValues = [quotationId];
        const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
        const jobworks = jobworkResult.rows;



        let totalamount = parseFloat(quotation.amount_wo_gst || 0) + parseFloat(quotation.gst_amount || 0) + parseFloat(quotation.totalamount || 0);
        const roundedTotal = Math.round(totalamount);
        const roundOffDifference = (roundedTotal - totalamount).toFixed(2);


        const bootstrapCSS = `<link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">`;
        const styleCssc = ` <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
`

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${quotation.quotation_type}</title>
            ${bootstrapCSS}
            ${styleCssc}
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-transform: capitalize;
                    margin: 0;
                    font-size: 18px;
                    page-break-before: always;
                }
                .quotation-header {
                    text-align: center;
                     text-transform: uppercase;
                }
                .est-caption {
                    text-align: center;
                }
                .details {
                     display: flex;
                     justify-content: space-between;
                     gap: 20px; 
                     margin-top: 30px;
                }
               .amountdetails {
                   display: flex;
                   justify-content: space-between;
                   align-items: flex-start;
                   gap: 20px;
                }
               .rupees{
                    margin-top: 50px;
                 }
               .amount {
                    flex-shrink: 0;
                    padding-right: 150px;
                 }

               .customer-info, .right-info {
                    font-size: 20px;
                    line-height: 1.25;
                    background-color: #EEEEF5;
                    padding: 15px;
                    width: 48%;
                    border: 1px solid #CCCCCC;
                    border-radius: 10px;
                    box-sizing: border-box;
}
                .company-address {
                      text-align: right;
                      line-height: 1.5;
                      width: 380px; 
                      word-wrap: break-word; 
                }
        
                .total-amount {
                    color: #111C43;
                    font-weight: bold;
                    font-size:24px;
                }
                .table th,
                .table td {
                    padding: 6px;
                    border: none;
                }
                .customer-info label {
                    font-weight: bold;
                }
                
                .container {
                   page-break-after: always;
                }.company-logo {
                    height: 150px; 
                    width: auto;
                }
                .head{
                    font-weight: bold;
                }
                html {
                    -webkit-print-color-adjust: exact;
                  }
                  .textcolor{
                    color:#000000;
                    font-weight: bold;
                  }
                  #customers {
                    font-family: Arial, Helvetica, sans-serif;
                    width: 100%;

                  }
                  
                  #customers td, #customers th {
                    border: 1px solid #ddd;
                    padding: 8px;
                    border-collapse: collapse;
                    border: none;
                  }

                  #customers th {
                    padding-top: 12px;
                    padding-bottom: 12px;
                    text-align: left;
                    background-color: #6495ED;
                    color: white;
                  }
                  .bank label {
                    font-weight: bold;
                  }
                hr{
                border: none;
                 border-top: 0.5px solid #000;
                 margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
            
                ${quotation.show_header === 'true' ? `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 20px;">
                    <div>
                        <img src="${company.company_logo}" alt="Company Logo" class="company-logo"> 
                    </div>
                   <div class="company-address">
                <p>
                    ${company.address1 ? `${company.address1}<br>` : ''}
                    ${company.address2 ? `${company.address2}<br>` : ''}
                    ${(company.landline_no || company.company_phone_no || company.alter_no) ?
                        `<i class="fa-solid fa-phone"></i> 
                        ${[
                            company.landline_no,
                            company.company_phone_no,
                            company.alter_no
                        ].filter(Boolean).join(', ')}`
                    : ''}
                </p>


              </div>



                </div>
                ` : ''}
                <hr  style=" border: none; border-top: 0.5px solid #000;margin: 20px 0;">
           <div class="quotation-header">
          <h2 class="textcolor">
  ${quotation.quotation_type === "Estimates"
    ? "Estimate"
    : quotation.quotation_type === "Quotation"
    ? "Bill"
    : quotation.quotation_type}
</h2>
        </div>
        <div class="details">
      <div class="customer-info">
    <h4 class="textcolor">To :</h4>
    <p>${customer.first_name} ${customer.last_name ? customer.last_name : ''}<br>
        ${customer.client_name ? `  Client - ${customer.client_name}<br>` : ''}
       ${customer.address1 && customer.address2 ? `${customer.address2}, ${customer.address1}<br>` : customer.address1 ? `${customer.address1}<br>` : ''}
       ${customer.city}</p>
</div>

       <div class="right-info">
    <p>
        <label>Date:</label> ${formattedQuotationDate}<br>
        <label>Document No:</label> ${quotation.document_no}<br>
        <label>Rep:</label>  ${sales.first_name} ${sales.last_name ? sales.last_name : ''}<br>
        ${Prepared ? (Prepared.last_name ?  `<label>Prepared By:</label>  ${Prepared.first_name} ${Prepared.last_name}` : Prepared.first_name) : ''}<br>
        ${approved ? (approved.last_name ? `<label>Approved By:</label> ${approved.first_name} ${approved.last_name}` : approved.first_name) : ''}

    </p>
</div>

    </div>
    <hr style=" border: none; border-top: 0.5px solid #000;margin: 20px 0;">
    `

        html += `
           
            ${quotation.est_caption ? `
                <div  class="est-caption">
                    <h4 class="textcolor">${quotation.est_caption}</h4>
                </div>
                
            ` : ''}
           `;
        html += `
            <div>
                <table id="customers">
                    <thead>
                        <tr>
                            <th>S/No</th>
                            <th>Product Name</th>
                            <th>Unit</th>
                            <th style="text-align: center;">Quantity</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let totalAmount = 0;


        for (const jobwork of jobworks) {
            const jobworkHeading = jobwork.jobwork_description
                ? `${jobwork.jobwork_name} - ${jobwork.jobwork_description}`
                : jobwork.jobwork_name;

            html += `
                <tr>
                    <td colspan="6" style="font-weight: bold; color:#000000">${jobworkHeading}</td>
                </tr>
            `;

            const productQuery = `SELECT * FROM quotation_product WHERE qj_id = $1 ORDER BY qp_id ASC`;
            const productValues = [jobwork.qj_id];
            const productResult = await pool.query(productQuery, productValues);
            const products = productResult.rows;

            let jobworkSubtotal = 0;
            let serialNumber = 1;

            for (const product of products) {
                const proQuery = `SELECT * FROM product WHERE product_id = $1`;
                const proValues = [product.prd_id];
                const proResult = await pool.query(proQuery, proValues);
                const pro = proResult.rows[0];

                const productName = product.product_name && product.product_name.toLowerCase().includes("others")
                    ? product.other_productname
                    : product.product_name;

                const price = quotation.selectedpricemethod === 'WholeSalePrice' ? parseFloat(product.product_wholesale_price).toFixed(2) : parseFloat(product.product_price).toFixed(2);
                const quantity = parseFloat(product.product_quantity).toFixed(2);

                let unitType = product.unit_type;
                // if (!isNaN(unitType)) {
                //     const unitTypeQuery = `SELECT unit_type FROM unit WHERE unit_id = $1`;
                //     const unitTypeResult = await pool.query(unitTypeQuery, [unitType]);
                //     unitType = unitTypeResult.rows[0] ? unitTypeResult.rows[0].unit_type : unitType;
                // }

                jobworkSubtotal += parseFloat(product.amount);
                totalAmount += parseFloat(product.amount);

                html += `
                <tr>
                   <td style="width: 5%; text-align: center;">${serialNumber++}</td>
                   <td style="width: 35%;">
                   ${productName}<br>
                        ${pro && pro.product_description && pro.product_description !== 'nan' ? `
                            <span style="display: inline-block; max-width: 80%; text-align: left; padding-left: 40px; font-size: 16px;">
                                ${pro.product_description}
                            </span>
            ` : ``}
               </td>
                    <td style="width: 5%;">${unitType}</td>
                    <td style="width: 10%; text-align: center;">${quantity}</td>
                    <td style="width: 10%; text-align: right;">₹${price}</td>
                    <td style="width: 10%; text-align: right;">₹${product.amount}</td>
                </tr>
            `;
            }

            html += `
            <tr>
                <td colspan="6" style="padding-top: 10px;">
                    <hr style="border: none; border-top: 0.5px solid #000; margin: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; color: #000000; font-weight: bold; font-size: 24px; margin-top: 10px;margin-bottom: 10px;">
                      <p style="margin: 0;font-size: 18px; padding-left: 500px;">Sub Total</p>
                                <p style="margin: 0;font-size: 18px;">₹${jobworkSubtotal.toFixed(2)}</p>
                    </div>
                    <hr style="border: none; border-top: 0.5px solid #000; margin: 0;">
                </td>
            </tr>
            `;
        }


        html += `
            </tbody>
        </table>
        </div>
    `;

        const quotationtotalAmount = quotation.totalamount || 0;
        const advanceAmount = quotation.advance_amount || 0;
        const balanceAmount = quotationtotalAmount - advanceAmount;

        const subtotalAmount = totalAmount;

        function number2text(value) {
            var fraction = Math.round(frac(value)*100);
            var f_text  = "";
        
            if(fraction > 0) {
                f_text = "And "+convert_number(fraction)+" Paise";
            }
        
            return convert_number(value)+" Rupees"+f_text+" Only";
        }
        
        function frac(f) {
            return f % 1;
        }
        
        function convert_number(number)
        {
            if ((number < 0) || (number > 999999999)) 
            { 
                return "NUMBER OUT OF RANGE!";
            }
            var Gn = Math.floor(number / 10000000); 
            number -= Gn * 10000000; 
            var kn = Math.floor(number / 100000);     
            number -= kn * 100000; 
            var Hn = Math.floor(number / 1000);      
            number -= Hn * 1000; 
            var Dn = Math.floor(number / 100);       
            number = number % 100;    
            var tn= Math.floor(number / 10); 
            var one=Math.floor(number % 10); 
            var res = ""; 
        
            if (Gn>0) 
            { 
                res += (convert_number(Gn) + " Crore"); 
            } 
            if (kn>0) 
            { 
                    res += (((res=="") ? "" : " ") + 
                    convert_number(kn) + " Lakh"); 
            } 
            if (Hn>0) 
            { 
                res += (((res=="") ? "" : " ") +
                    convert_number(Hn) + " Thousand"); 
            } 
        
            if (Dn) 
            { 
                res += (((res=="") ? "" : " ") + 
                    convert_number(Dn) + " Hundred"); 
            } 
        
        
            var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"); 
        var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"); 
        
            if (tn>0 || one>0) 
            { 
                if (!(res=="")) 
                { 
                    res += " And "; 
                } 
                if (tn < 2) 
                { 
                    res += ones[tn * 10 + one]; 
                } 
                else 
                { 
        
                    res += tens[tn];
                    if (one>0) 
                    { 
                        res += ("-" + ones[one]); 
                    } 
                } 
            }
        
            if (res=="")
            { 
                res = "zero"; 
            } 
            return res;
        }
        
        const totalAmounts = quotation.totalamount;
        const totalAmountInWords = number2text(Math.floor(totalAmounts));     
        
html += `
<div class="amountdetails">
<div class="rupees">
        <div style="text-align: left;">
            <div style="display: inline-block; vertical-align: top;font-weight: bold; color:#000000">Rupees in Words:</div>
            <div style="display: inline-block; width: 50%; vertical-align: top; font-size: 18px;">${totalAmountInWords}</div>
        </div>
    </div>
<div class="amount">
    <table class="table" style="width: 150%; border-collapse: collapse; border: none; page-break-inside: avoid; line-height: 1.25;">
      
            <tr>
                <td style="text-align: left;">Gross</td>
                <td style="text-align: right;">₹${subtotalAmount.toFixed(2)}</td>
            </tr>
     
       
       <tr>
           <td>${quotation.additional_text}</td>
           <td style="text-align: right;">₹${parseFloat(quotation.additional_value).toFixed(2)}</td>
       </tr>

       
        ${(quotation.less_value || quotation.less_amount > 0) ? `
            <tr>
                <td>${quotation.less_text}</td>
                <td>
                    <div style="display: flex; justify-content: space-between;">
                        <span>${quotation.less_value > 0 ? `${quotation.less_value}%` : ''}</span>
                        <span style="text-align: right;">−₹${(quotation.lessvalue_amount || quotation.less_amount)}</span>
                    </div>
                </td>
            </tr>
        ` : ''}
        
            <tr>
                <td>GST</td>
                <td>
                    <div style="display: flex; justify-content: space-between;">
                        <span>${quotation.gst}%</span>
                        <span style="text-align: right;">₹${quotation.gst_amount}</span>
                    </div>
                </td>
            </tr>
        
        <tr>
            <td>Roff</td>
            <td style="text-align: right;">${roundOffDifference}</td>
        </tr>
        ${advanceAmount > 0 ? `
            <tr>
                <td>Advance</td>
                <td style="text-align: right;">₹${quotation.advance_amount}</td>
            </tr>
            <tr>
                <td>Balance</td>
                <td style="text-align: right;">₹${balanceAmount.toFixed(2)}</td>
            </tr>
        ` : ''}

            <tr class="total-amount">
                <td>Total Amount</td>
                <td style="text-align: right;">₹${quotation.totalamount}</td>
            </tr>
    </table>
</div>
</div>  
   <hr>
`;

if (quotation.quotation_type === 'Estimates' && quotation.terms_conditions && quotation.terms_conditions.trim() !== '[]') {
    let termsHtml = `<div style="page-break-inside: avoid;"><h3 class="textcolor">Terms and Conditions</h3><ul>`;
    const ids = quotation.terms_conditions
        .split(',')
        .filter(Boolean)
        .map(tc_id => tc_id.replace(/[\[\]{}"\\]/g, '').trim());

    let validTermsFound = false;

    for (const tc_id of ids) {
        const term = await pool.query(`SELECT tc_value FROM terms_condition WHERE tc_id = ${tc_id}`);
        if (term && term.rows.length > 0) {
            const tcValues = term.rows
                .map(row => row.tc_value)
                .filter(Boolean)
                .map(tc_value => tc_value.replace(/[\[\]{}"\\]/g, '').trim());

            if (tcValues.length > 0) {
                validTermsFound = true;
                termsHtml += `<li style="width: 600px;">${tcValues.join('</li><li>')}</li>`;
            }
        }
    }

    termsHtml += `</ul></div> <hr>`;

    if (validTermsFound) {
        html += termsHtml;
    }
}

if (quotation.quotation_type === 'Estimates' && quotation.show_header === 'true') {
    html += `
    </ul>
    <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
            <h3 class="textcolor">Bank Details</h3>
            <ul>
            <table class="bank" style="width:150%; border-collapse: collapse; border: none; page-break-inside: avoid; line-height: 1.25;">
                <tr>
                    <td style="padding: 3px;"><label>Accounts Name</label></td>
                    <td style="padding: 3px;">- ${company.company_name}</td>
                </tr>
                <tr>
                    <td style="padding: 3px;"><label>Account No</label></td>
                    <td style="padding: 3px;">- ${company.bank_ac_no}</td>
                </tr>
                <tr>
                    <td style="padding: 3px;"><label>Bank</label></td>
                    <td style="padding: 3px;">- ${company.bank_name}</td>
                </tr>
                <tr>
                    <td style="padding: 3px;"><label>Branch</label></td>
                    <td style="padding: 3px;">- ${company.bank_branch}</td>
                </tr>
                <tr>
                    <td style="padding: 3px;"><label>IFSC</label></td>
                    <td style="padding: 3px;">- ${company.ifsc_number}</td>
                </tr>
            </ul>
            </table>
        </div>
    `;
}

if (quotation.show_signature === 'true' && quotation.quotation_type === 'Estimates') {
    html += `
        <div style="text-align: right; margin-left: auto; margin-top: 100px;">
            <p style="font-weight: bold;">for ${company.company_name}</p><br>
            <p style="text-align: center; margin-top: 10px;">Authorised Signatory</p>
        </div>
    </div> <!-- Closing the flex container -->
    `;
} else if (quotation.show_signature === 'false' && quotation.quotation_type === 'Estimates') {
    html += `
        <div style="text-align: right; font-weight: bold; margin-left: auto; margin-top: 170px;">
            <p>This is a computer generated ${quotation.quotation_type} no signature required</p>
        </div>
        <hr>
    </div> <!-- Closing the flex container -->
   `;
}


html += `
</div>
</body>
</html>
`;



        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        await page.setContent(html);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '10mm',
                bottom: '12mm',
            },
        });

        fs.writeFileSync('test.pdf', pdfBuffer);

        if (bp === 'y') {
            response.setHeader('Content-Type', 'application/pdf');
            response.setHeader('Content-Disposition', `inline; filename="${quotation.document_no}.pdf"`);
        } else {
            response.setHeader('Content-Type', 'application/pdf')
            response.setHeader('Content-Disposition', `attachment; filename="${quotation.document_no}.pdf"`);
        }
        response.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        response.status(500).send('Error generating PDF');
    }

};

//modules...
module.exports = {
    createUser,
    getData,
    login,
    getCustomer,
    getSalesPerson,
    getQuotation,
    getQuotationpdf,
    getJobwork,
    getSalespersonQuotations,
    forgotPassword,
    getproduct
}