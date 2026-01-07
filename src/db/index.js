const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'bot_detection',
  port: 5432,
  // If you set a password, add it here: password: 'your_password'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};