import { useState } from "react";
import { api, setToken } from "../api/client";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      const form = new URLSearchParams();
      form.append("username", email); // OAuth2PasswordRequestForm uses "username"
      form.append("password", password);

      const data = await api("/auth/login", {
        method: "POST",
        auth: false,
        body: form, // URLSearchParams -> client.js will send form-urlencoded correctly
      });

      setToken(data.access_token);
      navigate("/dashboard");
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <h2>Login</h2>

      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%" }}
        />

        <label style={{ marginTop: 10, display: "block" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%" }}
        />

        {err && <p style={{ color: "red" }}>{err}</p>}

        <button type="submit" style={{ marginTop: 12 }}>
          Login
        </button>
      </form>

      <p style={{ marginTop: 10 }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}