const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const merchantAuth = require("../middlewares/merchantAuth");

const { getTestMerchant } = require("../controllers/test.controller");
const { createOrder, getOrderById } = require("../controllers/order.controller");

/**
 * AUTHENTICATED (merchant APIs)
 */
router.post("/orders", merchantAuth, createOrder);
router.get("/orders/:orderId", merchantAuth, getOrderById);

/**
 * TEST endpoint (no auth)
 */
router.get("/test/merchant", getTestMerchant);

/**
 * PUBLIC (checkout) endpoint (no auth)
 * Checkout page must fetch order details without API key/secret. [file:1]
 *
 * GET /api/v1/orders/:orderId/public
 * Return only basic info: id, amount, currency, status [file:1]
 */
router.get("/orders/:orderId/public", async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, amount, currency, status
       FROM orders
       WHERE id = $1`,
      [orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: { code: "NOTFOUNDERROR", description: "Order not found" },
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Public get order error:", err);
    return res.status(500).json({
      error: { code: "INTERNALERROR", description: "Something went wrong" },
    });
  }
});

module.exports = router;
