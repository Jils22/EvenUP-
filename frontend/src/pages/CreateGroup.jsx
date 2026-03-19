import { useState } from "react";
import { createGroup } from "../api/groups";
import { useNavigate } from "react-router-dom";

export default function CreateGroup() {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const g = await createGroup(name);
      navigate(`/groups/${g.id}`);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <h2>Create Group</h2>
      <form onSubmit={onSubmit}>
        <label>Group name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
        {err && <p style={{ color: "red" }}>{err}</p>}
        <button type="submit" style={{ marginTop: 12 }}>Create</button>
      </form>
    </div>
  );
}