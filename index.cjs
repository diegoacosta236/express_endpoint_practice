const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

// Allows us to access the .env
require('dotenv').config();

const app = express();
const port = process.env.PORT // default port to listen

const corsOptions = {
   origin: '*', 
   credentials: true,  
   'access-control-allow-credentials': true,
   optionSuccessStatus: 200,
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(cors(corsOptions));

// Makes Express parse the JSON body of any requests and adds the body to the req object
app.use(bodyParser.json());

app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});

app.use(cors());

app.use(express.json());

app.get('/', async function(req, res) {
  try {
    const query = await req.db.query(
      `SELECT * FROM car WHERE deleted_flag = 0`
    );
    const cars = query[0];
    res.json({ success: true, data: cars });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err, data: null });
  }
});

app.use(async function(req, res, next) {
  try {
    console.log('Middleware after the get /cars');
  
    await next();

  } catch (err) {

  }
});

app.post('/', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO car (make, model, year) 
       VALUES (:make, :model, :year)`,
      {
        make,
        model,
        year,
      }
    );
  
    res.json({ success: true, message: 'Car successfully created', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});


app.delete('/:id', async function(req, res) {
  try {
    const { id } = req.params;
  
    const query = await req.db.query(
      `UPDATE car SET deleted_flag = IF(deleted_flag = 0, 1, 0) WHERE id = :id`,
      { id }
    );
  
    res.json({ success: true, message: 'Car successfully deleted', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null });
  }
});

app.put('/car/:id', async function(req, res) {
  try {
    const { make } = req.body;
    const { id } = req.params;
  
    const query = await req.db.query(
      `UPDATE car SET make = :make WHERE id = :id`,
      { make, id }
    );
  
    res.json({ success: true, message: 'Car successfully updated', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null });
  }
});


app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));