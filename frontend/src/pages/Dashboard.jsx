import { useEffect, useState } from "react";
import { api, clearToken } from "../api/client";
import { listGroups } from "../api/groups";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [groups, setGroups] = useState([]);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api("/users/me")
      .then(setMe)
      .catch((e) => setErr(e.message));

    listGroups()
      .then(setGroups)
      .catch((e) => setErr(e.message));
  }, []);

  function logout() {
    clearToken();
    navigate("/login");
  }

  if (err) return <div style={{ padding: 20 }}>Error: {err}</div>;
  if (!me) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <p>Logged in as: {me.name} ({me.email})</p>
      <button onClick={logout}>Logout</button>

      <hr />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Your Groups</h3>
        <Link to="/groups/new">+ Create Group</Link>
      </div>

      {groups.length === 0 ? (
        <p>No groups yet.</p>
      ) : (
        <ul>
          {groups.map((g) => (
            <li key={g.id}>
              <Link to={`/groups/${g.id}`}>{g.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}