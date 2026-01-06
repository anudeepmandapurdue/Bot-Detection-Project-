const { getTenantByApiKey } = require("../data/tenantStore");

// Fix the spelling here to "authenticateTenant"
const authenticateTenant = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
        return res.status(401).json({ 
            error: "Missing API Key", 
            message: "Please provide your key in the 'x-api-key' header." 
        });
    }

    const tenant = getTenantByApiKey(apiKey);
    if (!tenant) {
        return res.status(401).json({
            error: "Invalid API key",
            message: "The provided api key does not match with a registered tenant"
        });
    }
    req.tenant = tenant; 
    next();
};

// Ensure this export name matches what you use in app.js
module.exports = { authenticateTenant };