const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const dataRouter = require('./router');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors()); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));

app.use((req, res, next) => {
  const startMemory = process.memoryUsage();
  console.log('Srat Memory')
  console.log(`API: ${req.method} ${req.originalUrl}`);
    console.log(`Memory Usage - RSS: ${Math.round(startMemory.rss / 1024 / 1024)} MB`);
    console.log(`Heap Total: ${Math.round(startMemory.heapTotal / 1024 / 1024)} MB`);
    console.log(`Heap Used: ${Math.round(startMemory.heapUsed / 1024 / 1024)} MB`);
    console.log('-----------------------------------');
  
  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    console.log('finish Memory')
    console.log(`API: ${req.method} ${req.originalUrl}`);
    console.log(`Memory Usage - RSS: ${Math.round(endMemory.rss / 1024 / 1024)} MB`);
    console.log(`Heap Total: ${Math.round(endMemory.heapTotal / 1024 / 1024)} MB`);
    console.log(`Heap Used: ${Math.round(endMemory.heapUsed / 1024 / 1024)} MB`);
    console.log('-----------------------------------');
  });

  next();
});

app.use(dataRouter);

// CORS setup
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');      
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
