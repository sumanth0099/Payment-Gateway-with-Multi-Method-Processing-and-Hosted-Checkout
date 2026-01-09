const express = require('express');
const cors = require('cors'); // Add CORS for frontend
const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Dashboard + Checkout
    credentials: true
  }));
  
app.use(express.json({ limit: '10mb' })); // Handle larger payloads

// Routes - FIXED order matters!
app.use('/', require('./routes/health.routes'));           // /health
app.use('/api/v1', require('./routes/order.routes'));     // /api/v1/orders  
app.use('/api/v1', require('./routes/payment.routes'));   // /api/v1/payments
app.use('/api/v1', require('./routes/test.routes'));      // /api/v1/test/merchant
app.use('/api/v1', require('./routes/dashboard.routes')); // /api/v1/dashboard (for frontend)
app.use('/api/v1', require('./routes/transactions.routes'));

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND_ERROR", description: "Endpoint not found" }
  });
});

module.exports = app;
