const db = require("../db");
const { get } = require("../routes/proxy");

async function updateGlobalReputation(ip, increment = 10){
    const query = `
        INSERT INTO ip_reputation (ip, global_score, last_seen)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (ip) DO UPDATE SET
            global_score = ip_reputation.global_score + $2, 
            last_seen = CURRENT_TIMESTAMP; 

    `;

    await db.query(query, [ip, increment]);
}

async function getGlobalScore(ip){
    const query = 'SELECT global_score FROM ip_reputation WHERE ip = $1';
    const result = await db.query(query, [ip]);
    return result.rows[0]?.global_score || 0;
}

module.exports = { updateGlobalReputation, getGlobalScore };