const pool = require('./db')

//updateuser...
const updateCustomer = async (request, response) => {
    const user_id = parseInt(request.params.user_id);
    const {first_name, last_name, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number, user_password } = request.body;

    if (!user_id || !first_name || !last_name || !email_id) {
        return response.status(400).json({ error: 'Required fields are missing' });
    }

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
            bank_name = $11, bank_branch = $12, bank_ac_no = $13, ifsc_number = $14, customer_gst_number = $15, user_role = $16 ${hashedPassword ? ', user_password = $17' : ''}
            WHERE user_id = ${hashedPassword ? '$18' : '$17'}
        `;
        const values = [first_name, last_name, email_id, phone_no, alter_no, website, address1, address2,city, zip_code, bank_name, bank_branch, 
                        bank_ac_no, ifsc_number, customer_gst_number, user_role
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
    const { company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, editImage, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number } = request.body;
    try {
        let company_logo_1
        if(company_logo && company_logo.data) {
            company_logo_1 = editImage
           
        } else {
           company_logo_1 = company_logo
        }
        await pool.query(
            'UPDATE company SET company_name = $1, address1 = $2, address2 = $3, city = $4, zip_code = $5, company_email_id = $6, company_phone_no = $7, company_website = $8, company_logo = $9, bank_name = $10, bank_branch = $11, bank_ac_no = $12, ifsc_number = $13, company_gst_number = $14 WHERE company_id = $15',
            [company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo_1, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number, company_id]
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
    const { product_image, editImage, product_name, product_price, product_description, product_wholesale_price } = request.body;
    try {
        let product_image_1
        if(product_image && product_image.data) {
            product_image_1 = editImage
           
        } else {
            product_image_1 = product_image
        }
        await pool.query('UPDATE product SET product_image = $1, product_name = $2, product_price = $3, product_description = $4, product_wholesale_price = $5 WHERE product_id = $6',
            [product_image_1, product_name, product_price, product_description, product_wholesale_price, product_id]);
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
    const quotationId = parseInt(request.params.quotationId);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        

        const updateQuotationQuery = `
            UPDATE quotation SET customer_id = $1, company_id = $2, gst = $3, rate = $4, date = $5, terms_conditions = $6, salesperson_id = $7,  additional_text = $8,
            additional_value = $9, less_text = $10, less_value = $11, est_caption = $12, totalamount = $13, quotation_type = $14, prepared_by = $15, gst_amount = $16, less_amount = $17, lessvalue_amount = $18 , show_header = $19 WHERE quotation_id = $20`;
        const updateQuotationValues = [
            quotationData.customer_id,
            quotationData.company_id,
            quotationData.gst,
            quotationData.rate,
            quotationData.date,
            quotationData.terms_conditions,
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
            quotationId,
        ];
        await client.query(updateQuotationQuery, updateQuotationValues);

        for (const jobwork of jobworkData) {
            const { qj_id, q_id, job_id, jobwork_name, jobwork_description, productData } = jobwork;

            const updateJobworkQuery = `
                    UPDATE quotation_jobwork SET  jobwork_name = $1, jobwork_description = $2, q_id = $3, job_id = $4 WHERE qj_id = $5`;
            const updateJobworkValues = [
                jobwork_name, jobwork_description, q_id, job_id, qj_id
            ];
            await client.query(updateJobworkQuery, updateJobworkValues);

            for (const product of productData) {
                const { qp_id, qj_id, prd_id, product_name, product_price, product_description, product_quantity, unit_type, amount, other_productname } = product;

                const updateProductQuery = `
                    UPDATE quotation_product SET product_name = $1, product_price = $2, product_description = $3, product_quantity = $4, unit_type = $5, amount = $6, other_productname = $7, qj_id = $8, prd_id = $9 WHERE qp_id = $10 `;
                const updateProductValues = [
                    product_name, product_price, product_description, product_quantity, unit_type, amount, other_productname, qj_id, prd_id, qp_id,
                ];
                await client.query(updateProductQuery, updateProductValues);
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
    const { emailid, newpassword } = request.body;

    if (!emailid || !newpassword) {
        return response.status(400).send({ error: 'Email ID and newpassword are required' });
    }
    const saltRounds = 10;

    try {
        const hashedPassword = await bcrypt.hash(newpassword, saltRounds);
        await pool.query(
            'UPDATE "users" SET user_password = $1 WHERE email_id = $2',
            [hashedPassword, emailid]
        );
        response.status(200).send({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        response.status(500).send({ error: 'An error occurred while updating the password' });
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
    updatepassword
}


