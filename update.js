const bcrypt = require('bcrypt');
const pool = require('./db');

//updateuser...
const updateCustomer = async (request, response) => {
    const user_id = parseInt(request.params.user_id);
    const { first_name, last_name, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number, user_password } = request.body;
    try {
        const hashedPassword = await bcrypt.hash(user_password, 10);
        await pool.query('UPDATE "users" SET first_name = $1, last_name = $2, user_password = $3, email_id = $4, phone_no = $5, alter_no = $6, website = $7, address1 = $8, address2 = $9, city = $10, zip_code = $11, bank_name = $12, bank_branch = $13, bank_ac_no = $14, ifsc_number = $15, customer_gst_number = $16, user_role = $17 WHERE user_id = $18',
            [first_name, last_name, hashedPassword, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number, user_role, user_id]);
        response.status(201).json({ message: 'Company details updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//updatecompany...
const updateCompany = async (request, response) => {
    const company_id = parseInt(request.params.company_id);
    const { company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number } = request.body;
    try {
        await pool.query('UPDATE company SET company_name = $1, address1 = $2, address2 = $3, city = $4, zip_code = $5, company_email_id = $6, company_phone_no = $7, company_website = $8, company_logo = $9, bank_name = $10, bank_branch = $11, bank_ac_no = $12, ifsc_number = $13, company_gst_number = $14 WHERE company_id = $15',
            [company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number, company_id]);
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
    const { product_image, product_name, product_price, product_description } = request.body;
    try {
        await pool.query('UPDATE product SET product_image = $1, product_name = $2, product_price = $3, product_description = $4 WHERE product_id = $5',
            [product_image, product_name, product_price, product_description, product_id]);
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
    const { terms_conditions_name, tc_info } = request.body;
    try {
        await pool.query('UPDATE terms_conditions SET terms_conditions_name = $1,tc_info = $2 WHERE tc_id = $3',
            [terms_conditions_name, tc_info, tc_id]);
        response.status(201).json({ message: 'TermsConditions created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}


//update modules...
module.exports = {
    updateCompany,
    updateJobwork,
    updateProduct,
    updateUnit,
    updateTerms,
    updateCustomer
}


