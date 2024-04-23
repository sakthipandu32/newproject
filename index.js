const express = require('express');
const bodyParser = require('body-parser');
const dataRouter = require('./router');
const pool = require('./db'); // Import the connection pool
const cors = require('cors');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// CORS configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://192.168.1.10:8080');      
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('PostgreSQL connected:', res.rows);
  }
});

// Mount router
app.use(dataRouter);

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

// Start server
app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
