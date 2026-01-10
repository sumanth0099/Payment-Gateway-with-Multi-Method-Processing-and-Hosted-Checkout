const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const merchantAuth = require("../middlewares/merchantAuth");

const {
  createPayment,
  getPaymentById,
} = require("../controllers/payment.controller");

/**
 * AUTHENTICATED (merchant APIs)
 */
router.post("/payments", merchantAuth, createPayment);
router.get("/payments/:paymentId", merchantAuth, getPaymentById);

/**
 * PUBLIC (checkout APIs) - no auth headers
 * Required because checkout page makes unauthenticated calls and polls status. [file:1]
 */

// POST /api/v1/payments/public
router.post("/payments/public", async (req, res, next) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        error: { code: "BADREQUESTERROR", description: "order_id is required" },
      });
    }

    // Find the merchant for this order and “attach” it so we can reuse createPayment controller
    const orderRes = await pool.query(
      "SELECT merchant_id FROM orders WHERE id = $1",
      [order_id]
    );

    if (orderRes.rowCount === 0) {
      return res.status(404).json({
        error: { code: "NOTFOUNDERROR", description: "Order not found" },
      });
    }

    req.merchant = { id: orderRes.rows[0].merchant_id };
    return createPayment(req, res, next);
  } catch (err) {
    console.error("Public create payment error:", err);
    return res.status(500).json({
      error: { code: "INTERNALERROR", description: "Something went wrong" },
    });
  }
});

// GET /api/v1/payments/:paymentId/public
router.get("/payments/:paymentId/public", async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    // Find merchant_id for this payment and “attach” it so we can reuse getPaymentById controller
    const payRes = await pool.query(
      "SELECT merchant_id FROM payments WHERE id = $1",
      [paymentId]
    );

    if (payRes.rowCount === 0) {
      return res.status(404).json({
        error: { code: "NOTFOUNDERROR", description: "Payment not found" },
      });
    }

    req.merchant = { id: payRes.rows[0].merchant_id };
    return getPaymentById(req, res, next);
  } catch (err) {
    console.error("Public get payment error:", err);
    return res.status(500).json({
      error: { code: "INTERNALERROR", description: "Something went wrong" },
    });
  }
});

module.exports = router;
