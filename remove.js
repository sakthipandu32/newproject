const pool = require('./db');

//deletecustomer...
const deleteCustomer = async (request, response) => {
  const user_id = parseInt(request.params.user_id);
  pool.query('DELETE FROM users WHERE user_id = $1', [user_id], (error) => {
    if (error) {
      console.error('Error:', error);
      response.status(500).json({ error: 'Internal server error' });
    } else {
      response.status(200).send(`Company deleted with ID: ${user_id}`);
    }
  });
};

//deletecompany...
const deleteCompany = async (request, response) => {
  const company_id = parseInt(request.params.company_id);
  pool.query('DELETE FROM company WHERE company_id = $1', [company_id], (error) => {
    if (error) {
      console.error('Error:', error);
      response.status(500).json({ error: 'Internal server error' });
    } else {
      response.status(200).send(`Company deleted with ID: ${company_id}`);
    }
  });
};



//deletejobwork...
const deleteJobwork = async (req, res) => {
  const jobwork_id = parseInt(req.params.jobwork_id);

  try {
    const result = await pool.query('DELETE FROM jobwork WHERE jobwork_id = $1', [jobwork_id]);

    if (result.rowCount === 0) {
      return res.status(404).send(`No jobwork found with ID: ${jobwork_id}`);
    }

    res.status(200).send(`Jobwork deleted with ID: ${jobwork_id}`);
  } catch (error) {
    if (error.code === '23503') {
      return res
        .status(200) 
        .send(`Jobwork cannot be deleted because it is referenced by other records.`);
    } else {
      return res.status(500).send(`An error occurred while trying to delete the jobwork: ${error.message}`);
    }
  }
};


//deleteunit...
const deleteunit = async (request, response) => {
  const unit_id = parseInt(request.params.unit_id);

  try {
    const result = await pool.query('DELETE FROM unit WHERE unit_id = $1', [unit_id]);
    if (result.rowCount === 0) {
      return response.status(404).send(`Unit not found with ID: ${unit_id}`);
    }
      response.status(200).send(`Unit deleted with ID: ${unit_id}`);
  } catch (error) {
    if (error.code === '23503') {
      return response.status(200).send(`Cannot delete unit because it is referenced by other records.`);
    } else {
      return response.status(500).send(`An error occurred while trying to delete the unit: ${error.message}`);
    }
  }
};


//deleteproduct...
const deleteproduct = async (request, response) => {
  const product_id = parseInt(request.params.product_id);

  pool.query('DELETE FROM product WHERE product_id = $1', [product_id], (error) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`employee deleted with ID: ${product_id}`);
  })
}


//delete term and condition...
const deleteterm = async (request, response) => {
  const tc_id = parseInt(request.params.tc_id);

  pool.query('DELETE FROM terms_condition WHERE tc_id = $1', [tc_id], (error) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`employee deleted with ID: ${tc_id}`);
  })
}


//deletequotations...
const deleteQuotation = async (request, response) => {
  const { quotationId } = request.params;
  try {
    const deleteQuotationProductQuery = 'DELETE FROM quotation_product WHERE qj_id IN (SELECT qj_id FROM quotation_jobwork WHERE q_id = $1)';
    await pool.query(deleteQuotationProductQuery, [quotationId]);

    const deleteQuotationJobworkQuery = 'DELETE FROM quotation_jobwork WHERE q_id = $1';
    await pool.query(deleteQuotationJobworkQuery, [quotationId]);

    const deleteQuotationQuery = 'DELETE FROM quotation WHERE quotation_id = $1';
    await pool.query(deleteQuotationQuery, [quotationId]);

    response.status(200).json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    response.status(500).json({ error: 'Internal server error' });
    console.error('Error deleting quotation:', error);
  }
};



//delete modules...
module.exports = {
  deleteCompany,
  deleteJobwork,
  deleteunit,
  deleteproduct,
  deleteterm,
  deleteCustomer,
  deleteQuotation
}