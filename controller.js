const bcrypt = require('bcrypt');
const pool = require('./db');
const fs = require('fs');

//create user...
const createUser = async (request, response) => {
    const { first_name, last_name, user_password, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number } = request.body;

    try {
        const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name IN ('user', 'company', 'jobwork', 'product', 'unit', 'terms_conditions','quotation', 'quotation_jobwork', 'quotation_product', 'Jobwork_product')
        )`;

        const tableExistsResult = await pool.query(checkTableQuery);
        const validRoles = ['admin', 'salesperson', 'customer', 'staff'];
        if (!validRoles.includes(user_role)) {
            return response.status(400).json({ error: 'Invalid user role provided' });
        }

        if (!tableExistsResult.rows[0].exists) {
            const createtableQuery = `
          CREATE TABLE IF NOT EXISTS "users" ( user_id SERIAL PRIMARY KEY, first_name VARCHAR(250)  NOT NULL,  last_name VARCHAR(250) NOT NULL,  user_password VARCHAR(250),  email_id VARCHAR(250) NOT NULL,
                                           phone_no BIGINT  NOT NULL, alter_no VARCHAR(250), website VARCHAR(250), address1 VARCHAR(250),  address2 VARCHAR(250), city VARCHAR(250),
                                           zip_code BIGINT,  bank_name VARCHAR(250), bank_branch VARCHAR(250), bank_ac_no VARCHAR(250), 
                                           ifsc_number VARCHAR(250), customer_gst_number VARCHAR(250), user_role VARCHAR(250) NOT NULL)`;
            await pool.query(createtableQuery);

        } if (!tableExistsResult.rows[0].exists) {
            const companyTableQuery =
                `CREATE TABLE IF NOT EXISTS company (company_id SERIAL PRIMARY KEY, company_name VARCHAR(250)  NOT NULL, company_email_id VARCHAR(250)  NOT NULL, company_phone_no BIGINT  NOT NULL, company_website VARCHAR(250)  , 
           company_logo bytea, address1 VARCHAR(250),  address2 VARCHAR(250), city VARCHAR(250),  zip_code BIGINT,  bank_name VARCHAR(250), bank_branch VARCHAR(250), bank_ac_no VARCHAR(250), 
           ifsc_number VARCHAR(250),  company_gst_number VARCHAR(250))`;
            await pool.query(companyTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const jobworkTableQuery =
                ` CREATE TABLE IF NOT EXISTS jobwork ( jobwork_id SERIAL PRIMARY KEY, jobwork_name VARCHAR(250) NOT NULL, jobwork_description VARCHAR(250))`;
            await pool.query(jobworkTableQuery);
            if (!tableExistsResult.rows[0].exists) {
                const unitTableQuery =
                    ` CREATE TABLE IF NOT EXISTS unit ( unit_id SERIAL PRIMARY KEY, unit_type VARCHAR(250) NOT NULL , unit_text VARCHAR(250) NOT NULL)`;
                await pool.query(unitTableQuery);
            }
        } if (!tableExistsResult.rows[0].exists) {
            const productTableQuery =
                ` CREATE TABLE IF NOT EXISTS product ( product_id SERIAL PRIMARY KEY, product_image bytea, product_name VARCHAR(250) NOT NULL, product_price VARCHAR(250)  NOT NULL, product_description VARCHAR(250), 
                                                      product_wholesale_price VARCHAR(250) NOT NULL, j_id INT REFERENCES jobwork(jobwork_id), u_id INT REFERENCES unit(unit_id))`;
            await pool.query(productTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const termsTableQuery =
                ` CREATE TABLE IF NOT EXISTS  terms_condition ( tc_id SERIAL PRIMARY KEY, terms_conditions_name  VARCHAR(300)  NOT NULL, tc_value VARCHAR(1000) NOT NULL )`;
            await pool.query(termsTableQuery);

        } if (!tableExistsResult.rows[0].exists) {
            const qoutationTableQuery =
                `CREATE TABLE IF NOT EXISTS quotation (
                quotation_id SERIAL PRIMARY KEY,
                quotation_type VARCHAR(250) NOT NULL,
                customer_id INT NOT NULL, company_id INT NOT NULL,
                est_caption VARCHAR(250) NOT NULL,
                gst VARCHAR(250), rate VARCHAR(250), date DATE,  
                terms_conditions VARCHAR(250), document_no VARCHAR(250), salesperson_id INT NOT NULL, 
                prepared_by INT, additional_text VARCHAR(250),  additional_value VARCHAR(250), less_text VARCHAR(250), less_value VARCHAR(250), totalamount VARCHAR(250), gst_amount VARCHAR(250), less_amount VARCHAR(250), lessvalue_amount VARCHAR(250), amount_wo_gst VARCHAR(250), show_header VARCHAR(250))`;
            await pool.query(qoutationTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const QJTableQuery =
                ` CREATE TABLE IF NOT EXISTS  quotation_jobwork  ( qj_id SERIAL PRIMARY KEY,  q_id INT REFERENCES quotation(quotation_id), job_id INT, jobwork_name VARCHAR(250), jobwork_description VARCHAR(250)  NULL )`;
            await pool.query(QJTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const QPTableQuery =
                ` CREATE TABLE IF NOT EXISTS  quotation_product ( qp_id SERIAL PRIMARY KEY, qj_id INT REFERENCES quotation_jobwork(qj_id), prd_id INT, product_name VARCHAR(250), product_price VARCHAR(250), product_description VARCHAR(250)  NULL, product_quantity VARCHAR(250), unit_type VARCHAR(250), amount VARCHAR(250), other_productname VARCHAR(250))`;
            await pool.query(QPTableQuery);
        }
        if (!tableExistsResult.rows[0].exists) {
            const JPTableQuery =
                ` CREATE TABLE IF NOT EXISTS   Jobwork_product ( jp_id SERIAL PRIMARY KEY, product_id INT, job_id INT REFERENCES jobwork(jobwork_id))`;
            await pool.query(JPTableQuery);
        }

        const userCheckQuery = 'SELECT * FROM "users" WHERE email_id = $1';
        const userCheckResult = await pool.query(userCheckQuery, [email_id]);
        if (userCheckResult.rows.length > 0) {
            return response.status(400).json({ error: 'Email already exists' });
        }

        let hashedPassword = null;
        if (user_password) {
            hashedPassword = await bcrypt.hash(user_password, 10);
        }
        const insertUserQuery = `
            INSERT INTO "users" (first_name, last_name, user_password, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`;
        const userValues = [first_name, last_name, hashedPassword, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number];
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
                } else if (userRole === 'salesperson') {
                    const responseData = ['user', 'quotation'];
                    res.json({ success: true, message: 'Login successful', data: responseData, user_id: userId, userRole, initial });
                } else if (userRole === 'staff') {
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
            }
        });
        
        const mailOptions = {
            from:'admin@gsmetalcraft.in',
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
                res.status(500).json({ success: false, message: error });
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
        const query = `SELECT * FROM ${TableName} ORDER BY ${orderBy} ${orderDirection}`;
        const { rows } = await pool.query(query);
  
        if (rows.length > 0) {
            const data = rows.map(row => {
                if (row.tc_value) {
                    const term = row.tc_value;
                    const tc_value = term.replace(/[\[\]{}"\\]/g, ' ').trim();
                    row.tc_value = tc_value;
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
            return response.status(200).json({ error: 'No data found' });
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

//getquotation...
const getQuotation = async (request, response) => {
    const orderBy = request.query.orderBy || 'quotation';
    const orderDirection = request.query.orderDirection || 'DESC';
    try {
        const quotationQuery = `
        SELECT * FROM quotation ORDER BY ${orderBy} ${orderDirection}`;
        const quotationResult = await pool.query(quotationQuery);
        const quotations = quotationResult.rows;

        for (const quotation of quotations) {
            const customerQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1`;
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

            const companyQuery = `
            SELECT company_name FROM company WHERE company_id = $1`;
            const companyValues = [quotation.company_id];
            const companyResult = await pool.query(companyQuery, companyValues);
            const company = companyResult.rows[0];

            quotation.customer_name = customer ? `${customer.first_name} ${customer.last_name}` : '';
            quotation.salesperson_name = sales ? `${sales.first_name} ${sales.last_name}` : '';
            quotation.preparedby_name = prepared ? `${prepared.first_name} ${prepared.last_name}` : '';
            quotation.company_name = company ? company.company_name : 'Unknown Company';
           
            const date = new Date(quotation.date);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            quotation.quotation_date = formattedDate;
            
    

            const jobworkQuery = `
            SELECT * FROM quotation_jobwork WHERE q_id = $1`;
            const jobworkValues = [quotation.quotation_id];
            const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
            const jobworks = jobworkResult.rows;

            for (const jobwork of jobworks) {
                const productQuery = `
                SELECT * FROM quotation_product WHERE qj_id = $1`;
                const productValues = [jobwork.qj_id];
                const productResult = await pool.query(productQuery, productValues);

                jobwork.productData = productResult.rows;
            }
            quotation.jobworkData = jobworks;
        }
        response.status(200).json({ quotations });
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' });
        console.error('Error fetching quotations:', error);
    }
};


//get salesperson quotation...
const getSalespersonQuotations = async (request, response) => {
    const { salespersonId } = request.params;
    try {
        const quotationQuery = `
        SELECT * FROM quotation WHERE salesperson_id = $1`;
        const quotationResult = await pool.query(quotationQuery,[salespersonId]);

        if (quotationResult.rowCount === 0) {
            return response.status(200).json({ error: 'No quotations found' });
        }
        const quotations = quotationResult.rows;

        for (const quotation of quotations) {
                 const customerQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1`;
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

            const companyQuery = `
            SELECT company_name FROM company WHERE company_id = $1`;
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
            
            const jobworkQuery = `
          SELECT * FROM quotation_jobwork WHERE q_id = $1`;
            const jobworkValues = [quotation.quotation_id];
            const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
            const jobworks = jobworkResult.rows;

            for (const jobwork of jobworks) {
                const productQuery = `
            SELECT * FROM quotation_product WHERE qj_id = $1`;
                const productValues = [jobwork.qj_id];
                const productResult = await pool.query(productQuery, productValues);

                jobwork.productData = productResult.rows;
            }
            quotation.jobworkData = jobworks;
        }
        response.status(200).json({ quotations});
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' });
        console.error('Error fetching quotations:', error);
    }
};

//get jobwork...
const getJobwork = async (request, response) => {
    try {
        const { jobworkName } = request.params;

        const query = `
          SELECT j.jobwork_id, j.jobwork_name,
                 p.product_id, p.product_name, p.product_price, p.product_description, p.product_wholesale_price,
                 u.unit_id, u.unit_type
          FROM jobwork j
          LEFT JOIN product p ON j.jobwork_id = p.j_id
          LEFT JOIN unit u ON p.u_id = u.unit_id
          WHERE j.jobwork_name = $1
        `;
        const { rows } = await pool.query(query, [jobworkName]);

        const result = rows.reduce((acc, row) => {
            const { jobwork_id, jobwork_name, unit_id, unit_type, ...productData } = row;
            if (!acc[jobwork_id]) {
                acc[jobwork_id] = {
                    jobwork_id,
                    jobwork_name,
                    products: [],
                };
            }
            if (productData.product_id) {
                productData.unit = { unit_id, unit_type };
                delete productData.unit_id;
                delete productData.unit_type;
                acc[jobwork_id].products.push(productData);
            }
            return acc;
        }, {});
        response.status(200).json(Object.values(result));
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}


//quotation pdf...
const puppeteer = require('puppeteer');
const { decrypt } = require('dotenv');

const getQuotationpdf = async (request, response) => {
    let { quotationId} = request.params;

    try {
        const quotationQuery = `SELECT * FROM quotation WHERE quotation_id = $1`;
        const quotationResult = await pool.query(quotationQuery, [quotationId]);

        if (quotationResult.rows.length === 0) {
            return response.status(404).json({ error: 'Quotation not found' });
        }

        const quotation = quotationResult.rows[0];

        const customerQuery = `SELECT first_name, last_name, city FROM users WHERE user_id = $1`;
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
        SELECT company_name, company_logo, address1, company_phone_no FROM company WHERE company_id = $1 `;
        const companyValues = [quotation.company_id];
        const companyResult = await pool.query(companyQuery, companyValues);
        const company = companyResult.rows[0];

        const quotationDate = new Date(quotation.date);
        const formattedQuotationDate = `${quotationDate.getDate()}-${quotationDate.getMonth() + 1}-${quotationDate.getFullYear()}`;

        const jobworkQuery = `SELECT * FROM quotation_jobwork WHERE q_id = $1`;
        const jobworkValues = [quotationId];
        const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
        const jobworks = jobworkResult.rows;

        const bootstrapCSS = `<link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">`;

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${quotation.quotation_type}</title>
            ${bootstrapCSS}
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-transform: capitalize;
                    margin: 0;
                    font-size: 20px;
                    page-break-before: always;
                }
                .quotation-header {
                    text-align: center;
                }
                .est-caption {
                    text-align: center;
                    color: #6495ED;
                }
                .details {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-top: 30px;
                  
                }
                .customer-info {
                    font-size: 20px;
                    line-height: 1.5;
                    background-color: #EEEEF5;
                    width: 470px;
                    border: 1px solid #CCCCCC;
                    border-radius: 10px;
                }
                .right-info {
                    font-size: 20px;
                    line-height: 1.5;
                    background-color: #EEEEF5;
                    width: 470px;
                    border: 1px solid #CCCCCC;
                    border-radius: 10px;
                }
                .company-address {
                    text-align: right;
                    line-height: 1.5;
                }
                .amount {
                    padding-left: 370px;   
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
                .right-info label { 
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
                    color:#6495ED
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
            </style>
        </head>
        <body>
            <div class="container">
                ${quotation.show_header === 'true'? `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 20px;">
                    <div>
                        <img src="${company.company_logo}" alt="Company Logo" class="company-logo"> 
                    </div>
                    <div class="company-address">
                    <p> Company- ${company.company_name},<br>
                        ${company.address1},<br>
                        <i class="fa-solid fa-phone-volume">Ph.no - ${company.company_phone_no}</i></p>
                    </div>
                </div>
                ` : ''}
                <hr>
            <div style="height: 10px;"></div>
            <div class="quotation-header"><h2  class="textcolor">${quotation.quotation_type}</h2></div>
        <div class="details">
        <div class="customer-info pl-4 pt-4 pb-4">
            <h3 class = "pb-4  textcolor">Customer Info</h3>
            <p> ${customer.first_name} ${customer.last_name}<br>
           ${customer.city}</p>
        </div>
        <div class="right-info pl-4 pt-4 ">
            <p><label>Date:</label> ${formattedQuotationDate}<br>
             <label>Document No:</label> ${quotation.document_no}<br>
             <label>Salesperson:</label> ${sales.first_name} ${sales.last_name}<br>
             <label>Prepared By:</label> ${Prepared.first_name} ${Prepared.last_name}</p>
        </div>
    </div>
    `

        html += `
            <hr class="hr">
            ${quotation.est_caption ? `
                <div class="est-caption">
                    <h2>${quotation.est_caption}</h2>
                </div>
            ` : ''}
            `;

        html += `
            <div>
              <table id="customers">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
      `;

        for (const jobwork of jobworks) {
            const jobworkHeading = jobwork.jobwork_description
                ? `${jobwork.jobwork_name} - ${jobwork.jobwork_description}`
                : jobwork.jobwork_name;

            html += `
                <tr>
                  <td colspan="10" style="font-weight: bold; color:#6495ED ">${jobworkHeading}</td>
                </tr>
        `;

            const productQuery = `SELECT * FROM quotation_product WHERE qj_id = $1`;
            const productValues = [jobwork.qj_id];
            const productResult = await pool.query(productQuery, productValues);
            const products = productResult.rows;

            for (const product of products) {
                const productName = product.product_name && product.product_name.toLowerCase().includes("others")
                    ? product.other_productname
                    : product.product_name;

                html += `
                  <tr>
                    <td>${productName}</td>
                    <td>₹${product.product_price || product.product_wholesale_price}</td>
                    <td>${product.unit_type}</td>
                    <td>${product.product_quantity}</td>
                    <td>₹${product.amount}</td>
                  </tr>
                `;
            }
        }

        html += `
                </tbody>
              </table>
            </div>
      `;

        html += `
<hr style="border-top: 1px solid #000;">
<div style="display: flex; justify-content: space-between;width: 90%; color: #111C43; font-weight: bold;">
    <p style="font-size:25px; padding-left: 450px;">Sub Total</p> 
    <p style="font-size:24px;">₹${quotation.amount_wo_gst}</p>
</div>
<hr style="border-top: 1px solid #000; margin-top: 0px;">

    <div class="amount">
    <table class="table" style="width: 85%; border-collapse: collapse; border: none;">
    ${quotation.amount_wo_gst ?`
    <tr>
    <td>Gross</td>
            <td style="text-align: right;">₹${quotation.amount_wo_gst}</td>
</tr>
    `:''}
        ${quotation.gst ?`
        <tr>
        <td>GST</td>
        <td>
            <div style="display: flex; justify-content: space-between;">
                <span  style="padding-right: 200px"; >${quotation.gst}%</span>
                <span style="text-align: right;">₹${quotation.gst_amount}</span>
            </div>
        </td>
    </tr>
        ` : ''}
        ${quotation.additional_value ? `
            <tr>
                <td>${quotation.additional_text}</td>
                <td style="text-align: right;">₹${quotation.additional_value}</td>
            </tr>
        ` : ''}
        ${(quotation.less_value || quotation.less_amount) ? `
        <tr>
            <td>${quotation.less_text}</td>
            <td>
            <div style="display: flex; justify-content: space-between;">
                <span>${quotation.less_value ? `${quotation.less_value}%` : ''}</span>
                <span style="text-align: right;">−₹${quotation.lessvalue_amount || quotation.less_amount}</span>
            </div>
        </td>
        </tr>
        ` : ''}
        ${quotation.totalamount ? `
            <tr class="total-amount">
                <td>Total Amount</td>
                <td style="text-align: right;">₹${quotation.totalamount}</td>
            </tr>
        ` : ''}
    </table>
    <hr>
</div>
`;

    
if (quotation.terms_conditions && quotation.terms_conditions.trim() !== '[]') {
    html += `<hr><div><h3 class="textcolor">Terms and Conditions</h3><ul>`;

    const ids = quotation.terms_conditions
        .split(',')
        .filter(Boolean)
        .map(tc_id => tc_id.replace(/[\[\]{}"\\]/g, '').trim()); 

  
    for (const tc_id of ids) {
        const term = await pool.query(`SELECT tc_value FROM terms_condition WHERE tc_id = ${tc_id}`);
        if (term && term.rows.length > 0) {
            const tcValues = term.rows
            .map(row => row.tc_value)
            .filter(Boolean)
            .map(tc_value => tc_value.replace(/[\[\]{}"\\]/g, '').trim());
            html += `<li style="width: 600px;">${tcValues.join('</li><li>')}</li>`;
        }
    }
}

     
    html += `
    ${quotation.show_header === 'true'? `
    <div style="height: 30px;"></div>
      <div style="text-align: right; font-weight: bold;">
          <p>for ${company.company_name}</p>
      </div>    
    ` : ''} 
  `;

  html += `
  ${quotation.show_header === null || quotation.show_header === '' || quotation.show_header === 'false'?
    `
    <div style="height: 30px;"></div>
    <div style="text-align: right; font-weight: bold;">
      <p>This is a computer generated ${quotation.quotation_type} no signature required</p>
    </div>
    ` 
  : ''}`;
  


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
                top: '17mm',
                bottom: '10mm',
            },
        });

        fs.writeFileSync('test.pdf', pdfBuffer);

       response.setHeader('Content-Type', 'application/pdf');
        // response.setHeader('Content-Disposition', `attachment; filename="${quotation.document_no}.pdf"`);
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
    forgotPassword
}