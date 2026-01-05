const express = require("express");

const app = express();

app.get("/hello", (req, res) => {
  res.json({
    ok: true,
    msg: "Hello from origin",
    path: req.path
  });
});

app.use((req, res) => {
  res.json({
    ok: true,
    msg: "Origin received request",
    path: req.path,
    method: req.method
  });
});

app.listen(4000, () => {
  console.log("Origin server listening on http://localhost:4000");
});
