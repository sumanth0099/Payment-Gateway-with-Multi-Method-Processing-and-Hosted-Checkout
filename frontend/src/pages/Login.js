import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // not validated
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Only email is checked as per requirement
    if (email !== "test@example.com") {
      setError("Invalid email");
      return;
    }

    // password can be anything
    localStorage.setItem("loggedIn", "true");
    navigate("/dashboard");
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto" }}>
      <h2>Merchant Login</h2>

      <form data-test-id="login-form" onSubmit={handleSubmit}>
        <input
          data-test-id="email-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          data-test-id="password-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button data-test-id="login-button" type="submit">
          Login
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
