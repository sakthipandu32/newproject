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
const deleteJobwork = async (request, response) => {
  const jobwork_id = parseInt(request.params.jobwork_id);

  pool.query('DELETE FROM jobwork WHERE jobwork_id = $1', [jobwork_id], (error) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`employee deleted with ID: ${jobwork_id}`);
  })
}

//deleteunit...
const deleteunit = async (request, response) => {
  const unit_id = parseInt(request.params.unit_id);

  pool.query('DELETE FROM unit WHERE unit_id = $1', [unit_id], (error) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`employee deleted with ID: ${unit_id}`);
  })
}


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

  pool.query('DELETE FROM terms_conditions WHERE tc_id = $1', [tc_id], (error) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`employee deleted with ID: ${tc_id}`);
  })
}


//delete modules...
module.exports = {
  deleteCompany,
  deleteJobwork,
  deleteunit,
  deleteproduct,
  deleteterm,
  deleteCustomer
}