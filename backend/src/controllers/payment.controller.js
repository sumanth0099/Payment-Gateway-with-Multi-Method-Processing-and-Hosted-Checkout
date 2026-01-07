const pool = require('../config/db');
const validateVpa = require("../utils/validateVpa");
const luhnCheck = require("../utils/luhnCheck");
const detectCardNetwork = require("../utils/detectCardNetwork");
const validateExpiry = require("../utils/validateExpiry");
const generatePaymentId = require("../utils/generatePaymentId");

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

exports.createPayment = async (req, res) => {
  const { order_id, method, vpa, card } = req.body;
  const merchantId = req.merchant.id;

  try {
    /* ---------------- Order validation ---------------- */
    const orderRes = await pool.query(
      `SELECT id, amount, currency, merchant_id
       FROM orders WHERE id = $1`,
      [order_id]
    );

    if (orderRes.rowCount === 0 || orderRes.rows[0].merchant_id !== merchantId) {
      return res.status(404).json({
        error: { code: "NOT_FOUND_ERROR", description: "Order not found" }
      });
    }

    const order = orderRes.rows[0];

    /* ---------------- Method validation ---------------- */
    let cardNetwork = null;
    let cardLast4 = null;

    if (method === "upi") {
      if (!vpa || !validateVpa(vpa)) {
        return res.status(400).json({
          error: { code: "INVALID_VPA", description: "VPA format invalid" }
        });
      }
    }

    else if (method === "card") {
      if (!card) {
        return res.status(400).json({
          error: { code: "INVALID_CARD", description: "Card details missing" }
        });
      }

      const { number, expiry_month, expiry_year } = card;

      if (!luhnCheck(number)) {
        return res.status(400).json({
          error: { code: "INVALID_CARD", description: "Card validation failed" }
        });
      }

      if (!validateExpiry(expiry_month, expiry_year)) {
        return res.status(400).json({
          error: { code: "EXPIRED_CARD", description: "Card expiry date invalid" }
        });
      }

      cardNetwork = detectCardNetwork(number);
      cardLast4 = number.replace(/[\s-]/g, "").slice(-4);
    }

    else {
      return res.status(400).json({
        error: { code: "BAD_REQUEST_ERROR", description: "Invalid payment method" }
      });
    }

    /* ---------------- Payment ID ---------------- */
    let paymentId;
    let exists = true;

    while (exists) {
      paymentId = generatePaymentId();
      const chk = await pool.query(
        "SELECT 1 FROM payments WHERE id = $1",
        [paymentId]
      );
      exists = chk.rowCount > 0;
    }

    /* ---------------- Insert (processing) ---------------- */
    const insertRes = await pool.query(
      `INSERT INTO payments
       (id, order_id, merchant_id, amount, currency, method,
        status, vpa, card_network, card_last4)
       VALUES ($1,$2,$3,$4,$5,$6,'processing',$7,$8,$9)
       RETURNING id, order_id, amount, currency, method,
                 status, vpa, card_network, card_last4, created_at`,
      [
        paymentId,
        order.id,
        merchantId,
        order.amount,
        order.currency,
        method,
        method === "upi" ? vpa : null,
        cardNetwork,
        cardLast4
      ]
    );

    const payment = insertRes.rows[0];

    /* ---------------- Processing delay ---------------- */
    const testMode = process.env.TEST_MODE === "true";

    let delay = testMode
      ? parseInt(process.env.TEST_PROCESSING_DELAY || "1000")
      : Math.floor(Math.random() * 5000) + 5000; // 5–10s

    await sleep(delay);

    /* ---------------- Success / failure ---------------- */
    let success;

    if (testMode) {
      success = process.env.TEST_PAYMENT_SUCCESS !== "false";
    } else {
      const rate = method === "upi" ? 0.9 : 0.95;
      success = Math.random() < rate;
    }

    if (success) {
      await pool.query(
        `UPDATE payments
         SET status='success', updated_at=NOW()
         WHERE id=$1`,
        [paymentId]
      );
    } else {
      await pool.query(
        `UPDATE payments
         SET status='failed',
             error_code='PAYMENT_FAILED',
             error_description='Payment processing failed',
             updated_at=NOW()
         WHERE id=$1`,
        [paymentId]
      );
    }

    /* ---------------- Final response ---------------- */
    return res.status(201).json({
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: success ? "success" : "failed",
      ...(method === "upi" && { vpa: payment.vpa }),
      ...(method === "card" && {
        card_network: payment.card_network,
        card_last4: payment.card_last4
      }),
      created_at: payment.created_at
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", description: "Something went wrong" }
    });
  }
};

exports.getPaymentById = async (req, res) => {
  const { paymentId } = req.params;
  const merchantId = req.merchant.id;

  try {
    const result = await pool.query(
      `SELECT id, order_id, amount, currency, method,
              vpa, card_network, card_last4,
              status, created_at, updated_at
       FROM payments
       WHERE id = $1 AND merchant_id = $2`,
      [paymentId, merchantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Payment not found",
        },
      });
    }

    const p = result.rows[0];

    // Build response dynamically based on method
    const response = {
      id: p.id,
      order_id: p.order_id,
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };

    if (p.method === "upi") {
      response.vpa = p.vpa;
    }

    if (p.method === "card") {
      response.card_network = p.card_network;
      response.card_last4 = p.card_last4;
    }

    return res.status(200).json(response);
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
