const pool = require('./db');

//createcompany...
const createCompany = async (request, response) => {
    const { company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number, alter_no, landline_no } = request.body;
    try {
        if (!company_name || !company_email_id || !company_phone_no) {
            return response.status(200).json({ error: 'Missing required fields' });
        }
        const companyCheckQuery = 'SELECT * FROM company WHERE company_name = $1';
        const companyCheckResult = await pool.query(companyCheckQuery, [company_name]);
        if (companyCheckResult.rows.length > 0) {
            return response.status(200).json({ error: 'Company already exists' });
        }
        await pool.query(`INSERT INTO company ( company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number, alter_no, landline_no)
                          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, $15, $16)`,
            [company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number,  alter_no, landline_no]);
        response.status(201).json({ message: 'Company details created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: error.message });
    }
}

//createjobwork...
const createJob = async (request, response) => {
    const { jobwork_name, jobwork_description } = request.body;
    if (!jobwork_name) {
        return response.status(200).json({ error: 'Missing required fields' });
    }
    try {
        const jobCheckQuery = 'SELECT * FROM jobwork WHERE jobwork_name = $1';
        const jobCheckResult = await pool.query(jobCheckQuery, [jobwork_name]);
        if (jobCheckResult.rows.length > 0) {
            return response.status(200).json({ error: 'jobwork already exists' });
        }
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
        return response.status(200).json({ error: 'Missing required fields' });
    }
    try {
        await pool.query('INSERT INTO terms_condition (terms_conditions_name, tc_value) VALUES ($1, $2)',
            [terms_conditions_name, JSON.stringify(tc_value)]);
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
        return response.status(200).json({ error: 'Missing required fields' });
    }
    try {
        const unitCheckQuery = 'SELECT * FROM unit WHERE unit_type = $1';
        const unitCheckResult = await pool.query(unitCheckQuery, [unit_type]);
        if (unitCheckResult.rows.length > 0) {
            return response.status(200).json({ error: 'unit already exists' });
        }
        await pool.query('INSERT INTO unit (unit_type, unit_text) VALUES ($1, $2)',
            [unit_type, unit_text]);
        response.status(201).json({ message: 'unit created successfully' });
    } catch (error) {
        console.error('Error:', error);
        return response.status(500).json({ error: 'Internal server error' });
    }
}

//createproduct...
const createProduct = async (request, response) => {
    const { product_image, product_name, product_price, product_description, product_wholesale_price, u_id } = request.body;

    if (!product_name || product_price === undefined || product_price === null || !product_description || product_wholesale_price === undefined || product_wholesale_price === null) {
        return response.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await pool.query('INSERT INTO product (product_image, product_name, product_price, product_description, product_wholesale_price, u_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [product_image, product_name, product_price, product_description, product_wholesale_price, u_id]);
        response.status(201).json({ message: 'Product created successfully' });
    } catch (error) {
        console.error('Error:', error);
        return response.status(500).json({ error: 'Internal server error' });
    }
};


//createquotation...
const insertQuotation = async (request, response) => {
    const { quotationData, jobworkData } = request.body;
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString().slice(-2);
        const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
        const formattedDate = `${year}${month}`;

        const QuotationType = quotationData.quotation_type === 'Estimates' ? 'ES' : 'BS';

        const lastQuotationQuery = `SELECT MAX(SUBSTRING(document_no, 8)::int) AS last_document_no FROM quotation WHERE document_no LIKE '${QuotationType}${formattedDate}%'`;
        const lastQuotationResult = await pool.query(lastQuotationQuery);
        const lastDocumentNo = lastQuotationResult.rows[0].last_document_no || 0;

        const documentNo = `${QuotationType}${formattedDate}${('0' + (lastDocumentNo + 1))}`;

        const approvedStatus = quotationData.approved_status ? '1' : '0';
        const approvedAt = quotationData.approved_status ? new Date() : null;

        const quotationQuery = `
        INSERT INTO quotation (
            customer_id, company_id, gst, rate, date, terms_conditions, document_no, 
            salesperson_id, prepared_by, additional_text, additional_value, less_text, 
            less_value, est_caption, totalamount, quotation_type, gst_amount, less_amount, 
            lessvalue_amount, amount_wo_gst, show_header, created_at, approved_by, approved_status, selectedpricemethod, show_signature, approved_at, advance_amount
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        ) RETURNING quotation_id`;

        const quotationValues = [
            quotationData.customer_id,
            quotationData.company_id,
            quotationData.gst,
            quotationData.rate,
            quotationData.date,
            JSON.stringify(quotationData.terms_conditions),
            documentNo,
            quotationData.salesperson_id,
            quotationData.prepared_by,
            quotationData.additional_text,
            quotationData.additional_value,
            quotationData.less_text,
            quotationData.less_value,
            quotationData.est_caption,
            quotationData.totalamount,
            quotationData.quotation_type,
            quotationData.gst_amount,
            quotationData.less_amount,
            quotationData.lessvalue_amount,
            quotationData.amount_wo_gst,
            quotationData.show_header,
            new Date(),
            quotationData.approved_by,
            approvedStatus,
            quotationData.selectedpricemethod,
            quotationData.show_signature,
            approvedAt,
            quotationData.advance_amount
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

                const productQuery = `
                    INSERT INTO quotation_product (qj_id, prd_id, product_name, product_price, product_description, product_quantity, unit_type, amount, other_productname, product_wholesale_price, actual_price, actual_wholesale_price)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING prd_id`;
                const productValues = [
                    qj_id,
                    productId,
                    product.product_name,
                    product.product_price,
                    product.product_description,
                    product.product_quantity,
                    product.unit_type,
                    product.amount,
                    product.other_productname,
                    product.product_wholesale_price,
                    product.actual_price,
                    product.actual_wholesale_price
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
        response.status(201).json({ message: 'Data inserted successfully', quotationId, documentNo });
    } catch (error) {
        console.error('invalid input Type for Quotation', error)
        return response.status(500).json({ error: error.message });
    }
}


const copyQuotation = async (request, response) => {
    const { quotationId } = request.params;
    let { bill } = request.query;
    try {
        const QuotationQuery = `SELECT * FROM quotation WHERE quotation_id = $1`;
        const QuotationResult = await pool.query(QuotationQuery, [quotationId]);
        const Quotation = QuotationResult.rows[0];

        if (!Quotation) {
            return response.status(404).json({ error: 'Source quotation not found' });
        }

        let QuotationType;
        if (bill === 'y') {
            QuotationType = 'BS', Quotation.quotation_type = 'Quotation';
        } else {
            QuotationType = Quotation.quotation_type === 'Estimates' ? 'ES' : 'BS';
        }
        
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString().slice(-2);
        const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
        const formattedDate = `${year}${month}`;
        const lastQuotationQuery = `SELECT MAX(SUBSTRING(document_no, 8)::int) AS last_document_no FROM quotation WHERE document_no LIKE '${QuotationType}${formattedDate}%'`;
        const lastQuotationResult = await pool.query(lastQuotationQuery);
        const lastDocumentNo = lastQuotationResult.rows[0].last_document_no || 0;
        const documentNo = `${QuotationType}${formattedDate}${('0' + (lastDocumentNo + 1)).slice(-2)}`;
       
        const approvedStatus = Quotation.approved_status === '1' ? '0' : Quotation.approved_status;
        const approvedAt = Quotation.approved_status ? new Date() : null;

        // Insert new quotation 
        const quotationQuery = `
            INSERT INTO quotation (
                customer_id, company_id, gst, rate, date, terms_conditions, document_no, 
                salesperson_id, prepared_by, additional_text, additional_value, less_text, 
                less_value, est_caption, totalamount, quotation_type, gst_amount, less_amount, 
                lessvalue_amount, amount_wo_gst, show_header, created_at, approved_by, approved_status, selectedpricemethod, show_signature, approved_at, advance_amount
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
            ) RETURNING quotation_id`;

        const quotationValues = [
            Quotation.customer_id,
            Quotation.company_id,
            Quotation.gst,
            Quotation.rate,
            Quotation.date,
            Quotation.terms_conditions,
            documentNo,
            Quotation.salesperson_id,
            Quotation.prepared_by,
            Quotation.additional_text,
            Quotation.additional_value,
            Quotation.less_text,
            Quotation.less_value,
            Quotation.est_caption,
            Quotation.totalamount,
            Quotation.quotation_type,
            Quotation.gst_amount,
            Quotation.less_amount,
            Quotation.lessvalue_amount,
            Quotation.amount_wo_gst,
            Quotation.show_header,
            new Date(),
            Quotation.approved_by,
            approvedStatus,
            Quotation.selectedpricemethod,
            Quotation.show_signature,
            approvedAt,
            Quotation.advance_amount
        ];

        const quotationResult = await pool.query(quotationQuery, quotationValues);
        const newQuotationId = quotationResult.rows[0].quotation_id;

        const jobworksQuery = `SELECT * FROM quotation_jobwork WHERE q_id = $1`;
        const jobworksResult = await pool.query(jobworksQuery, [quotationId]);
        const jobworks = jobworksResult.rows;

        for (const jobwork of jobworks) {
            const jobworkQuery = `
                INSERT INTO quotation_jobwork (q_id, job_id, jobwork_name, jobwork_description)
                VALUES ($1, $2, $3, $4)
                RETURNING qj_id, job_id`;
            const jobworkValues = [
                newQuotationId,
                jobwork.job_id,
                jobwork.jobwork_name,
                jobwork.jobwork_description
            ];
            const jobworkResult = await pool.query(jobworkQuery, jobworkValues);
            const { qj_id, job_id: jobId } = jobworkResult.rows[0];

            const productsQuery = `SELECT * FROM quotation_product WHERE qj_id = $1`;
            const productsResult = await pool.query(productsQuery, [jobwork.qj_id]);
            const products = productsResult.rows;

            for (const product of products) {
                const productQuery = `
                    INSERT INTO quotation_product (qj_id, prd_id, product_name, product_price, product_description, product_quantity, unit_type, amount, other_productname, product_wholesale_price, actual_price, actual_wholesale_price)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING prd_id`;
                const productValues = [
                    qj_id,
                    product.prd_id,
                    product.product_name,
                    product.product_price,
                    product.product_description,
                    product.product_quantity,
                    product.unit_type,
                    product.amount,
                    product.other_productname,
                    product.product_wholesale_price,
                    product.actual_price,
                    product.actual_wholesale_price
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

        response.status(201).json({ message: 'Quotation copied successfully', newQuotationId, documentNo });
    } catch (error) {
        console.error('Error copying quotation', error);
        return response.status(500).json({ error: error.message });
    }
};



const pacage = async (request, response) => {
    const { place, days } = request.body;

    try {
        // Insert the package data
        await pool.query(
            'INSERT INTO pacage (place, days) VALUES ($1, $2)',
            [place, JSON.stringify(days)]
        );

        response.status(201).json({ message: 'Package created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

const getAllPackages = async (request, response) => {
    try {
        const result = await pool.query('SELECT * FROM pacage');
        response.status(200).json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};



//create modules...
module.exports = {
    createCompany,
    createJob,
    TermsConditions,
    createProduct,
    createUnit,
    insertQuotation,
    pacage,
    getAllPackages,
    copyQuotation,
}