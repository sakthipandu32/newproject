const bcrypt = require('bcrypt');
const pool = require('./db')

//updateuser...
const updateCustomer = async (request, response) => {
    const user_id = parseInt(request.params.user_id);
    const { first_name, last_name, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, user_role, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number } = request.body;
    try {

        await pool.query('UPDATE "users" SET first_name = $1, last_name = $2, email_id = $3, phone_no = $4, alter_no = $5, website = $6, address1 = $7, address2 = $8, city = $9, zip_code = $10, bank_name = $11, bank_branch = $12, bank_ac_no = $13, ifsc_number = $14, customer_gst_number = $15, user_role = $16 WHERE user_id = $17',
            [first_name, last_name, email_id, phone_no, alter_no, website, address1, address2, city, zip_code, bank_name, bank_branch, bank_ac_no, ifsc_number, customer_gst_number, user_role, user_id]);
        response.status(201).json({ message: 'User details updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}


// Define your updateCompany function
const updateCompany = async (request, response) => {
    const company_id = parseInt(request.params.company_id);
    const { company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number } = request.body;
    try {
        await pool.query(
            'UPDATE company SET company_name = $1, address1 = $2, address2 = $3, city = $4, zip_code = $5, company_email_id = $6, company_phone_no = $7, company_website = $8, company_logo = $9, bank_name = $10, bank_branch = $11, bank_ac_no = $12, ifsc_number = $13, company_gst_number = $14 WHERE company_id = $15',
            [company_name, address1, address2, city, zip_code, company_email_id, company_phone_no, company_website, company_logo, bank_name, bank_branch, bank_ac_no, ifsc_number, company_gst_number, company_id]
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
    const { product_image, product_name, product_price, product_description, product_wholesale_price } = request.body;
    try {
        await pool.query('UPDATE product SET product_image = $1, product_name = $2, product_price = $3, product_description = $4, product_wholesale_price = $5 WHERE product_id = $6',
            [product_image, product_name, product_price, product_description, product_wholesale_price, product_id]);
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
            [terms_conditions_name, tc_value, tc_id]);
        response.status(201).json({ message: 'TermsConditions created successfully' });
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
}

//updatequotations...
const updateQuotation = async (request, response) => {
    const { quotationData, jobworkData } = request.body;
    const { quotationId } = request.params;
    try {
      const quotationUpdateQuery = `
        UPDATE quotation SET customer_id = $1, company_id = $2, gst = $3, rate = $4, date = $5, terms_conditions = $6, Salesperson_id = $7, Prepared_by = $8, additional_text = $9, additional_value = $10, less_text = $11, less_value = $12, est_caption = $13, totalamount = $14, quotation_type = $15 WHERE quotation_id = $16`;
      const quotationUpdateValues = [
        quotationData.customer_id,
        quotationData.company_id,
        quotationData.gst,
        quotationData.rate,
        quotationData.date,
        quotationData.terms_conditions,
        quotationData.Salesperson_id,
        quotationData.Prepared_by,
        quotationData.additional_text,
        quotationData.additional_value,
        quotationData.less_text,
        quotationData.less_value,
        quotationData.est_caption,
        quotationData.totalamount,
        quotationData.quotation_type,
        quotationId
      ];
      await pool.query(quotationUpdateQuery, quotationUpdateValues);
  
      const deleteJobworkQuery = `
        DELETE FROM quotation_jobwork
        WHERE q_id = $1`;
      await pool.query(deleteJobworkQuery, [quotationId]);
  
      for (const jobwork of jobworkData) {
        const { job_id, jobwork_name, jobwork_description, productData } = jobwork
        const jobworkInsertQuery = `
          INSERT INTO quotation_jobwork (q_id, job_id, jobwork_name, jobwork_description)
          VALUES ($1, $2, $3, $4)
          RETURNING qj_id, job_id`;
        const jobworkInsertValues = [
          quotationId,
          job_id,
          jobwork_name,
          jobwork_description
        ];
        const jobworkResult = await pool.query(jobworkInsertQuery, jobworkInsertValues);
        const { qj_id } = jobworkResult.rows[0];

        for (const product of productData) {
          const productInsertQuery = `
            INSERT INTO quotation_product (qj_id, prd_id, product_name, product_price, product_description, product_quantity, unit_type, amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
          const productInsertValues = [
            qj_id,
            product.prd_id,
            product.product_name,
            product.product_price,
            product.product_description,
            product.product_quantity,
            product.unit_type,
            product.amount
          ];
         await pool.query(productInsertQuery, productInsertValues);
        }
      }

      await pool.query('COMMIT');
  
      response.status(200).json({ message: 'Data updated successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      response.status(500).json({ error: error.message });
      console.error('Error updating data:', error.message);
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
    updateQuotation
}


