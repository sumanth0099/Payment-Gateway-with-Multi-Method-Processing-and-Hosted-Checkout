const pool = require('../config/db');

async function healthCheck(req, res) {
  let dbStatus = 'disconnected';

  try {
    // Simple DB check
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    console.log(error);
    dbStatus = 'disconnected';
  }

  return res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  healthCheck
};
