import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((r) => r.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch((e) => setStatus("Error: " + e.message));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Splitwise Clone</h1>
      <p>Backend says: {status}</p>
    </div>
  );
}