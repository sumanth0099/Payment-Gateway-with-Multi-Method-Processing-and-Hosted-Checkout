const express = require('express');
const app = express();
app.use(express.json());

// Routes
const healthRoutes = require('./routes/health.routes');
app.use('/', healthRoutes);
app.use('/api',require("./routes/order.routes"))
app.use('/api',require("./routes/payment.routes"))
module.exports = app;
