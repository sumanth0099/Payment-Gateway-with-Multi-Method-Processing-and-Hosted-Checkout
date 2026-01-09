import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getTransactions } from "../api";
import "./Transactions.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    getTransactions()
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>Transactions</h1>
        <Link to="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="table-container">
        <table data-test-id="transactions-table" className="transactions-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                data-test-id="transaction-row"
                data-payment-id={tx.id}
                className={`transaction-row ${tx.status}`}
              >
                <td data-test-id="payment-id" className="payment-id">
                  <code>{tx.id}</code>
                </td>
                <td data-test-id="order-id">{tx.order_id}</td>
                <td data-test-id="amount" className="amount">
                  ₹{(tx.amount / 100).toLocaleString("en-IN")}
                </td>
                <td data-test-id="method" className="method">
                  <span className={`method-badge ${tx.method}`}>
                    {tx.method.toUpperCase()}
                  </span>
                </td>
                <td data-test-id="status" className="status">
                  <span className={`status-badge ${tx.status}`}>
                    {tx.status.toUpperCase()}
                  </span>
                </td>
                <td data-test-id="created-at">
                  {new Date(tx.created_at).toLocaleString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">
                  No transactions yet. Create some orders to see payments here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
