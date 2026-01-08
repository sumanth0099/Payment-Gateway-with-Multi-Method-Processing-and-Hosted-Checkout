const axios = require("axios");

const BASE_URL = "http://localhost:8000";

const HEADERS = {
  "X-Api-Key": "key_test_abc123",
  "X-Api-Secret": "secret_test_xyz789",
  "Content-Type": "application/json"
};

let ORDER_ID = null;
let PAYMENT_ID = null;

async function runTests() {
  try {
    console.log("🔹 1. Health Check");
    const health = await axios.get(`${BASE_URL}/health`);
    console.log("✅", health.data);

    console.log("\n🔹 2. Test Merchant Endpoint");
    const testMerchant = await axios.get(`${BASE_URL}/api/v1/test/merchant`);
    console.log("✅", testMerchant.data);

    console.log("\n🔹 3. Create Order");
    const orderRes = await axios.post(
      `${BASE_URL}/api/v1/orders`,
      {
        amount: 50000,
        currency: "INR",
        receipt: "receipt_test_001",
        notes: { customer: "John" }
      },
      { headers: HEADERS }
    );

    ORDER_ID = orderRes.data.id;
    console.log("✅ Order Created:", ORDER_ID);

    console.log("\n🔹 4. Get Order");
    const getOrder = await axios.get(
      `${BASE_URL}/api/v1/orders/${ORDER_ID}`,
      { headers: HEADERS }
    );
    console.log("✅", getOrder.data);

    console.log("\n🔹 5. Create Payment (UPI)");
    const payRes = await axios.post(
      `${BASE_URL}/api/v1/payments`,
      {
        order_id: ORDER_ID,
        method: "upi",
        vpa: "user@paytm"
      },
      { headers: HEADERS }
    );

    PAYMENT_ID = payRes.data.id;
    console.log("✅ Payment Created:", PAYMENT_ID);

    console.log("\n🔹 6. Get Payment");
    const getPay = await axios.get(
      `${BASE_URL}/api/v1/payments/${PAYMENT_ID}`,
      { headers: HEADERS }
    );
    console.log("✅", getPay.data);

    console.log("\n🎉 ALL API TESTS PASSED");

  } catch (err) {
    if (err.response) {
      console.error("❌ API ERROR:", err.response.data);
    } else {
      console.error("❌ ERROR:", err.message);
    }
  }
}

runTests();
