import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Checkout.css";

const API_BASE = "http://localhost:8000";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderid");

  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const [paymentId, setPaymentId] = useState(null);

  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  const clearPollers = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollIntervalRef.current = null;
    pollTimeoutRef.current = null;
  };

  // Fetch order details (public endpoint)
  useEffect(() => {
    let ignore = false;

    const run = async () => {
      if (!orderId) {
        if (!ignore) {
          setPaymentResult({ error: "Order ID required" });
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/public`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        if (!ignore) setOrder(data);
      } catch (e) {
        if (!ignore) setPaymentResult({ error: "Order not found" });
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
      clearPollers();
    };
  }, [orderId]);

  const pollPaymentStatus = (payId) => {
    clearPollers();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`${API_BASE}/api/v1/payments/${payId}/public`);
        if (!statusRes.ok) return;

        const statusData = await statusRes.json();

        if (statusData.status === "success" || statusData.status === "failed") {
          clearPollers();
          setPaymentResult(statusData);
          setProcessing(false);
        }
      } catch (err) {
        // ignore polling errors; next poll will retry
      }
    }, 2000); // poll every 2 seconds (required) [file:1]

    pollTimeoutRef.current = setTimeout(() => {
      clearPollers();
      setProcessing(false);
      setPaymentResult({ error: "Payment status timeout. Please try again." });
    }, 30000);
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!orderId) {
      setPaymentResult({ error: "Order ID required" });
      return;
    }

    setProcessing(true);
    setPaymentResult(null);

    const formData = new FormData(e.target);

    // ✅ FIX: send order_id (backend expects) + orderid (spec expects)
    const paymentData = {
      order_id: orderId,
      orderid: orderId,
      method: paymentMethod,
    };

    if (paymentMethod === "upi") {
      paymentData.vpa = (formData.get("vpa") || "").trim();
    } else {
      const expiry = (formData.get("expiry") || "").trim(); // "MMYY"
      const expirymonth = parseInt(expiry.slice(0, 2), 10); 
      let expiryyear = parseInt(expiry.slice(2, 4), 10);
if (expiryyear < 100) expiryyear += 2000; // 27 -> 2027 (spec)


      paymentData.card = {
        number: (formData.get("card-number") || "").replace(/\s|-/g, ""),
        expirymonth,
        expiryyear,
        cvv: (formData.get("cvv") || "").trim(),
        holdername: (formData.get("holder-name") || "").trim(),
      };
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/payments/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!res.ok) {
        let errJson = null;
        try {
          errJson = await res.json();
        } catch {
          // ignore
        }
        setPaymentResult({
          error: errJson?.error?.description || "Payment failed",
        });
        setProcessing(false);
        return;
      }

      const payment = await res.json();
      setPaymentId(payment.id);

      // Show processing state and poll until success/failed [file:1]
      pollPaymentStatus(payment.id);
    } catch (err) {
      setPaymentResult({ error: "Payment request failed" });
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading">Loading order...</div>;
  if (!order) return <div className="error">Invalid order</div>;

  const amountDisplay = (order.amount / 100).toFixed(2); // example format 500.00 [file:1]
  const payText = `Pay ${amountDisplay}`;

  return (
    <div data-test-id="checkout-container" className="checkout-container">
      {/* Order Summary */}
      <div data-test-id="order-summary" className="order-summary">
        <h2>Complete Payment</h2>
        <div>
          <span>Amount: </span>
          <span data-test-id="order-amount">{amountDisplay}</span>
        </div>
        <div>
          <span>Order ID: </span>
          <span data-test-id="order-id">{order.id}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div data-test-id="payment-methods" className="payment-methods">
        <button
          data-test-id="method-upi"
          data-method="upi"
          type="button"
          onClick={() => setPaymentMethod("upi")}
          disabled={processing}
        >
          UPI
        </button>
        <button
          data-test-id="method-card"
          data-method="card"
          type="button"
          onClick={() => setPaymentMethod("card")}
          disabled={processing}
        >
          Card
        </button>
      </div>

      {/* UPI Payment Form */}
      <form
        data-test-id="upi-form"
        style={{ display: paymentMethod === "upi" ? "block" : "none" }}
        onSubmit={handlePayment}
      >
        <input
          data-test-id="vpa-input"
          name="vpa"
          placeholder="username@bank"
          type="text"
          required
          disabled={processing}
        />
        <button data-test-id="pay-button" type="submit" disabled={processing}>
          {payText}
        </button>
      </form>

      {/* Card Payment Form */}
      <form
        data-test-id="card-form"
        style={{ display: paymentMethod === "card" ? "block" : "none" }}
        onSubmit={handlePayment}
      >
        <input
          data-test-id="card-number-input"
          name="card-number"
          placeholder="Card Number"
          type="text"
          required
          disabled={processing}
        />

        {/* REQUIRED: single expiry input with MMYY placeholder [file:1] */}
        <input
          data-test-id="expiry-input"
          name="expiry"
          placeholder="MMYY"
          type="text"
          maxLength="4"
          pattern="[0-9]{4}"
          required
          disabled={processing}
        />

        <input
          data-test-id="cvv-input"
          name="cvv"
          placeholder="CVV"
          type="text"
          maxLength="4"
          pattern="[0-9]{3,4}"
          required
          disabled={processing}
        />

        <input
          data-test-id="cardholder-name-input"
          name="holder-name"
          placeholder="Name on Card"
          type="text"
          required
          disabled={processing}
        />

        <button data-test-id="pay-button" type="submit" disabled={processing}>
          {payText}
        </button>
      </form>

      {/* Processing State */}
      {processing && (
        <div data-test-id="processing-state" style={{ display: "block" }}>
          <div className="spinner"></div>
          <span data-test-id="processing-message">Processing payment...</span>
        </div>
      )}

      {/* Success State */}
      {paymentResult?.status === "success" && (
        <div data-test-id="success-state" style={{ display: "block" }}>
          <h2>Payment Successful!</h2>
          <div>
            <span>Payment ID: </span>
            <span data-test-id="payment-id">{paymentId}</span>
          </div>
          <span data-test-id="success-message">
            Your payment has been processed successfully
          </span>
        </div>
      )}

      {/* Error State */}
      {(paymentResult?.error || paymentResult?.status === "failed") && (
        <div data-test-id="error-state" style={{ display: "block" }}>
          <h2>Payment Failed</h2>
          <span data-test-id="error-message">
            {paymentResult?.error ||
              paymentResult?.errordescription ||
              "Payment could not be processed"}
          </span>
          <button
            data-test-id="retry-button"
            type="button"
            onClick={() => window.location.reload()}
            disabled={processing}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
