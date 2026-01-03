//loads express library to create an express app
const express = require("express");
const healthRouter = require("./routes/health");
const eventRouter = require("./routes/event");

function createApp(){
    const app = express();

    app.use(express.json());
    app.use("/health", healthRouter);
    app.use("/v1/event", eventRouter);
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