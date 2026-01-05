const tenantByApiKey = new Map();//easy lookup


function addTenant(tenant){
    if(!tenant || typeof tenant.apiKey !== "string"){
        throw new Error("Invalid Tenant");
    }

    tenantByApiKey.set(tenant.apiKey, tenant);
}   

function getTenantByApiKey(apiKey){
    if(!apiKey){
        return null;
    }
    return tenantByApiKey.get(apiKey) || null; 
}


//demo add tenants

addTenant({
  id: "tenant_1",
  name: "Demo Shop",
  apiKey: "sk_test_shop",
  origin: "http://localhost:4000"
});

addTenant({
  id: "tenant_2",
  name: "Demo API",
  apiKey: "sk_test_api",
  origin: "http://localhost:5000"
});

module.exports = {
  addTenant,
  getTenantByApiKey
};