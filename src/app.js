const express = require("express");
const { authenticateTenant } = require("./middleware/authenticate");

const healthRouter = require("./routes/health");
const eventRouter = require("./routes/event");
const evaluateRouter = require("./routes/evaluate");
const proxyRouter = require("./routes/proxy");
const tenantsRouter = require("./routes/tenants");

function createApp() {
  const app = express();
  app.use(express.json());

  // Public Routes
  app.use("/health", healthRouter);
  app.use("/v1/tenants", tenantsRouter); 

  // Protected & Isolated Routes
  app.use("/v1/event", authenticateTenant, eventRouter);
  app.use("/v1/evaluate", authenticateTenant, evaluateRouter);
  app.use("/proxy", authenticateTenant, proxyRouter);

  app.use((req, res) => res.status(404).json({ error: "Not Found" }));
  
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}

module.exports = { createApp };