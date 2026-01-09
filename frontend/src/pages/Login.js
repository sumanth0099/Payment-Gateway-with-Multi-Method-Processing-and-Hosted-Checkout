import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Exact test creds per spec
    if (email !== "test@example.com") {
      setError("Invalid email. Use test@example.com");
      setLoading(false);
      return;
    }

    // Password anything ✓
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("merchantEmail", email);
    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Merchant Dashboard</h2>
        <p className="login-subtitle">Sign in with test credentials</p>

        <form data-test-id="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              data-test-id="email-input"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <input
              data-test-id="password-input"
              type="password"
              placeholder="Any password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            data-test-id="login-button" 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="login-hint">
          <small>Email: test@example.com | Password: anything</small>
        </div>
      </div>
    </div>
  );
}
