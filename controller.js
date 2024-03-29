const bcrypt = require('bcrypt');
const pool = require('./db');


//create user...
const createUser = async (request, response) => {
    const {first_name, last_name, user_password, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number } = request.body;

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
        } if (!tableExistsResult.rows[0].exists) {
            const productTableQuery =
                ` CREATE TABLE IF NOT EXISTS product ( product_id SERIAL PRIMARY KEY, product_image bytea, product_name VARCHAR(250) NULL, product_price VARCHAR(250)  NULL, product_description VARCHAR(250)  NULL)`;
            await pool.query(productTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const unitTableQuery =
                ` CREATE TABLE IF NOT EXISTS unit ( unit_id SERIAL PRIMARY KEY, unit_type VARCHAR(250)  NULL , unit_text VARCHAR(250))`;
            await pool.query(unitTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const termsTableQuery =
                ` CREATE TABLE IF NOT EXISTS  terms_conditions ( tc_id SERIAL PRIMARY KEY, terms_conditions_name  VARCHAR(300)  NULL, tc_info json )`;
            await pool.query(termsTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const qoutationTableQuery =
                `CREATE TABLE IF NOT EXISTS quotation (
                quotation_id SERIAL PRIMARY KEY,
                customer_id INT REFERENCES "users"(user_id),
                company_id INT REFERENCES company (company_id),
                gst VARCHAR(250), rate VARCHAR(250), date DATE,  
                term_condition INT REFERENCES terms_conditions(tc_id), document_no VARCHAR(250), Salesperson_id INT REFERENCES "users"(user_id), 
                Prepared_by INT REFERENCES "users"(user_id),  additional_text VARCHAR(250),  additional_value VARCHAR(250), less_text VARCHAR(250), less_value VARCHAR(250), totalamount VARCHAR(250))`;
            await pool.query(qoutationTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const QJTableQuery =
                ` CREATE TABLE IF NOT EXISTS  quotation_jobwork  ( qj_id SERIAL PRIMARY KEY,  q_id INT REFERENCES quotation(quotation_id),job_id INT REFERENCES jobwork(jobwork_id), jobwork_name VARCHAR(250), jobwork_description VARCHAR(250)  NULL )`;
            await pool.query(QJTableQuery);
        } if (!tableExistsResult.rows[0].exists) {
            const QPTableQuery =
                ` CREATE TABLE IF NOT EXISTS  quotation_product ( qp_id SERIAL PRIMARY KEY, qj_id INT REFERENCES quotation_jobwork(qj_id), prd_id INT REFERENCES product(product_id), product_name VARCHAR(250), product_price VARCHAR(250), gst_amount VARCHAR(250), product_description VARCHAR(250)  NULL, product_quantity VARCHAR(250), unit_type INT REFERENCES unit(unit_id), total_amount VARCHAR(250))`;
            await pool.query(QPTableQuery);
        }
        if (!tableExistsResult.rows[0].exists) {
            const JPTableQuery =
                ` CREATE TABLE IF NOT EXISTS   Jobwork_product ( jp_id SERIAL PRIMARY KEY, product_id INT, job_id INT REFERENCES jobwork(jobwork_id))`;
            await pool.query(JPTableQuery);
        }

        const hashedPassword = await bcrypt.hash(user_password,10);
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
                        pool.query('SELECT * FROM terms_conditions'),
                        pool.query('SELECT * FROM product'),
                        pool.query('SELECT * FROM unit'),
                        pool.query('SELECT * FROM quotation'),
                    ]);
                    const responseData = {
                        user: userResult.rows,
                        company: companyResult.rows,
                        jobwork: jobworkResult.rows,
                        terms_conditions: termsResult.rows,
                        product: productResult.rows,
                        unit: unitResult.rows,
                        quotation: quotationResult.rows
                    };
                    response.json({ success: true, message: 'Login successful', data: responseData });
                    console.log({ success: true, message: 'Login successful', data: responseData });
                } else if (userRole === 'customer') {
                    const customerID = userResult.rows[0].user_id;
                    const quotationResult = await pool.query('SELECT * FROM quotation WHERE customer_id = $1', [customerID]);
                    const responseData = {
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
    try {
        const { rows } = await pool.query(`SELECT * FROM ${TableName}`);

        if (rows.length > 0) {
            const data = rows.map(row => {
                if (row.product_image) {
                    row.editImage = "" + row.product_image;
                }
                if (row.company_logo) {
                    row.editImage = "" + row.company_logo;
                }
                return row;
            });
            response.status(200).json({ TableName: data });
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

//modules...
module.exports = {
    createUser,
    getData,
    login,
    getCustomer,
    getSalesPerson,
}