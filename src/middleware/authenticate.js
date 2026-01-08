const { getTenantByApiKey } = require("../data/tenantStore");

// We add 'async' so we can use 'await' inside
const authenticateTenant = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  
  if (!apiKey) {
    return res.status(401).json({ error: "Missing API Key" });
  }

  try {
    // We 'await' the database response
    const tenant = await getTenantByApiKey(apiKey);

    if (!tenant) {
      return res.status(401).json({ error: "Invalid API Key" });
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    console.error("Database Auth Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { authenticateTenant };