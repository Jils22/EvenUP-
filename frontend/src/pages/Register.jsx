import { useState } from "react";
import { api } from "../api/client";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await api("/auth/register", {
        method: "POST",
        auth: false,
        body: { name, email, password },
      });
      navigate("/login");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
        <label style={{ marginTop: 10, display: "block" }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
        <label style={{ marginTop: 10, display: "block" }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} />
        {err && <p style={{ color: "red" }}>{err}</p>}
        <button type="submit" style={{ marginTop: 12 }}>Create account</button>
      </form>
      <p style={{ marginTop: 10 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}