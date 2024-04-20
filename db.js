const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'postgres',
  password: 'sa2547',
  port: 5432,
  host: 'localhost',
  database: 'kv_metaldbase',
});

module.exports = pool;


const getData = async (request, response) => {
  try {
      const TableName = request.params.TableName;
      const { filterColumn, filterValue, sort, page = 1, limit } = request.query;

      let query = `SELECT * FROM ${TableName}`;
      let queryParams = [];
      let filterConditions = [];
      let paramCount = 1;

      if (filterColumn && filterValue) {
          filterConditions.push(`${filterColumn} LIKE $${paramCount}`);
          queryParams.push(`${filterValue}%`);
          paramCount++;
      }

      if (filterConditions.length > 0) {
          query += ` WHERE ${filterConditions.join(' AND ')}`;
      }

      if (sort) {
          const sortParts = sort.split(':');
          if (sortParts.length === 2) {
              const [sortColumn, sortOrder] = sortParts;
              const sanitizedSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
              query += ` ORDER BY ${sortColumn} ${sanitizedSortOrder}`;
          } else {
              throw new Error('Invalid format for sort parameter');
          }
      }

      if (page > 0) {
          if (limit) {
              const offset = (page - 1) * limit;
              query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
              queryParams.push(parseInt(limit), offset);
          }
      }

      const { rows } = await pool.query(query, queryParams);

      if (rows.length > 0) {
          const data = rows.map(row => {
              if (row.product_image) {
                  const base64 = row.product_image;
                  const src = "" + base64;
                  row.editImage = src;
              }
              if (row.company_logo) {
                  const base64 = row.company_logo;
                  const src = "" + base64;
                  row.editImage = src;
              }
              return row;
          });
          response.status(200).json({ [TableName]: data });
      } else {
          response.status(404).json({ error: 'No data found' });
      }
  } catch (error) {
      console.error('Error:', error.message);
      response.status(500).json({ error: 'Failed to get data' });
  }
};
