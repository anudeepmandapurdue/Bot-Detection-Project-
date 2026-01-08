const db = require('../db');

//recieves tenant by their api key from postgres
async function getTenantByApiKey(apiKey){

    const query = 'SELECT id, name, origin FROM tenants WHERE api_key = $1';
    const result = await db.query(query, [apiKey])
    return result.rows[0] || null;
}   

async function addTenant({id, name, apiKey, origin}){
    const query = `
      INSERT INTO tenants (id, name, api_key, origin)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(query, [id, name, apiKey, origin]);
}


//demo add tenants

async function listTenants() {
    const result = await db.query('SELECT id, name, origin FROM tenants');
    return result.rows;

}


module.exports = {
  addTenant,
  getTenantByApiKey, 
  listTenants
};