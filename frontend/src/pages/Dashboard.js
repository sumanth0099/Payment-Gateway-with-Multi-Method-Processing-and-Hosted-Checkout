import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    getDashboardStats()
      .then((stats) => {
        setData(stats);
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
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="dashboard-container" data-test-id="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Merchant Dashboard</h1>
        <Link to="/dashboard/transactions" className="transactions-link">
          View Transactions →
        </Link>
      </div>

      {/* API Credentials */}
      <div className="credentials-card" data-test-id="api-credentials">
        <h3>API Credentials</h3>
        <div className="credential-item">
          <label>API Key</label>
          <code data-test-id="api-key" className="api-value">
            {data.api_key}
          </code>
          <button 
            className="copy-btn" 
            onClick={() => navigator.clipboard.writeText(data.api_key)}
            title="Copy to clipboard"
          >
            📋
          </button>
        </div>
        <div className="credential-item">
          <label>API Secret</label>
          <code data-test-id="api-secret" className="api-value">
            {data.api_secret}
          </code>
          <button 
            className="copy-btn" 
            onClick={() => navigator.clipboard.writeText(data.api_secret)}
            title="Copy to clipboard"
          >
            📋
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-container" data-test-id="stats-container">
        <div className="stat-card total-transactions" data-test-id="total-transactions">
          <div className="stat-number">{data.total_transactions}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        <div className="stat-card total-amount" data-test-id="total-amount">
          <div className="stat-number">₹{(data.total_amount / 100).toLocaleString("en-IN")}</div>
          <div className="stat-label">Total Amount</div>
        </div>
        <div className="stat-card success-rate" data-test-id="success-rate">
          <div className="stat-number">{data.success_rate}%</div>
          <div className="stat-label">Success Rate</div>
        </div>
      </div>
    </div>
  );
}
