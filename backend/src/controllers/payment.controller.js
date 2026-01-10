const pool = require("../config/db");
const validateVpa = require("../utils/validateVpa");
const luhnCheck = require("../utils/luhnCheck");
const detectCardNetwork = require("../utils/detectCardNetwork");
const validateExpiry = require("../utils/validateExpiry");
const generatePaymentId = require("../utils/generatePaymentId");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

exports.createPayment = async (req, res) => {
  const orderId = req.body.orderid || req.body.order_id;
  const method = req.body.method;
  const vpa = req.body.vpa;
  const card = req.body.card;

  const merchantId = req.merchant.id;

  try {
    if (!orderId) {
      return res.status(400).json({
        error: { code: "BADREQUESTERROR", description: "orderid is required" },
      });
    }

    if (!method) {
      return res.status(400).json({
        error: { code: "BADREQUESTERROR", description: "method is required" },
      });
    }

    /* ---------------- Order validation ---------------- */
    const orderRes = await pool.query(
      `SELECT id, amount, currency, merchant_id
       FROM orders
       WHERE id = $1`,
      [orderId]
    );

    if (orderRes.rowCount === 0 || orderRes.rows[0].merchant_id !== merchantId) {
      return res.status(404).json({
        error: { code: "NOTFOUNDERROR", description: "Order not found" },
      });
    }

    const order = orderRes.rows[0];

    /* ---------------- Method validation ---------------- */
    let cardNetwork = null;
    let cardLast4 = null;

    if (method === "upi") {
      if (!vpa || !validateVpa(vpa)) {
        return res.status(400).json({
          error: { code: "INVALIDVPA", description: "VPA format invalid" },
        });
      }
    } else if (method === "card") {
      if (!card) {
        return res.status(400).json({
          error: { code: "INVALIDCARD", description: "Card details missing" },
        });
      }

      const number = card.number;
      const expiryMonth = card.expirymonth ?? card.expiry_month;
      const expiryYear = card.expiryyear ?? card.expiry_year;

      if (!number) {
        return res.status(400).json({
          error: { code: "INVALIDCARD", description: "Card number is required" },
        });
      }

      if (!luhnCheck(number)) {
        return res.status(400).json({
          error: { code: "INVALIDCARD", description: "Card validation failed" },
        });
      }

      if (!validateExpiry(expiryMonth, expiryYear)) {
        return res.status(400).json({
          error: { code: "EXPIREDCARD", description: "Card expiry date invalid" },
        });
      }

      cardNetwork = detectCardNetwork(number);
      cardLast4 = number.replace(/[\s-]/g, "").slice(-4);
    } else {
      return res.status(400).json({
        error: { code: "BADREQUESTERROR", description: "Invalid payment method" },
      });
    }

    /* ---------------- Payment ID ---------------- */
    let paymentId;
    let exists = true;

    while (exists) {
      paymentId = generatePaymentId();
      const chk = await pool.query("SELECT 1 FROM payments WHERE id = $1", [paymentId]);
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
        cardLast4,
      ]
    );

    const payment = insertRes.rows[0];

    /* ---------------- Processing delay + test mode ---------------- */
    const testMode = process.env.TESTMODE === "true";

    const delay = testMode
    ? parseInt(process.env.TESTPROCESSINGDELAY, 10)
    : Math.floor(Math.random() * 1000) + 2000; // 2–3s
  
  await sleep(delay);
  
    /* ---------------- Success / failure ---------------- */
    let success;

    if (testMode) {
      // default true if not set; false only when explicitly "false"
      success = process.env.TESTPAYMENTSUCCESS !== "false";
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
             error_code='PAYMENTFAILED',
             error_description='Payment processing failed',
             updated_at=NOW()
         WHERE id=$1`,
        [paymentId]
      );
    }

    /* ---------------- Final response ---------------- */
    const response = {
      id: payment.id,
      orderid: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: success ? "success" : "failed",
      createdat: payment.created_at,
    };

    if (method === "upi") response.vpa = payment.vpa;
    if (method === "card") {
      response.cardnetwork = payment.card_network;
      response.cardlast4 = payment.card_last4;
    }

    return res.status(201).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: { code: "INTERNALERROR", description: "Something went wrong" },
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
        error: { code: "NOTFOUNDERROR", description: "Payment not found" },
      });
    }

    const p = result.rows[0];

    const response = {
      id: p.id,
      orderid: p.order_id,
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      status: p.status,
      createdat: p.created_at,
      updatedat: p.updated_at,
    };

    if (p.method === "upi") response.vpa = p.vpa;
    if (p.method === "card") {
      response.cardnetwork = p.card_network;
      response.cardlast4 = p.card_last4;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: { code: "INTERNALERROR", description: "Something went wrong" },
    });
  }
};
