const pool = require('../config/db');
exports.getTestMerchant = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, api_key
       FROM merchants
       WHERE id = '550e8400-e29b-41d4-a716-446655440000'`
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Test merchant not found",
        },
      });
    }

    const merchant = result.rows[0];

    return res.status(200).json({
      id: merchant.id,
      email: merchant.email,
      api_key: merchant.api_key,
      seeded: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Something went wrong",
      },
    });
  }
};
