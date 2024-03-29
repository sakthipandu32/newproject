const pool = require('./db');

//createcompany...
const createCompany = async (request, response) => {
    const { company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number } = request.body;
    try {
        await pool.query('INSERT INTO company ( company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
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
    const { terms_conditions_name, tc_info } = request.body;
    if (!terms_conditions_name || !tc_info) {
        return response.status(400).json({ error: 'Missing required fields' });
    }
    try {
        await pool.query('INSERT INTO terms_conditions (terms_conditions_name, tc_info) VALUES ($1, $2)',
            [terms_conditions_name, tc_info]);
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
    const { product_image, product_name, product_price, product_description } = request.body;

    if (!product_name || !product_price || !product_description) {
        return response.status(400).json({ error: 'Missing required fields' });
    }
    try {
        await pool.query('INSERT INTO product (product_image, product_name, product_price, product_description) VALUES ($1, $2, $3, $4)',
            [product_image, product_name, product_price, product_description]);
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
        const gstRate = parseInt(quotationData.gst); 

        const documentNo = 'ES' + Date.now();
        const preparedBy = quotationData.customer_id;

        const quotationQuery = `
            INSERT INTO quotation (customer_id, company_id, gst, rate, date, term_condition, document_no, Salesperson_id, Prepared_by, additional_text, additional_value, less_text, less_value)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING quotation_id`;
        const quotationValues = [
            quotationData.customer_id,
            quotationData.company_id,
            gstRate, 
            quotationData.rate,
            quotationData.date,
            quotationData.term_condition,
            documentNo,
            quotationData.Salesperson_id,
            preparedBy,
            quotationData.additional_text,
            quotationData.additional_value,
            quotationData.less_text,
            quotationData.less_value
        ];
        const quotationResult = await pool.query(quotationQuery, quotationValues);
        const quotationId = quotationResult.rows[0].quotation_id;

        for (const jobwork of jobworkData) {
            const { job_id, jobwork_description, productData } = jobwork;
            const jobworkQuery = `
                INSERT INTO quotation_jobwork (q_id, job_id,  jobwork_description)
                VALUES ($1, $2, $3)
                RETURNING qj_id, job_id`;
            const jobworkValues = [
                quotationId,
                job_id,
                jobwork_description
            ];
            const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
            const { qj_id, job_id: jobId } = jobworkResult.rows[0];

            for (const product of productData) {
                const productPrice = parseFloat(product.product_price); 
                const gstAmount = (productPrice * gstRate) / 100;
                const productQuery = `
                    INSERT INTO quotation_product (qj_id, prd_id, product_name, product_price, gst_amount, product_description, product_quantity, unit_type, total_amount)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING prd_id`;
                const productValues = [
                    qj_id,
                    product.prd_id,
                    product.product_name,
                    productPrice,
                    gstAmount,
                    product.product_description,
                    product.product_quantity,
                    product.unit_type,
                    product.total_amount,
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
        response.status(201).json({ message: 'Data inserted successfully' });
    } catch (error) {
        response.status(500).json({ error: error.message });
        throw new Error("Error inserting data: " + error.message);
    }
}

//create modules...
module.exports = {
    createCompany,
    createJob,
    TermsConditions,
    createProduct,
    createUnit,
    insertQuotation
}