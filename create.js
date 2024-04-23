const pool = require('./db');

//createcompany...
const createCompany = async (request, response) => {
    const { company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number } = request.body;
    try {
        const companyCheckQuery = 'SELECT * FROM company WHERE company_name = $1';
        const companyCheckResult = await pool.query(companyCheckQuery, [company_name]);
        if (companyCheckResult.rows.length > 0) {
            return response.status(400).json({ error: 'Email already exists' });
        }
        await pool.query(`INSERT INTO company ( company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number)
                          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
                          [company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number]);
        response.status(201).json({ message: 'Company details created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//createjobwork...
const createJob = async (request, response) => {
    const { jobwork_name, jobwork_description } = request.body;
    if (!jobwork_name || !jobwork_description) {
        return response.status(400).json({ error: 'Missing required fields' });
    }
    try {
        await pool.query('INSERT INTO jobwork (jobwork_name, jobwork_description) VALUES ($1, $2)',
            [jobwork_name, jobwork_description]);
        response.status(201).json({ message: 'Jobwork created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

//create terms and condition...
const TermsConditions = async (request, response) => {
    const { terms_conditions_name, tc_value } = request.body;
    if (!terms_conditions_name || !tc_value) {
        return response.status(400).json({ error: 'Missing required fields' });
    }
    try {
        await pool.query('INSERT INTO terms_condition (terms_conditions_name, tc_value) VALUES ($1, $2)',
            [terms_conditions_name, tc_value]);
        response.status(201).json({ message: 'TermsConditions created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//createunit...
const createUnit = async (request, response) => {
    const { unit_type, unit_text } = request.body;
    if (!unit_type || !unit_text) {
        return response.status(400).json({ error: 'Missing required fields' });
    }
    try {
        await pool.query('INSERT INTO unit (unit_type, unit_text) VALUES ($1, $2)',
            [unit_type, unit_text]);
        response.status(201).json({ message: 'unit created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//createproduct...
const createProduct = async (request, response) => {
    const { product_image, product_name, product_price, product_description, product_wholesale_price, j_id, u_id } = request.body;

    if (!product_name || !product_price || !product_description || !product_wholesale_price || !j_id || !u_id) {
        return response.status(400).json({ error: 'Missing required fields' });
    }
    try {
        await pool.query('INSERT INTO product (product_image, product_name, product_price, product_description, product_wholesale_price, j_id, u_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [product_image, product_name, product_price, product_description, product_wholesale_price, j_id, u_id]);
        response.status(201).json({ message: 'Product created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//createquotation...
const insertQuotation = async (request, response) => {
    const { quotationData, jobworkData } = request.body;
    try {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');

        const lastQuotationQuery = `SELECT MAX(SUBSTRING(document_no, 11)::int) AS last_document_no FROM quotation WHERE document_no LIKE 'ES${formattedDate}%'`;
        const lastQuotationResult = await pool.query(lastQuotationQuery);
        const lastDocumentNo = lastQuotationResult.rows[0].last_document_no || 0;

        const documentNo = `ES${formattedDate}${('000' + (lastDocumentNo + 1)).slice(-4)}`;

        const quotationQuery = `
        INSERT INTO quotation (customer_id, company_id, gst, rate, date, terms_conditions, document_no, Salesperson_id, Prepared_by, additional_text, additional_value, less_text, less_value, est_caption, totalamount, quotation_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING quotation_id`;
        const quotationValues = [
            quotationData.customer_id,
            quotationData.company_id,
            quotationData.gst,
            quotationData.rate,
            quotationData.date,
            JSON.stringify(quotationData.terms_conditions),
            documentNo,
            quotationData.Salesperson_id,
            quotationData.Prepared_by,
            quotationData.additional_text,
            quotationData.additional_value,
            quotationData.less_text,
            quotationData.less_value,
            quotationData.est_caption,
            quotationData.totalamount,
            quotationData.quotation_type
        ];
        const quotationResult = await pool.query(quotationQuery, quotationValues);
        const quotationId = quotationResult.rows[0].quotation_id;


        for (const jobwork of jobworkData) {
            const { jobwork_name, jobwork_description, productData } = jobwork;
            const JobworQuery = `
            SELECT jobwork_id FROM jobwork WHERE jobwork_name = $1`;
            const JobworkValues = [jobwork_name];
            const jobworkIdResult = await pool.query(JobworQuery, JobworkValues);
            const jobworkNameId = jobworkIdResult.rows[0].jobwork_id;


            const jobworkQuery = `
                INSERT INTO quotation_jobwork (q_id, job_id, jobwork_name, jobwork_description)
                VALUES ($1, $2, $3, $4)
                RETURNING qj_id, job_id`;
            const jobworkValues = [
                quotationId,
                jobworkNameId,
                jobwork_name,
                jobwork_description
            ];
            const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
            const { qj_id, job_id: jobId } = jobworkResult.rows[0];

            for (const product of productData) {
                const productIdQuery = `
                    SELECT product_id FROM product WHERE product_name = $1`;
                const productIdValues = [product.product_name];
                const productIdResult = await pool.query(productIdQuery, productIdValues);

                let productId;
                if (productIdResult.rows.length > 0) {
                    productId = productIdResult.rows[0].product_id;
                } else {
                    productId = null;
                }

                let productPriceToStore = product.product_price || product.product_wholesale_price;

                const productQuery = `
                    INSERT INTO quotation_product (qj_id, prd_id, product_name, product_price, product_description, product_quantity, unit_type, amount)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING prd_id`;
                const productValues = [
                    qj_id,
                    productId,
                    product.product_name,
                    productPriceToStore,
                    product.product_description,
                    product.product_quantity,
                    product.unit_type,
                    product.amount
                ];
                const productResult = await pool.query(productQuery, productValues);
                const prdId = productResult.rows[0].prd_id;

                const jobworkProductQuery = `
                    INSERT INTO Jobwork_product (product_id, job_id)
                    VALUES ($1, $2)`;
                const jobworkProductValues = [
                    prdId,
                    jobId
                ];
                await pool.query(jobworkProductQuery, jobworkProductValues);
            }
        }
        response.status(201).json({ message: 'Data inserted successfully', documentNo });
    } catch (error) {
        response.status(500).json({ error: error.message });
        console.error("Error inserting data: " + error.message);
    }
}


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



//create modules...
module.exports = {
    createCompany,
    createJob,
    TermsConditions,
    createProduct,
    createUnit,
    insertQuotation,
    getJobwork
}