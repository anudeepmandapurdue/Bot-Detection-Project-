const express = require("express");
const { addTenant } = require("../data/tenantStore");
const { listTenants} = require("../data/tenantStore");
const router = express.Router();

router.post("/", (req, res) =>{
    const { id, name, apiKey, origin} = req.body;
    if (!id || !name || !apiKey || !origin) {
    return res.status(400).json({
      error: "Missing required tenant fields"
    });
  }

  addTenant({id, name, apiKey, origin});

  res.status(201).json({
    ok: true,
    tenant: {id, name, origin}
  });
});

router.get("/", (req, res) => {
  res.json({
    tenants: listTenants()
  });
});


module.exports = router;