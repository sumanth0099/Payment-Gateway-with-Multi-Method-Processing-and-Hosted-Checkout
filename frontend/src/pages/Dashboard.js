import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTestMerchant } from "../api";

export default function Dashboard() {
  const [merchant, setMerchant] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    getTestMerchant()
      .then(setMerchant)
      .catch(() => setError("Failed to load merchant"));
  }, [navigate]);

  if (error) return <p>{error}</p>;
  if (!merchant) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "50px auto" }}>
      <h2>Merchant Dashboard</h2>

      <h3>API Credentials</h3>
      <p><strong>ID:</strong> {merchant.id}</p>
      <p><strong>Email:</strong> {merchant.email}</p>
      <p><strong>API Key:</strong> {merchant.api_key}</p>
      <p><strong>Seeded:</strong> {merchant.seeded ? "Yes" : "No"}</p>
    </div>
  );
}
