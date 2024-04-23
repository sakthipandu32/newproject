const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg'); // Importing pg library to interact with PostgreSQL
const dataRouter = require('./router');

const app = express();
const port = 5000;

// Connection string to PostgreSQL
const postgres_url = "postgres://default:W5rvhOm0sJza@ep-quiet-bush-a489bw1a.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require";

// Create a connection pool
const pool = new Pool({
  connectionString: postgres_url,
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://192.168.1.10:8080');      
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Use the connection pool to test database connectivity
pool.query('SELECT NOW()', (err, dbRes) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('PostgreSQL connected:', dbRes.rows);
  }
});

app.use(dataRouter);

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

// Start server
app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
