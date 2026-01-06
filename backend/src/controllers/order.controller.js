const pool = require('../config/db');
const generateOrderId = require("../utils/generateOrderId");

exports.createOrder = async (req, res) => {
  const { amount, currency = "INR", receipt = null, notes = null } = req.body;

  // Validation
  if (!Number.isInteger(amount) || amount < 100) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "amount must be at least 100",
      },
    });
  }

  const merchantId = req.merchant.id;

  try {
    let orderId;
    let exists = true;

    // ensure uniqueness
    while (exists) {
      orderId = generateOrderId();
      const check = await pool.query(
        "SELECT 1 FROM orders WHERE id = $1",
        [orderId]
      );
      exists = check.rowCount > 0;
    }

    const result = await pool.query(
      `INSERT INTO orders
       (id, merchant_id, amount, currency, receipt, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'created')
       RETURNING id, merchant_id, amount, currency, receipt, notes, status, created_at`,
      [orderId, merchantId, amount, currency, receipt, notes]
    );

    return res.status(201).json(result.rows[0]);
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

exports.getOrderById = async (req, res) => {
    const { orderId } = req.params;
    const merchantId = req.merchant.id;
  
    try {
      const result = await pool.query(
        `SELECT id, merchant_id, amount, currency, receipt, notes,
                status, created_at, updated_at
         FROM orders
         WHERE id = $1 AND merchant_id = $2`,
        [orderId, merchantId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND_ERROR",
            description: "Order not found",
          },
        });
      }
  
      return res.status(200).json(result.rows[0]);
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
  