//loads express library to create an express app
const express = require("express");
const healthRouter = require("./routes/health");
const eventRouter = require("./routes/event");
const evaluateRouter = require("./routes/evaluate");
const proxyRouter = require("./routes/proxy");
const tenantsRouter = require("./routes/tenants");





function createApp(){
    const app = express();

    app.use(express.json());
    app.locals.ipEvents = new Map();
    app.locals.MAX_EVENTS_PER_IP = 200;
    app.use("/health", healthRouter);
    app.use("/v1/event", eventRouter);
    app.use("/v1/evaluate", evaluateRouter);
    app.use("/proxy", proxyRouter);
    app.use("/v1/tenants", tenantsRouter);

  
    app.use((req, res)=>{
        res.status(404).json({error: "Not Found"})
    });
    app.use((err, req, res, next) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    });

  return app;
}
module.exports = { createApp };