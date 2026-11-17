
const express = require("express");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();

app.use(express.json());

app.use("/tickets", ticketRoutes);

module.exports = app;
