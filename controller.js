const bcrypt = require('bcrypt');
const pool = require('./db');
const PDFDocument = require('pdfkit');
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
          CREATE TABLE IF NOT EXISTS "users" ( user_id SERIAL PRIMARY KEY, first_name VARCHAR(250)  NULL,  last_name VARCHAR(250) NULL,  user_password VARCHAR(250),  email_id VARCHAR(250) NULL,
                                           phone_no BIGINT  NULL, alter_no VARCHAR(250) NOT NULL, website VARCHAR(250), address1 VARCHAR(250),  address2 VARCHAR(250), city VARCHAR(250),
                                           zip_code BIGINT,  bank_name VARCHAR(250), bank_branch VARCHAR(250), bank_ac_no VARCHAR(250), 
                                           ifsc_number VARCHAR(250), customer_gst_number VARCHAR(250), user_role VARCHAR(250) NOT NULL)`;
            await pool.query(createtableQuery);

        } if (!tableExistsResult.rows[0].exists) {
            const companyTableQuery =
                `CREATE TABLE IF NOT EXISTS company (company_id SERIAL PRIMARY KEY, company_name VARCHAR(250)  NULL, company_email_id VARCHAR(250)  NULL, company_phone_no BIGINT  NULL, company_website VARCHAR(250)  NULL, 
           company_logo bytea, address1 VARCHAR(250),  address2 VARCHAR(250), city VARCHAR(250),  zip_code BIGINT,  bank_name VARCHAR(250), bank_branch VARCHAR(250), bank_ac_no VARCHAR(250), 
           ifsc_number VARCHAR(250),  company_gst_number VARCHAR(250))`;
            await pool.query(companyTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const jobworkTableQuery =
                ` CREATE TABLE IF NOT EXISTS jobwork ( jobwork_id SERIAL PRIMARY KEY, jobwork_name VARCHAR(250) NULL, jobwork_description VARCHAR(250) NULL)`;
            await pool.query(jobworkTableQuery);
            if (!tableExistsResult.rows[0].exists) {
                const unitTableQuery =
                    ` CREATE TABLE IF NOT EXISTS unit ( unit_id SERIAL PRIMARY KEY, unit_type VARCHAR(250)  NULL , unit_text VARCHAR(250))`;
                await pool.query(unitTableQuery);
            }
        } if (!tableExistsResult.rows[0].exists) {
            const productTableQuery =
                ` CREATE TABLE IF NOT EXISTS product ( product_id SERIAL PRIMARY KEY, product_image bytea, product_name VARCHAR(250) NULL, product_price VARCHAR(250)  NULL, product_description VARCHAR(250)  NULL, 
                                                      product_wholesale_price VARCHAR(250), j_id INT REFERENCES jobwork(jobwork_id), u_id INT REFERENCES unit(unit_id))`;
            await pool.query(productTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const termsTableQuery =
                ` CREATE TABLE IF NOT EXISTS  terms_condition ( tc_id SERIAL PRIMARY KEY, terms_conditions_name  VARCHAR(300)  NULL, tc_value VARCHAR(1000) )`;
            await pool.query(termsTableQuery);

        } if (!tableExistsResult.rows[0].exists) {
            const qoutationTableQuery =
                `CREATE TABLE IF NOT EXISTS quotation (
                quotation_id SERIAL PRIMARY KEY,
                quotation_type VARCHAR(250),
                customer_id INT, company_id INT,
                est_caption VARCHAR(250),
                gst VARCHAR(250), rate VARCHAR(250), date DATE,  
                terms_conditions VARCHAR(250), document_no VARCHAR(250), salesperson_id INT, 
                Prepared_by INT, additional_text VARCHAR(250),  additional_value VARCHAR(250), less_text VARCHAR(250), less_value VARCHAR(250), totalamount VARCHAR(250))`;
            await pool.query(qoutationTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const QJTableQuery =
                ` CREATE TABLE IF NOT EXISTS  quotation_jobwork  ( qj_id SERIAL PRIMARY KEY,  q_id INT REFERENCES quotation(quotation_id), job_id INT, jobwork_name VARCHAR(250), jobwork_description VARCHAR(250)  NULL )`;
            await pool.query(QJTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const QPTableQuery =
                ` CREATE TABLE IF NOT EXISTS  quotation_product ( qp_id SERIAL PRIMARY KEY, qj_id INT REFERENCES quotation_jobwork(qj_id), prd_id INT, product_name VARCHAR(250), product_price VARCHAR(250), product_description VARCHAR(250)  NULL, product_quantity VARCHAR(250), unit_type VARCHAR(250), amount VARCHAR(250))`;
            await pool.query(QPTableQuery);
        }
        if (!tableExistsResult.rows[0].exists) {
            const JPTableQuery =
                ` CREATE TABLE IF NOT EXISTS   Jobwork_product ( jp_id SERIAL PRIMARY KEY, product_id INT, job_id INT REFERENCES jobwork(jobwork_id))`;
            await pool.query(JPTableQuery);
        }

        const hashedPassword = await bcrypt.hash(user_password, 10);
        const userCheckQuery = 'SELECT * FROM "users" WHERE email_id = $1';
        const userCheckResult = await pool.query(userCheckQuery, [email_id]);
        if (userCheckResult.rows.length > 0) {
            return response.status(400).json({ error: 'Email already exists' });
        }
        await pool.query('INSERT INTO "users" (first_name, last_name, user_password, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)',
            [first_name, last_name, hashedPassword, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number]);
        response.status(201).json({ message: 'User created successfully', password: user_password });

    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

//login...
const login = async (request, response) => {
    const { email_id, password } = request.body;
    try {
        const userResult = await pool.query('SELECT * FROM "users" WHERE email_id = $1', [email_id]);

        if (userResult.rows.length > 0) {
            const storedPassword = userResult.rows[0].user_password;
            const passwordMatch = await bcrypt.compare(password, storedPassword);

            if (passwordMatch) {
                const userRole = userResult.rows[0].user_role;

                if (userRole === 'admin' || userRole === 'salesperson' || userRole === 'staff') {
                    const [companyResult, jobworkResult, termsResult, productResult, unitResult, quotationResult] = await Promise.all([
                        pool.query('SELECT * FROM company'),
                        pool.query('SELECT * FROM jobwork'),
                        pool.query('SELECT * FROM terms_condition'),
                        pool.query('SELECT * FROM product'),
                        pool.query('SELECT * FROM unit'),
                        pool.query('SELECT * FROM quotation'),
                    ]);
                    const responseData = {
                        user: userResult.rows,
                        company: companyResult.rows,
                        jobwork: jobworkResult.rows,
                        terms_condition: termsResult.rows,
                        product: productResult.rows,
                        unit: unitResult.rows,
                        quotation: quotationResult.rows
                    };
                    response.json({ success: true, message: 'Login successful', data: responseData });
                    console.log({ success: true, message: 'Login successful', data: responseData });
                } else {
                    response.status(401).json({ success: false, message: 'Invalid user role' });
                }
            } else {
                response.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            response.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error executing query:', error);
        response.status(500).json({ success: false, message: 'Internal server error' });
    }
};


//getdata...
const getData = async (request, response) => {
    const TableName = request.params.TableName;
    const { page = 1, limit } = request.query;
    try {
        if (limit) {
            const offset = (page - 1) * limit;
            const { rows } = await pool.query(`SELECT * FROM ${TableName} LIMIT $1 OFFSET $2`, [limit, offset]);

            if (rows.length > 0) {
                const data = rows.map(row => {
                    if (row.product_image) {
                        const base64 = row.product_image;
                        const src = "" + base64;
                        row.editImage = src;
                    }
                    if (row.company_logo) {
                        const base64 = row.company_logo;
                        const src = "" + base64;
                        row.editImage = src;
                    }
                    return row;
                });
                response.status(200).json({ TableName: data });
                console.log(request.query)
            } else {
                response.status(404).json({ error: 'No data found' });
            }
        } else {
            const { rows } = await pool.query(`SELECT * FROM ${TableName}`);

            if (rows.length > 0) {
                const data = rows.map(row => {
                    if (row.product_image) {
                        const base64 = row.product_image;
                        const src = "" + base64;
                        row.editImage = src;
                    }
                    if (row.company_logo) {
                        const base64 = row.company_logo;
                        const src = "" + base64;
                        row.editImage = src;
                    }
                    return row;
                });
                response.status(200).json({ TableName: data });
            } else {
                response.status(404).json({ error: 'No data found' });
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        response.status(500).json({ error: 'Failed to get data' });
    }
};

const getDatas = async (request, response) => {
    try {
        const TableName = request.params.TableName;
        const { filterColumn1, filterValue1, sort, page = 1, limit } = request.query;

        let query = `SELECT * FROM ${TableName}`;
        let queryParams = [];
        let filterConditions = [];
        let paramCount = 1;

        if (filterColumn1 && filterValue1) {
            filterConditions.push(`${filterColumn1} LIKE $${paramCount}`);
            queryParams.push(`${filterValue1}%`);
            paramCount++;
        }

        if (filterConditions.length > 0) {
            query += ` WHERE ${filterConditions.join(' AND ')}`;
        }

        if (sort) {
            const sortParts = sort.split(':');
            if (sortParts.length === 2) {
                const [sortColumn, sortOrder] = sortParts;
                const sanitizedSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
                query += ` ORDER BY ${sortColumn} ${sanitizedSortOrder}`;
            } else {
                throw new Error('Invalid format for sort parameter');
            }
        }

        if (page > 0) {
            if (limit) {
                const offset = (page - 1) * limit;
                query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
                queryParams.push(parseInt(limit), offset);
            }
        }

        const { rows } = await pool.query(query, queryParams);

        if (rows.length > 0) {
            const data = rows.map(row => {
                if (row.product_image) {
                    const base64 = row.product_image;
                    const src = "" + base64;
                    row.editImage = src;
                }
                if (row.company_logo) {
                    const base64 = row.company_logo;
                    const src = "" + base64;
                    row.editImage = src;
                }
                return row;
            });
            response.status(200).json({ [TableName]: data });
        } else {
            response.status(404).json({ error: 'No data found' });
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
    const { quotationId } = request.params;

    try {
        const quotationQuery = `
            SELECT * FROM quotation WHERE quotation_id = $1`;
        const quotationValues = [quotationId];
        const quotationResult = await pool.query(quotationQuery, quotationValues);
        const quotation = quotationResult.rows[0];

        const jobworkQuery = `
            SELECT * FROM quotation_jobwork WHERE q_id = $1`;
        const jobworkValues = [quotationId];
        const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
        const jobworks = jobworkResult.rows;

        for (const jobwork of jobworks) {
            const productIdQuery = `
                SELECT * FROM quotation_product WHERE qj_id = $1`;
            const productIdValues = [jobwork.qj_id];
            const productIdResult = await pool.query(productIdQuery, productIdValues);
            const productIds = productIdResult.rows;
            jobwork.productIds = productIds;
        }

        response.status(200).json({ quotation, jobworks });
    } catch (error) {
        response.status(500).json({ error: error.message });
        throw new Error("Error fetching quotation data: " + error.message);
    }
}

//get quotation PDF...
const pdf = require('html-pdf');

const getQuotationpdf = async (request, response) => {
    const { quotationId, showImageAndAddress } = request.params;
    try {
        if (showImageAndAddress !== 'yes' && showImageAndAddress !== 'no') {
            throw new Error('Invalid value for showImageAndAddress parameter. Only "yes" or "no" are allowed.');
        }

        const quotationQuery = `SELECT * FROM quotation WHERE quotation_id = $1`;
        const quotationValues = [quotationId];
        const quotationResult = await pool.query(quotationQuery, quotationValues);
        const quotation = quotationResult.rows[0];

        const customerQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1`;
        const customerValues = [quotation.customer_id];
        const customerResult = await pool.query(customerQuery, customerValues);
        const customer = customerResult.rows[0];

        const salesQuery = `SELECT first_name, last_name FROM users WHERE user_id = $1`;
        const salesValues = [quotation.salesperson_id];
        const salesResult = await pool.query(salesQuery, salesValues);
        const sales = salesResult.rows[0];

        const companyQuery = `SELECT company_name FROM company WHERE company_id = $1`;
        const companyValues = [quotation.company_id];
        const companyResult = await pool.query(companyQuery, companyValues);
        const company = companyResult.rows[0];

        const quotationDate = new Date(quotation.date);
        const formattedQuotationDate = `${quotationDate.getDate()}-${quotationDate.getMonth() + 1}-${quotationDate.getFullYear()}`;

        const jobworkQuery = `SELECT * FROM quotation_jobwork WHERE q_id = $1`;
        const jobworkValues = [quotationId];
        const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
        const jobworks = jobworkResult.rows;

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Quotation Details</title>
        <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        <style>
        body {
            width: 210mm; 
            height: 297mm; 
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif; 
            text-transform: capitalize;
            margin-down: 150px;
         }
         
    
        .container {
          display: flex;
          align-items: center;
          margin-down: 100px;
        }
        .quo {
            text-align: center;
            padding-right: 300px;
            background-color:#7364FF;
            color:#F5F5FA;
            font-weight: bold;
        }
        .customer-name {
            font-size: 18px;
            padding-left: 5px; 
            margin-top: 15px; 
        }
        .date {
            padding-left: 480px;
        }
        .date label {
            width: 80px; 
            font-weight: bold;
        }
        .customer-name label {
            width: 90px; 
            font-weight: bold;
        }
        .table {
            width: 71%;
        }
        .table th,
        .table td{
            padding: 5px;
            border: none;
        }
        .est-caption {
            text-align: center;
            padding: 4px; 
            background-color:#7364FF;
            padding-right: 300px;
            color:#F5F5FA;
        }
        
        .amount { 
            padding-left: 450px;   
        }
        hr {
            border: none; 
            border-top: 1px solid #ccc; 
            margin: 10px 0; 
        }
        .total-amount {
            color: #000000;
            font-weight: bold;
        }
        .image img {
            height: 100px; 
        }
        .demo {
            display: flex;
            width: 100%;
        }
        .image {
            margin-right: 40px; /* Adjust the margin between image and address */
        }
        .address {
            text-align: right;
            padding-right:280px;
        }
        .containers{
            padding-left:20px;
        }
        .tablehead{
            background-color:#B0C4DE;
        }
        .page-break {
            page-break-before: always; /* Creates a new page break */
        }
        
    
    </style>
    </head>
    <body>`
        if (showImageAndAddress === 'yes') {
            html += `
    <div class="demo">
        <div class="image">
            <img src="https://i.ibb.co/5MnZ8FC/IMG-20240312-WA0000.jpg" alt="image logo">
        </div>
        <div class="address">
            <p>No.5, Vjay Garden,Woraiyur,Kuzlumani Road,<br>
            Near Lingam Nagar,Trichy-620003,<br>
            Ph.no 0431-2761190,9865194799.</p>
        </div>
    </div>`;
        }
        html += `
<div class= "container">
    <div>
    <hr border-primary>
        <h1 class="quo">${quotation.quotation_type}</h1>
    <div class="date">
    <p><label>Date</label>: ${formattedQuotationDate}</p>
    <p><label>Doc</label>: ${quotation.document_no}</p>
    <p><label>Sel.Rep</label>: ${sales.first_name} ${sales.last_name}</p>
</div>
<div class="customer-name">
    <p><label>Name</label>: ${customer.first_name} ${customer.last_name}</p>
    <p><label>Company</label>: ${company.company_name}</p>
</div>`

        html += `
        <hr>
${quotation.est_caption ? `<div class="est-caption"><h2 style="font-weight: bold;">${quotation.est_caption}</h2></div>` : ''}
`;

        for (const jobwork of jobworks) {
            html += `
                <div class="containers"> 
                <hr>
                <h3 style="color: #7364FF; font-weight: bold;">${jobwork.jobwork_name} - ${jobwork.jobwork_description}</h3>
                <table class="table">
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

            const productQuery = `SELECT * FROM quotation_product WHERE qj_id = $1`;
            const productValues = [jobwork.qj_id];
            const productResult = await pool.query(productQuery, productValues);
            const products = productResult.rows;

            for (const product of products) {
                // const unitQuery = `SELECT unit_type FROM unit WHERE unit_id = $1`;
                // const unitValues = [product.unit_type];
                // const unitResult = await pool.query(unitQuery, unitValues);
                // const unit = unitResult.rows[0];

                html += `
                <tr>
                    <td style="text-align: left;">${product.product_name}</td>
                    <td >${product.product_price || product.product_wholesale_price} </td>
                    <td>${product.unit_type}</td>
                    <td>${product.product_quantity}</td>
                    <td>${product.amount}</td>
                </tr>
            `;
            }

            html += `
                    </tbody>
                </table>
                </div>
            `;
        }
        const termsConditionsArray = quotation.terms_conditions.split(',').filter(Boolean).map(term => term.trim().replace(/[\[\]"]/g, ''));
        html += `
    <div>
    <hr>
        <h3  style="color: #7364FF; font-weight: bold;">Terms and Conditions</h3>
        <ul>
            ${termsConditionsArray.map(term => `<li>${term}</li>`).join('')}
        </ul>
    </div>
`;

        html += `
        <hr>
        <div class="amount page-break">
        <h3 style="color: #7364FF; padding-left:8px; font-weight: bold;">Amount Details</h3>
        <table class="table" style="width: 60%; border-collapse: collapse; border: none">
            ${quotation.gst ? `
            <hr>
                <tr>
                    <td>GST</td>
                    <td>${quotation.gst}%</td>
                </tr>
            ` : ''}
            ${quotation.additional_value ? `
                <tr>
                    <td>${quotation.additional_text}</td>
                    <td>${quotation.additional_value}</td>
                </tr>
            ` : ''}
            ${quotation.less_value ? `
                <tr>
                    <td>${quotation.less_text}</td>
                    <td>${quotation.less_value}%</td>
                </tr>
            ` : ''}
            ${quotation.totalamount ? `
                <tr class="total-amount">
                    <td>Total Amount</td>
                    <td>${quotation.totalamount}</td>
                </tr>
            ` : ''}
        </table>
        <hr>
    </div>

`;
        html += `
                </div>
            </body>
            </html>
        `;

        const options = {
            format: 'A4',
            orientation: 'portrait',
            border: '10mm',
            header: {
                height: '5mm'
            },
            footer: {
                height: '20mm'
            }
        };

        pdf.create(html, options).toStream((err, stream) => {
            if (err) {
                console.error("Error generating PDF: " + err.message);
                response.status(500).json({ error: "Error generating PDF: " + err.message });
            } else {
                response.setHeader('Content-Type', 'application/pdf');
                stream.pipe(response);
            }
        });
    } catch (error) {
        console.error("Error fetching quotation data: " + error.message);
        response.status(500).json({ error: "Qauotation not found" });
    }
}


//modules...
module.exports = {
    createUser,
    getData,
    login,
    getCustomer,
    getSalesPerson,
    getQuotation,
    getQuotationpdf,
    getDatas
}


