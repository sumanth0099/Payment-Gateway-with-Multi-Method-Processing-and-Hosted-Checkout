const pool = require("../db");

exports.getTransactions = async (req, res) => {
  try {
    const merchantId = "550e8400-e29b-41d4-a716-446655440000";

    const result = await pool.query(
      `SELECT 
         id,
         order_id,
         amount,
         method,
         status,
         created_at
       FROM payments
       WHERE merchant_id = $1
       ORDER BY created_at DESC`,
      [merchantId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
