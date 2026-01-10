// routes/test.routes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // adjust if your db file path/name differs

// GET /api/v1/test/merchant (no auth) [file:1]
router.get("/test/merchant", async (req, res) => {
  try {
    // Evaluator expects this test merchant to exist [file:1]
    const result = await pool.query(
        "SELECT id, email, api_key, api_secret FROM merchants WHERE email = $1 LIMIT 1",
        ["test@example.com"]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: { code: "NOTFOUNDERROR", description: "Test merchant not found" },
      });
    }

    const m = result.rows[0];
    return res.status(200).json({
        id: m.id,
        email: m.email,
        apikey: m.api_key,
        apisecret: m.api_secret,
        seeded: true,
      });      
  } catch (err) {
    console.error("test merchant error:", err);
    return res.status(500).json({
      error: { code: "INTERNALERROR", description: "Something went wrong" },
    });
  }
});

module.exports = router;
