/**
 * backend/tests/api.test.js
 * Run:
 *   npm i axios
 *   node backend/tests/api.test.js
 */

const axios = require("axios");

const BASE_URL = process.env.BASE_URL || "http://localhost:8000";

// Fallbacks for YOUR current seed (since /test/merchant doesn't return secret)
const FALLBACK_KEY = process.env.API_KEY || "key_test_abc123";
const FALLBACK_SECRET = process.env.API_SECRET || "secret_test_xyz789";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("BASE_URL:", BASE_URL);

  // 1) Health
  console.log("\n1) GET /health");
  const health = await axios.get(`${BASE_URL}/health`);
  console.log("Status:", health.status);
  console.log(health.data);

  // 2) Test merchant (no auth)
  console.log("\n2) GET /api/v1/test/merchant");
  const tm = await axios.get(`${BASE_URL}/api/v1/test/merchant`);
  console.log("Status:", tm.status);
  console.log(tm.data);

  // Key from response OR fallback
  const apiKey =
    tm.data.apikey ||
    tm.data.api_key ||
    tm.data.apiKey ||
    FALLBACK_KEY;

  // Secret from response OR fallback (your endpoint doesn't return it)
  const apiSecret =
    tm.data.apisecret ||
    tm.data.api_secret ||
    tm.data.apiSecret ||
    FALLBACK_SECRET;

  if (!apiKey) throw new Error("Missing apiKey");
  if (!apiSecret) throw new Error("Missing apiSecret");

  const authHeaders = {
    "X-Api-Key": apiKey,
    "X-Api-Secret": apiSecret,
    "Content-Type": "application/json",
  };

  console.log("\nUsing creds:");
  console.log("X-Api-Key:", apiKey);
  console.log("X-Api-Secret:", apiSecret);

  // 3) Create Order (auth)
  console.log("\n3) POST /api/v1/orders");
  const orderResp = await axios.post(
    `${BASE_URL}/api/v1/orders`,
    {
      amount: 50000,
      currency: "INR",
      receipt: "receipt123",
      notes: { customername: "John Doe" },
    },
    { headers: authHeaders }
  );
  console.log("Status:", orderResp.status);
  console.log(orderResp.data);

  const orderId = orderResp.data?.id;
  if (!orderId) throw new Error("ORDER_ID missing in create order response");
  console.log("ORDER_ID =", orderId);

  // 4) Get Order (auth)
  console.log("\n4) GET /api/v1/orders/:orderId");
  const getOrder = await axios.get(`${BASE_URL}/api/v1/orders/${orderId}`, {
    headers: authHeaders,
  });
  console.log("Status:", getOrder.status);
  console.log(getOrder.data);

  // 5) Public Order (optional)
  console.log("\n5) GET /api/v1/orders/:orderId/public");
  try {
    const pubOrder = await axios.get(`${BASE_URL}/api/v1/orders/${orderId}/public`);
    console.log("Status:", pubOrder.status);
    console.log(pubOrder.data);
  } catch (e) {
    console.log("Public order not available:", e.response?.status, e.response?.data || e.message);
  }

  // 6) Create Payment (auth) - UPI
  console.log("\n6) POST /api/v1/payments (UPI)");
  const payResp = await axios.post(
    `${BASE_URL}/api/v1/payments`,
    { orderid: orderId, method: "upi", vpa: "user@paytm" },
    { headers: authHeaders }
  );
  console.log("Status:", payResp.status);
  console.log(payResp.data);

  const paymentId = payResp.data?.id;
  if (!paymentId) throw new Error("PAYMENT_ID missing in create payment response");
  console.log("PAYMENT_ID =", paymentId);

  // 7) Poll payment status (auth)
  console.log("\n7) Poll GET /api/v1/payments/:paymentId");
  for (let i = 1; i <= 10; i++) {
    await sleep(2000);
    const p = await axios.get(`${BASE_URL}/api/v1/payments/${paymentId}`, {
      headers: authHeaders,
    });
    console.log(`Poll ${i}/10:`, p.data?.status);

    if (p.data?.status === "success" || p.data?.status === "failed") {
      console.log("Final payment response:");
      console.log(p.data);
      break;
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nTEST FAILED");
  console.error(err.response?.status, err.response?.data || err.message);
  process.exit(1);
});
