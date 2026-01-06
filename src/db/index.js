const { Pool } = require("pg");

const pool = new Pool({
    host: 'localhost';
    database: 'bot_detection';
    port: 5432,
});

module.exports = {
    query: (text, params) = pool.qeury(text, params),
}