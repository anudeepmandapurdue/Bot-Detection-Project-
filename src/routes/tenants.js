const express = require("express");
const { addTenant } = require("../data/tenantStore");
const { listTenants} = require("../data/tenantStore");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        await addTenant(req.body);
        res.status(201).json({ ok: true });
    } catch (err) {
        // Check if the error is a "Unique Violation" (Postgres code 23505)
        if (err.code === '23505') {
            return res.status(409).json({ 
                error: "Tenant ID or API Key already exists" 
            });
        }
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;