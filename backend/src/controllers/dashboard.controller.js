const pool = require("../db");

exports.getDashboardStats = async (req, res) => {
  try {
    const merchantId = "550e8400-e29b-41d4-a716-446655440000";

    const paymentsResult = await pool.query(
      `SELECT 
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'success') AS success_count,
         COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) AS total_amount
       FROM payments
       WHERE merchant_id = $1`,
      [merchantId]
    );

    const row = paymentsResult.rows[0];

    const total = Number(row.total);
    const success = Number(row.success_count);
    const totalAmount = Number(row.total_amount);

    const successRate =
      total === 0 ? 0 : Math.round((success / total) * 100);

    // test merchant credentials
    const merchantResult = await pool.query(
      `SELECT api_key, api_secret FROM merchants WHERE id = $1`,
      [merchantId]
    );

    const merchant = merchantResult.rows[0];

    res.json({
      api_key: merchant.api_key,
      api_secret: merchant.api_secret,
      total_transactions: total,
      total_amount: totalAmount,
      success_rate: successRate,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
};
