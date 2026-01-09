import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderid");
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  // Fetch order details (public endpoint)
  useEffect(() => {
    if (!orderId) {
      setPaymentResult({ error: "Order ID required" });
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/api/v1/orders/${orderId}/public`) // Public endpoint
      .then((res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then(setOrder)
      .catch((err) => {
        console.error(err);
        setPaymentResult({ error: "Order not found" });
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setPaymentResult(null);

    const paymentData = {
      orderid: orderId,
      method: paymentMethod,
    };

    if (paymentMethod === "upi") {
      paymentData.vpa = e.target.vpa.value;
    } else {
      paymentData.card = {
        number: e.target["card-number"].value.replace(/\s/g, ""),
        expirymonth: parseInt(e.target["expiry-month"].value),
        expiryyear: parseInt(e.target["expiry-year"].value),
        cvv: e.target.cvv.value,
        holdername: e.target["holder-name"].value,
      };
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/payments/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!res.ok) {
        const error = await res.json();
        setPaymentResult({ error: error.error.description });
        return;
      }

      const payment = await res.json();
      setPaymentId(payment.id);

      // Poll payment status every 2s
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(
          `http://localhost:8000/api/v1/payments/${payment.id}/public`
        );
        const statusData = await statusRes.json();

        if (statusData.status === "success" || statusData.status === "failed") {
          clearInterval(pollInterval);
          setPaymentResult(statusData);
          setProcessing(false);
        }
      }, 2000);

      // Clear poll after 30s timeout
      setTimeout(() => {
        clearInterval(pollInterval);
        setProcessing(false);
      }, 30000);
    } catch (err) {
      setPaymentResult({ error: "Payment request failed" });
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading order...</div>;
  }

  if (!order) {
    return <div className="error">Invalid order</div>;
  }

  return (
    <div data-test-id="checkout-container" className="checkout-container">
      {/* Order Summary */}
      <div data-test-id="order-summary" className="order-summary">
        <h2>Complete Payment</h2>
        <div>
          <span>Amount: </span>
          <strong data-test-id="order-amount">
            ₹{(order.amount / 100).toLocaleString("en-IN")}
          </strong>
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
          className={`method-btn ${paymentMethod === "upi" ? "active" : ""}`}
          onClick={() => setPaymentMethod("upi")}
          disabled={processing}
        >
          UPI
        </button>
        <button
          data-test-id="method-card"
          data-method="card"
          className={`method-btn ${paymentMethod === "card" ? "active" : ""}`}
          onClick={() => setPaymentMethod("card")}
          disabled={processing}
        >
          Card
        </button>
      </div>

      {/* Payment Forms */}
      <form data-test-id="upi-form" className={paymentMethod !== "upi" ? "hidden" : ""}>
        <div className="input-group">
          <input
            data-test-id="vpa-input"
            name="vpa"
            placeholder="username@paytm"
            type="text"
            required
            disabled={processing}
          />
        </div>
        <button
          data-test-id="pay-button"
          type="submit"
          className="pay-button"
          onClick={handlePayment}
          disabled={processing}
        >
          Pay ₹{(order.amount / 100).toLocaleString("en-IN")}
        </button>
      </form>

      <form data-test-id="card-form" className={paymentMethod !== "card" ? "hidden" : ""}>
        <div className="input-group">
          <input
            data-test-id="card-number-input"
            name="card-number"
            placeholder="4111 1111 1111 1111"
            type="text"
            maxLength="19"
            required
            disabled={processing}
          />
        </div>
        <div className="expiry-cvv">
          <input
            data-test-id="expiry-input"
            name="expiry-month"
            placeholder="MM"
            type="text"
            maxLength="2"
            style={{ width: "60px" }}
            required
            disabled={processing}
          />
          <span>/</span>
          <input
            name="expiry-year"
            placeholder="YY"
            type="text"
            maxLength="4"
            style={{ width: "60px" }}
            required
            disabled={processing}
          />
          <input
            data-test-id="cvv-input"
            name="cvv"
            placeholder="CVV"
            type="text"
            maxLength="4"
            style={{ width: "80px", marginLeft: "auto" }}
            required
            disabled={processing}
          />
        </div>
        <div className="input-group">
          <input
            data-test-id="cardholder-name-input"
            name="holder-name"
            placeholder="Name on Card"
            type="text"
            required
            disabled={processing}
          />
        </div>
        <button
          data-test-id="pay-button"
          type="submit"
          className="pay-button"
          onClick={handlePayment}
          disabled={processing}
        >
          Pay ₹{(order.amount / 100).toLocaleString("en-IN")}
        </button>
      </form>

      {/* Processing State */}
      {processing && (
        <div data-test-id="processing-state" className="processing-state">
          <div className="spinner"></div>
          <span data-test-id="processing-message">Processing payment...</span>
        </div>
      )}

      {/* Success State */}
      {paymentResult?.status === "success" && (
        <div data-test-id="success-state" className="result-state success">
          <h2>✅ Payment Successful!</h2>
          <div>
            <span>Payment ID: </span>
            <strong data-test-id="payment-id">{paymentId}</strong>
          </div>
          <p data-test-id="success-message">
            Your payment has been processed successfully
          </p>
        </div>
      )}

      {/* Error State */}
      {(paymentResult?.error || paymentResult?.status === "failed") && (
        <div data-test-id="error-state" className="result-state error">
          <h2>❌ Payment Failed</h2>
          <p data-test-id="error-message">
            {paymentResult?.error || "Payment could not be processed"}
          </p>
          <button 
            data-test-id="retry-button" 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
