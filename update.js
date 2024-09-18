const pool = require('./db')

//updateuser...
const updateCustomer = async (request, response) => {
    const user_id = parseInt(request.params.user_id);
    const { first_name, last_name, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number, user_password, client_name } = request.body;

    let hashedPassword = null;
    if (user_password) {
        try {
            hashedPassword = await bcrypt.hash(user_password, 10);
        } catch (error) {
            console.error('Error hashing password:', error);
            return response.status(500).json({ error: 'Error hashing password' });
        }
    }

    try {
        const query = `
            UPDATE "users" SET first_name = $1, last_name = $2, email_id = $3, phone_no = $4, alter_no = $5, website = $6, address1 = $7, address2 = $8, city = $9, zip_code = $10,
            bank_name = $11, bank_branch = $12, bank_ac_no = $13, ifsc_number = $14, customer_gst_number = $15, client_name = $16, user_role = $17 ${hashedPassword ? ', user_password = $18' : ''}
            WHERE user_id = ${hashedPassword ? '$19' : '$18'}
        `;
        const values = [first_name, last_name, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, bank_name, bank_branch,
            bank_ac_no, ifsc_number, customer_gst_number, client_name, user_role
        ];

        if (hashedPassword) {
            values.push(hashedPassword, user_id);
        } else {
            values.push(user_id);
        }

        await pool.query(query, values);

        response.status(200).json({ message: 'User details updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};


//updateCompany...
const updateCompany = async (request, response) => {
    const company_id = parseInt(request.params.company_id);
    const { company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, editImage, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number,alter_no, landline_no } = request.body;
    try {
        let company_logo_1
        if (company_logo && company_logo.data) {
            company_logo_1 = editImage

        } else {
            company_logo_1 = company_logo
        }
        await pool.query(
            'UPDATE company SET company_name = $1, address1 = $2, address2 = $3, city = $4, zip_code = $5, company_email_id = $6, company_phone_no = $7, company_website = $8, company_logo = $9, bank_name = $10, bank_branch = $11, bank_ac_no = $12, ifsc_number = $13, company_gst_number = $14, alter_no = $15, landline_no = $16 WHERE company_id = $17',
            [company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo_1, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number,alter_no, landline_no, company_id]
        );
        response.status(201).json({ message: 'Company details updated successfully' });

    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}


//updatejobwork...
const updateJobwork = async (request, response) => {
    const jobwork_id = parseInt(request.params.jobwork_id);
    const { jobwork_name, jobwork_description } = request.body;
    try {
        await pool.query('UPDATE jobwork SET jobwork_name = $1, jobwork_description = $2 WHERE jobwork_id = $3',
            [jobwork_name, jobwork_description, jobwork_id]);
        response.status(201).json({ message: 'jobwork updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//updateproduct...
const updateProduct = async (request, response) => {
    const product_id = parseInt(request.params.product_id);
    const { product_image, editImage, product_name, product_price, product_description, product_wholesale_price, u_id } = request.body;
    try {
        let product_image_1
        if (product_image && product_image.data) {
            product_image_1 = editImage

        } else {
            product_image_1 = product_image
        }
        await pool.query('UPDATE product SET product_image = $1, product_name = $2, product_price = $3, product_description = $4, product_wholesale_price = $5, u_id = $6 WHERE product_id = $7',
            [product_image_1, product_name, product_price, product_description, product_wholesale_price, u_id, product_id]);
        response.status(201).json({ message: 'product updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//updateunit...
const updateUnit = async (request, response) => {
    const unit_id = parseInt(request.params.unit_id);
    const { unit_type, unit_text } = request.body;
    try {
        await pool.query('UPDATE unit SET unit_type = $1, unit_text = $2 WHERE unit_id = $3',
            [unit_type, unit_text, unit_id]);
        response.status(201).json({ message: 'unit updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//update term and conditions...
const updateTerms = async (request, response) => {
    const tc_id = parseInt(request.params.tc_id);
    const { terms_conditions_name, tc_value } = request.body;
    try {
        await pool.query('UPDATE terms_condition SET terms_conditions_name = $1, tc_value = $2 WHERE tc_id = $3',
            [terms_conditions_name, JSON.stringify(tc_value), tc_id]);
        response.status(201).json({ message: 'TermsConditions created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//updatequotations...
const updateQuotation = async (request, response) => {
    const { quotationData, jobworkData } = request.body;
    const quotationId = parseInt(request.params.quotationId, 10);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const updateQuotationQuery = `
            UPDATE quotation SET customer_id = $1, company_id = $2, gst = $3, rate = $4, date = $5, terms_conditions = $6, salesperson_id = $7, 
            additional_text = $8, additional_value = $9, less_text = $10, less_value = $11, est_caption = $12, totalamount = $13, 
            quotation_type = $14, prepared_by = $15, gst_amount = $16, less_amount = $17, lessvalue_amount = $18, show_header = $19, 
            modified_at = $20, selectedpricemethod = $21, show_signature = $22, amount_wo_gst = $23, advance_amount = $24 WHERE quotation_id = $25`;
        const updateQuotationValues = [
            quotationData.customer_id,
            quotationData.company_id,
            quotationData.gst,
            quotationData.rate,
            quotationData.date,
            JSON.stringify(quotationData.terms_conditions),
            quotationData.salesperson_id,
            quotationData.additional_text,
            quotationData.additional_value,
            quotationData.less_text,
            quotationData.less_value,
            quotationData.est_caption,
            quotationData.totalamount,
            quotationData.quotation_type,
            quotationData.prepared_by,
            quotationData.gst_amount,
            quotationData.less_amount,
            quotationData.lessvalue_amount,
            quotationData.show_header,
            new Date(),
            quotationData.selectedpricemethod,
            quotationData.show_signature,
            quotationData.amount_wo_gst,
            quotationData.advance_amount,
            quotationId,
        ];
        await client.query(updateQuotationQuery, updateQuotationValues);

        const currentJobworkIds = await client.query('SELECT qj_id FROM quotation_jobwork WHERE q_id = $1', [quotationId]);
        const currentJobworkIdSet = new Set(currentJobworkIds.rows.map(row => row.qj_id));

        const requestJobworkIds = new Set(jobworkData.map(jobwork => jobwork.qj_id));

        for (const qj_id of currentJobworkIdSet) {
            if (!requestJobworkIds.has(qj_id)) {
                await client.query('DELETE FROM quotation_product WHERE qj_id = $1', [qj_id]);
                await client.query('DELETE FROM quotation_jobwork WHERE qj_id = $1', [qj_id]);
            }
        }

        for (const jobwork of jobworkData) {
            const { qj_id, q_id, job_id, jobwork_name, jobwork_description, productData } = jobwork;

            const jobworkIdQuery = `SELECT jobwork_id FROM jobwork WHERE jobwork_name = $1`;
            const jobworkIdResult = await pool.query(jobworkIdQuery, [jobwork_name]);
            const jobworkNameId = jobworkIdResult.rows[0]?.jobwork_id;

            let currentQjId = qj_id;

            if (currentQjId) {
                const checkJobworkQuery = 'SELECT qj_id FROM quotation_jobwork WHERE qj_id = $1';
                const jobworkResult = await client.query(checkJobworkQuery, [currentQjId]);

                if (jobworkResult.rowCount > 0) {
                    const updateJobworkQuery = `
                        UPDATE quotation_jobwork SET jobwork_name = $1, jobwork_description = $2, q_id = $3, job_id = $4 WHERE qj_id = $5`;
                    const updateJobworkValues = [jobwork_name, jobwork_description, q_id, job_id, currentQjId];
                    await client.query(updateJobworkQuery, updateJobworkValues);
                } else {
                    const insertJobworkQuery = `
                        INSERT INTO quotation_jobwork (q_id, job_id, jobwork_name, jobwork_description) VALUES ($1, $2, $3, $4) RETURNING qj_id`;
                    const insertJobworkValues = [quotationId, jobworkNameId, jobwork_name, jobwork_description];
                    const newJobworkResult = await client.query(insertJobworkQuery, insertJobworkValues);
                    currentQjId = newJobworkResult.rows[0].qj_id;
                }
            } else {
                const insertJobworkQuery = `
                    INSERT INTO quotation_jobwork (q_id, job_id, jobwork_name, jobwork_description) VALUES ($1, $2, $3, $4) RETURNING qj_id`;
                const insertJobworkValues = [quotationId, jobworkNameId, jobwork_name, jobwork_description];
                const newJobworkResult = await client.query(insertJobworkQuery, insertJobworkValues);
                currentQjId = newJobworkResult.rows[0].qj_id;
            }

            const currentProductIds = await client.query('SELECT qp_id FROM quotation_product WHERE qj_id = $1', [currentQjId]);
            const currentProductIdSet = new Set(currentProductIds.rows.map(row => row.qp_id));

            const requestProductIds = new Set(productData.map(product => product.qp_id));

            for (const qp_id of currentProductIdSet) {
                if (!requestProductIds.has(qp_id)) {
                    await client.query('DELETE FROM quotation_product WHERE qp_id = $1', [qp_id]);
                }
            }

            for (const product of productData) {
                const { qp_id, product_name, product_price, product_description, product_quantity, unit_type, amount, other_productname, product_wholesale_price, actual_price, actual_wholesale_price } = product;

                const checkProductQuery = 'SELECT qp_id FROM quotation_product WHERE qp_id = $1';
                const productResult = await client.query(checkProductQuery, [qp_id]);

                const productIdQuery = `SELECT product_id FROM product WHERE product_name = $1`;
                const productIdResult = await pool.query(productIdQuery, [product_name]);
                const productId = productIdResult.rows[0]?.product_id || null;


                if (productResult.rowCount > 0) {
                    const updateProductQuery = `
                        UPDATE quotation_product SET product_name = $1, product_price = $2, product_description = $3, product_quantity = $4, unit_type = $5, 
                        amount = $6, other_productname = $7, qj_id = $8, prd_id = $9, actual_price = $10, actual_wholesale_price = $11, product_wholesale_price = $12 WHERE qp_id = $13`;
                    const updateProductValues = [
                        product_name, product_price, product_description, product_quantity, unit_type, amount, other_productname, currentQjId, productId, actual_price, actual_wholesale_price, product_wholesale_price, qp_id,
                    ];
                    await client.query(updateProductQuery, updateProductValues);
                } else {
                    const insertProductQuery = `
                        INSERT INTO quotation_product (qj_id, prd_id, product_name, product_price, product_description, product_quantity, unit_type, amount, other_productname, product_wholesale_price,actual_price,actual_wholesale_price) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
                    const insertProductValues = [
                        currentQjId, productId, product_name, product_price, product_description, product_quantity, unit_type, amount, other_productname, product_wholesale_price, actual_price, actual_wholesale_price
                    ];
                    await client.query(insertProductQuery, insertProductValues);
                }
            }
        }

        await client.query('COMMIT');
        response.status(200).json({ message: 'Quotation data updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        response.status(500).json({ error: error.message });
        console.error("Error updating data: " + error.message);
    } finally {
        client.release();
    }
};


// updatepassword...
const bcrypt = require('bcrypt');

const updatepassword = async (request, response) => {
    const { email_id, newpassword } = request.body;

    if (!email_id || !newpassword) {
        return response.status(400).send({ error: 'Email ID and newpassword are required' });
    }
    const saltRounds = 10;

    try {
        const hashedPassword = await bcrypt.hash(newpassword, saltRounds);
        await pool.query(
            'UPDATE "users" SET user_password = $1 WHERE email_id = $2',
            [hashedPassword, email_id]
        );
        response.status(200).send({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        response.status(500).send({ error: 'An error occurred while updating the password' });
    }
};

const aprovedQuotation = async (request, response) => {
    const quotationId = parseInt(request.params.quotationId);
    const { approved_by, approved_status } = request.body;

    const statusToUpdate = approved_status === 1 ? 1 : 0;

    try {
        await pool.query(
            'UPDATE quotation SET approved_by = $1, approved_status = $2, approved_at = $3 WHERE quotation_id = $4',
            [approved_by, statusToUpdate, new Date(), quotationId]
        );

        const approvedFlag = statusToUpdate === 1 ? 1 : 0;

        response.status(201).json({ message: 'Approved successfully', approved_flag: approvedFlag });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
};

//update modules...
module.exports = {
    updateCompany,
    updateJobwork,
    updateProduct,
    updateUnit,
    updateTerms,
    updateCustomer,
    updateQuotation,
    updatepassword,
    aprovedQuotation
}


