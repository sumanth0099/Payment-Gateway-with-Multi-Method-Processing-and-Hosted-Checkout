import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    getDashboardStats()
      .then(setData)
      .catch(console.error);
  }, [navigate]);

  if (!data) return <p>Loading...</p>;

  return (
    <div data-test-id="dashboard" style={{ padding: 30 }}>
      {/* API Credentials */}
      <div data-test-id="api-credentials">
        <div>
          <label>API Key</label>
          <span data-test-id="api-key">{data.api_key}</span>
        </div>

        <div>
          <label>API Secret</label>
          <span data-test-id="api-secret">{data.api_secret}</span>
        </div>
      </div>

      <hr />

      {/* Stats */}
      <div data-test-id="stats-container">
        <div data-test-id="total-transactions">
          {data.total_transactions}
        </div>

        <div data-test-id="total-amount">
          ₹{(data.total_amount / 100).toLocaleString("en-IN")}
        </div>

        <div data-test-id="success-rate">
          {data.success_rate}%
        </div>
      </div>
    </div>
  );
}
