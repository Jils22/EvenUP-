import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { getGroup, addMember } from "../api/groups";
import { listMembers } from "../api/members";
import { listExpenses, createExpense, getBalances } from "../api/expenses";
import { getActivity } from "../api/activity";
import { getExpense } from "../api/expensedetails";
import { updateExpense, deleteExpense } from "../api/expenseMutations";
import {
  createSettlement,
  updateSettlement,
  deleteSettlement,
  listSettlements,
} from "../api/settlements";

import ActivityFeed from "../components/ActivityFeed";
import "./group.css";

function money(minor) {
  return (Number(minor || 0) / 100).toFixed(2);
}

export default function Group() {
  const { id } = useParams();
  const groupId = id;

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState([]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Add expense form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [participants, setParticipants] = useState([]);

  // Split type + maps
  const [splitType, setSplitType] = useState("equal"); // equal|exact|percent
  const [exactMap, setExactMap] = useState({});
  const [percentMap, setPercentMap] = useState({});

  // Settle up form
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  // Settlements list + drawer state
  const [settlements, setSettlements] = useState([]);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [selectedSettlementId, setSelectedSettlementId] = useState("");
  const [isEditingSettlement, setIsEditingSettlement] = useState(false);

  // Expense drawer state
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState("");

  // ===== Edit expense =====
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editSplitType, setEditSplitType] = useState("equal");

  const [editParticipants, setEditParticipants] = useState([]);
  const [editExactMap, setEditExactMap] = useState({});
  const [editPercentMap, setEditPercentMap] = useState({});

  // ===== Edit settlement =====
  const [editingSettlementId, setEditingSettlementId] = useState("");
  const [editSetFrom, setEditSetFrom] = useState("");
  const [editSetTo, setEditSetTo] = useState("");
  const [editSetAmount, setEditSetAmount] = useState("");

  // ===== Section refs =====
  const expensesRef = useRef(null);
  const settlementsRef = useRef(null);
  const activityRef = useRef(null);

  function scrollTo(ref) {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const memberById = useMemo(() => {
    const m = new Map();
    for (const u of members) m.set(u.id, u);
    return m;
  }, [members]);

  function nameOf(userId) {
    return memberById.get(userId)?.name ?? `User#${userId}`;
  }

  function owesLines(expense) {
    if (!expense) return [];
    const payer = expense.paid_by;
    const splits = expense.splits ?? [];
    return splits
      .filter((s) => s.user_id !== payer && (s.share_minor ?? 0) > 0)
      .map((s) => ({ from: s.user_id, to: payer, amount_minor: s.share_minor }));
  }

  function parseNum(v) {
    const s = String(v ?? "").replace(/,/g, "").trim();
    if (!s) return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function toMinor(rupees) {
    return Math.round(Number(rupees) * 100);
  }

  // ===== Drawer close helpers =====
  function resetExpenseEditState() {
    setIsEditing(false);
    setEditTitle("");
    setEditAmount("");
    setEditSplitType("equal");
    setEditParticipants([]);
    setEditExactMap({});
    setEditPercentMap({});
  }

  function resetSettlementEditState() {
    setIsEditingSettlement(false);
    setEditingSettlementId("");
    setEditSetFrom("");
    setEditSetTo("");
    setEditSetAmount("");
  }

  function closeExpenseDrawer() {
    setSelectedExpense(null);
    setSelectedExpenseId("");
    resetExpenseEditState();
  }

  function closeSettlementDrawer() {
    setSelectedSettlement(null);
    setSelectedSettlementId("");
    resetSettlementEditState();
  }

  // ===== Open helpers (ensure only one drawer open) =====
  async function openExpense(expenseId) {
    setErr("");
    setMsg("");
    closeSettlementDrawer(); // only one drawer at a time

    try {
      const data = await getExpense(groupId, expenseId);
      setSelectedExpenseId(expenseId);
      setSelectedExpense(data);
      resetExpenseEditState();
    } catch (e) {
      setErr(e?.message ?? String(e));
    }
  }

  function openSettlement(settlementId) {
    setErr("");
    setMsg("");
    closeExpenseDrawer(); // only one drawer at a time

    setSelectedSettlementId(settlementId);
    const s = settlements.find((x) => x.id === settlementId) || null;
    setSelectedSettlement(s);
    resetSettlementEditState();
  }

  function startEditFromSelectedSettlement() {
    if (!selectedSettlement) return;

    setErr("");
    setMsg("");

    setIsEditingSettlement(true);
    setEditingSettlementId(selectedSettlement.id);
    setEditSetFrom(String(selectedSettlement.from_user_id));
    setEditSetTo(String(selectedSettlement.to_user_id));
    setEditSetAmount((selectedSettlement.amount_minor / 100).toFixed(2));
  }

  function ensurePayerIncluded(list, payerId) {
    const pid = String(payerId);
    return list.includes(pid) ? list : [...list, pid];
  }

  function toggleInList(list, uid) {
    const id = String(uid);
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  async function saveSettlementEdit() {
    if (!editingSettlementId) return;

    setErr("");
    setMsg("");

    const amt = parseNum(editSetAmount);
    if (!editSetFrom || !editSetTo) return setErr("Select from/to users");
    if (editSetFrom === editSetTo) return setErr("From and To cannot be same");
    if (!Number.isFinite(amt) || amt <= 0) return setErr("Amount must be > 0");

    const sid = editingSettlementId;

    try {
      await updateSettlement(groupId, sid, {
        from_user_id: String(editSetFrom),
        to_user_id: String(editSetTo),
        amount: amt,
      });

      setMsg("Settlement updated ✅");
      resetSettlementEditState();

      await refreshAll();

      // keep drawer open & show latest
      setSelectedSettlementId(sid);
      const latest = (settlements ?? []).find((x) => x.id === sid) || null;
      setSelectedSettlement(latest);
    } catch (e) {
      setErr(e?.message ?? String(e));
    }
  }

  async function onDeleteSettlement(settlementId) {
    const ok = window.confirm("Delete this settlement? This cannot be undone.");
    if (!ok) return;

    setErr("");
    setMsg("");

    try {
      await deleteSettlement(groupId, settlementId);

      if (selectedSettlementId === settlementId) closeSettlementDrawer();

      setMsg("Settlement deleted ✅");
      await refreshAll();
    } catch (e) {
      setErr(e?.message ?? String(e));
    }
  }

  // ===== Refresh all =====
  async function refreshAll() {
    setErr("");

    const [g, mem, exp, bal, act, sets] = await Promise.all([
      getGroup(groupId),
      listMembers(groupId),
      listExpenses(groupId),
      getBalances(groupId),
      getActivity(groupId),
      listSettlements(groupId),
    ]);

    const actItems = Array.isArray(act) ? act : act?.items ?? [];

    setGroup(g);
    setMembers(mem);
    setExpenses(exp);
    setBalances(bal);
    setActivity(actItems);
    setSettlements(sets ?? []);

    // defaults
    if (!paidBy && mem.length > 0) setPaidBy(String(mem[0].id));
    if (participants.length === 0 && mem.length > 0) setParticipants(mem.map((u) => String(u.id)));

    if (bal?.transfers?.length > 0) {
      const t = bal.transfers[0];
      setSettleFrom(String(t.from_user_id));
      setSettleTo(String(t.to_user_id));
      setSettleAmount((t.amount_minor / 100).toFixed(2));
    }

    // keep settlement drawer in sync
    if (selectedSettlementId) {
      const latestSet = (sets ?? []).find((x) => x.id === selectedSettlementId) || null;
      setSelectedSettlement(latestSet);
      if (!latestSet) closeSettlementDrawer();
    }

    // keep expense drawer in sync
    if (selectedExpenseId) {
      try {
        const latestExp = await getExpense(groupId, selectedExpenseId);
        setSelectedExpense(latestExp);
      } catch {
        closeExpenseDrawer();
      }
    }
  }

  useEffect(() => {
    if (members.length === 0) return;
    // safest default: everyone selected
    const all = members.map((u) => String(u.id));
    setParticipants((prev) => ensurePayerIncluded(all, paidBy));
  }, [splitType, members]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!paidBy) return;
    setParticipants((prev) => ensurePayerIncluded((prev || []).map(String), paidBy));
  }, [paidBy]);

  useEffect(() => {
    refreshAll().catch((e) => setErr(e?.message ?? String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // lock scroll when any drawer open
  useEffect(() => {
    const open = Boolean(selectedExpense || selectedSettlement);
    document.body.classList.toggle("modalOpen", open);
    return () => document.body.classList.remove("modalOpen");
  }, [selectedExpense, selectedSettlement]);

  // ===== Member =====
  async function onAddMember(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setErr("Please enter a valid email address");
      return;
    }

    try {
      await addMember(groupId, email);
      setMsg("Member added!");
      setInviteEmail("");
      await refreshAll();
    } catch (e2) {
      setErr(e2?.message ?? String(e2));
    }
  }

  // ===== Add expense helpers =====
  function toggleParticipant(uid) {
    const id = String(uid);
    setParticipants((prev) => {
      const next = toggleInList(prev.map(String), id);
      return ensurePayerIncluded(next, paidBy);
    });
  }

  function toggleEditParticipant(uid) {
    const id = String(uid);
    const payerId = String(selectedExpense?.paid_by || "");
    setEditParticipants((prev) => {
      const next = toggleInList(prev.map(String), id);
      return ensurePayerIncluded(next, payerId);
    });
  }

  function startEditFromSelected() {
    if (!selectedExpense) return;

    setIsEditing(true);
    setErr("");
    setMsg("");

    setEditTitle(selectedExpense.title || "");
    setEditAmount((selectedExpense.amount_minor / 100).toFixed(2));

    const st = selectedExpense.split_type || "equal";
    setEditSplitType(st);

    setEditParticipants([]);
    setEditExactMap({});
    setEditPercentMap({});

    const splits = selectedExpense.splits || [];

    setEditParticipants(splits.map((s) => s.user_id));

    if (st === "equal") {
      setEditParticipants(splits.map((s) => s.user_id));
    } else if (st === "exact") {
      const m = {};
      for (const s of splits) m[s.user_id] = (s.share_minor / 100).toFixed(2);
      setEditExactMap(m);
    } else {
      const amtMinor = selectedExpense.amount_minor || 0;
      if (amtMinor > 0 && splits.length > 0) {
        const pMap = {};
        let sum = 0;

        for (let i = 0; i < splits.length; i++) {
          const s = splits[i];
          let pct = (s.share_minor / amtMinor) * 100;
          pct = Math.round(pct * 100) / 100;
          pMap[s.user_id] = pct.toFixed(2);
          sum += pct;
        }

        const lastId = splits[splits.length - 1].user_id;
        const diff = Math.round((100 - sum) * 100) / 100;
        pMap[lastId] = (Number(pMap[lastId]) + diff).toFixed(2);

        setEditPercentMap(pMap);
      }
    }
  }

  async function saveEdit() {
    if (!selectedExpenseId || !selectedExpense) return;

    setErr("");
    setMsg("");

    const amt = parseNum(editAmount);
    const st = String(editSplitType || "equal").toLowerCase();
    const payerId = String(selectedExpense.paid_by);

    if (!editTitle.trim()) return setErr("Title is required");
    if (!Number.isFinite(amt) || amt <= 0) return setErr("Amount must be > 0");

    const selected = editParticipants.map(String);

    // ✅ For ALL split types, enforce subset rules
    if (selected.length < 2) return setErr("Select at least 2 participants");
    if (!selected.includes(payerId)) return setErr("Payer must be included in participants");

    const payload = { title: editTitle.trim(), amount: amt, split_type: st };

    try {
      if (st === "equal") {
        payload.participant_user_ids = selected;
      } else if (st === "exact") {
        const splits = selected.map((user_id) => {
          const v = editExactMap[user_id];
          const n = parseNum(v);
          return { user_id, amount: Number.isFinite(n) ? n : 0 };
        });

        const positiveCount = splits.filter((s) => s.amount > 0).length;
        if (positiveCount === 0) return setErr("At least one split amount must be > 0");

        const amtMinor = toMinor(amt);
        const sumMinor = splits.reduce((acc, s) => acc + toMinor(s.amount), 0);

        if (sumMinor !== amtMinor) {
          return setErr(
            `Exact split total must equal ₹${amt.toFixed(2)} (got ₹${(sumMinor / 100).toFixed(2)})`
          );
        }

        payload.splits = splits;
      } else if (st === "percent") {
        const percents = selected.map((user_id) => {
          const v = editPercentMap[user_id];
          const n = parseNum(v);
          return { user_id, percent: Number.isFinite(n) ? n : 0 };
        });

        const positiveCount = percents.filter((p) => p.percent > 0).length;
        if (positiveCount === 0) return setErr("At least one percent must be > 0");

        const sumP = percents.reduce((acc, p) => acc + p.percent, 0);
        if (Math.abs(sumP - 100) > 0.01) return setErr(`Percents must total 100 (got ${sumP.toFixed(2)})`);

        payload.percents = percents;
      } else {
        return setErr("Invalid split type");
      }

      await updateExpense(groupId, selectedExpenseId, payload);

      setMsg("Expense updated ✅");
      setIsEditing(false);

      await refreshAll();
      await openExpense(selectedExpenseId);
    } catch (e2) {
      setErr(e2?.message ?? String(e2));
    }
  }

  async function onDeleteSelectedExpense() {
    if (!selectedExpenseId) return;

    const ok = window.confirm("Delete this expense? This cannot be undone.");
    if (!ok) return;

    setErr("");
    setMsg("");

    try {
      await deleteExpense(groupId, selectedExpenseId);
      setMsg("Expense deleted ✅");
      closeExpenseDrawer();
      await refreshAll();
    } catch (e2) {
      setErr(e2?.message ?? String(e2));
    }
  }

  async function onAddExpense(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const amt = parseNum(amount);
    const payerId = String(paidBy);

    if (!title.trim()) return setErr("Title is required");
    if (!Number.isFinite(amt) || amt <= 0) return setErr("Amount must be > 0");
    if (!payerId) return setErr("Select who paid");

    const selected = participants.map(String);

    if (selected.length < 2) return setErr("Select at least 2 participants");
    if (!selected.includes(payerId)) return setErr("Payer must be included in participants");

    try {
      if (splitType === "equal") {
        await createExpense(groupId, {
          title: title.trim(),
          amount: amt,
          paid_by_user_id: payerId,
          participant_user_ids: selected,
          split_type: "equal",
        });
      } else if (splitType === "exact") {
        // ✅ Use ONLY selected participants; allow 0
        const splits = selected.map((user_id) => {
          const v = exactMap[user_id];
          const n = parseNum(v);
          return { user_id, amount: Number.isFinite(n) ? n : 0 };
        });

        const positiveCount = splits.filter((s) => s.amount > 0).length;
        if (positiveCount === 0) return setErr("At least one split amount must be > 0");

        const amtMinor = toMinor(amt);
        const sumMinor = splits.reduce((acc, s) => acc + toMinor(s.amount), 0);

        if (sumMinor !== amtMinor) {
          return setErr(
            `Exact split total must equal ₹${amt.toFixed(2)} (got ₹${(sumMinor / 100).toFixed(2)})`
          );
        }

        await createExpense(groupId, {
          title: title.trim(),
          amount: amt,
          paid_by_user_id: payerId,
          split_type: "exact",
          splits,
        });
      } else if (splitType === "percent") {
        // ✅ Use ONLY selected participants; allow 0
        const percents = selected.map((user_id) => {
          const v = percentMap[user_id];
          const n = parseNum(v);
          return { user_id, percent: Number.isFinite(n) ? n : 0 };
        });

        const positiveCount = percents.filter((p) => p.percent > 0).length;
        if (positiveCount === 0) return setErr("At least one percent must be > 0");

        const sumP = percents.reduce((a, s) => a + s.percent, 0);
        if (Math.abs(sumP - 100) > 0.01) {
          return setErr(`Percents must total 100 (got ${sumP.toFixed(2)})`);
        }

        await createExpense(groupId, {
          title: title.trim(),
          amount: amt,
          paid_by_user_id: payerId,
          split_type: "percent",
          percents,
        });
      } else {
        return setErr("Invalid split type");
      }

      setMsg("Expense added!");
      setTitle("");
      setAmount("");
      setExactMap({});
      setPercentMap({});
      setSplitType("equal");

      await refreshAll();
    } catch (e2) {
      setErr(e2?.message ?? String(e2));
    }
  }

  // ===== Render =====
  if (err && !group) return <div style={{ padding: 20 }}>Error: {err}</div>;
  if (!group) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div className="gp">
      <div className="gp-header">
        <div className="gp-title">
          <h2>{group.name}</h2>
          <p>Group ID: {group.id}</p>
        </div>

        <div className="btnRow">
          <button
            type="button"
            className="btn"
            onClick={() => refreshAll().catch((e2) => setErr(e2?.message ?? String(e2)))}
          >
            Refresh
          </button>
        </div>
      </div>

      {msg && <div className="gp-alert gp-alert--ok">{msg}</div>}
      {err && <div className="gp-alert gp-alert--err">{err}</div>}

      {/* Sticky Section Navigation */}
      <div className="gp-stickyNav">
        <div className="btnRow" style={{ marginBottom: 10 }}>
          <button type="button" className="btn" onClick={() => scrollTo(expensesRef)}>
            Expenses
          </button>
          <button type="button" className="btn" onClick={() => scrollTo(settlementsRef)}>
            Settlements
          </button>
          <button type="button" className="btn" onClick={() => scrollTo(activityRef)}>
            Activity
          </button>
        </div>
      </div>

      <div className="gp-grid">
        {/* LEFT */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Expenses */}
          <div className="card" ref={expensesRef}>
            <h3>Expenses</h3>

            {expenses.length === 0 ? (
              <p className="card-muted">No expenses yet.</p>
            ) : (
              <ul className="listPlain" style={{ display: "grid", gap: 10 }}>
                {expenses.map((e) => (
                  <li
                    key={e.id}
                    className={`rowItem ${e.id === selectedExpenseId ? "rowItem--active" : ""}`}
                    onClick={() => openExpense(e.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{e.title}</div>
                      <div className="small">
                        paid by {memberById.get(e.paid_by)?.name ?? `User#${e.paid_by}`}
                      </div>
                    </div>
                    <div className="mono" style={{ fontWeight: 800 }}>
                      ₹{money(e.amount_minor)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Settlements */}
          <div className="card" ref={settlementsRef}>
            <h3>Settlements</h3>

            {settlements.length === 0 ? (
              <p className="card-muted">No settlements yet.</p>
            ) : (
              <ul className="listPlain" style={{ display: "grid", gap: 10 }}>
                {settlements.map((s) => (
                  <li
                    key={s.id}
                    className={`rowItem ${s.id === selectedSettlementId ? "rowItem--active" : ""}`}
                    onClick={() => openSettlement(s.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {nameOf(s.from_user_id)} paid {nameOf(s.to_user_id)}
                      </div>
                      <div className="small">Settlement</div>
                    </div>
                    <div className="mono" style={{ fontWeight: 800 }}>
                      ₹{money(s.amount_minor)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activity */}
          <div className="card" ref={activityRef}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Activity</h3>
              <button
                type="button"
                className="btn"
                onClick={() => refreshAll().catch((e2) => setErr(e2?.message ?? String(e2)))}
              >
                Refresh
              </button>
            </div>

            <ActivityFeed
              activity={activity}
              memberById={memberById}
              nameOf={nameOf}
              onOpenExpense={(expenseId) => openExpense(expenseId)}
              onOpenSettlement={(settlementId) => openSettlement(settlementId)}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Members */}
          <div className="card">
            <h3>Members</h3>

            <ul className="listPlain" style={{ display: "grid", gap: 8 }}>
              {members.map((u) => (
                <li key={u.id} className="rowItem" style={{ cursor: "default" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{u.name}</div>
                    <div className="small">{u.email}</div>
                  </div>
                  <div className="small mono">#{u.id}</div>
                </li>
              ))}
            </ul>

            <div className="hr" />

            <h4>Add member</h4>
            <form onSubmit={onAddMember}>
              <input
                className="input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@email.com"
              />
              <button type="submit" className="btn btn--primary" style={{ marginTop: 10 }}>
                Add Member
              </button>
            </form>
          </div>

          {/* Add Expense */}
          <div className="card">
            <h3>Add Expense</h3>

            <form onSubmit={onAddExpense}>
              <label className="label">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

              <label className="label">Amount (₹)</label>
              <input
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 1200"
              />

              <label className="label">Paid by</label>
              <select className="select" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {members.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <label className="label">Split type</label>
              <select className="select" value={splitType} onChange={(e) => setSplitType(e.target.value)}>
                <option value="equal">Equal</option>
                <option value="exact">Exact</option>
                <option value="percent">Percent</option>
              </select>

              <label className="label">
                {splitType === "equal"
                  ? "Split among"
                  : splitType === "exact"
                  ? "Exact split amounts (₹)"
                  : "Percent split (%)"}
              </label>

              <div style={{ border: "1px solid #eee", padding: 10, borderRadius: 12 }}>
                {members.map((u) => (
                  <div key={u.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    {splitType === "equal" ? (
                      <>
                        <input
                          type="checkbox"
                          checked={participants.includes(u.id)}
                          onChange={() => toggleParticipant(u.id)}
                        />
                        <span>
                          {u.name} <span className="small">({u.email})</span>
                        </span>
                      </>
                    ) : splitType === "exact" ? (
                      <>
                        <span style={{ flex: 1 }}>
                          {u.name} <span className="small">({u.email})</span>
                        </span>
                        <input
                          className="input"
                          style={{ width: 160 }}
                          inputMode="decimal"
                          placeholder="e.g. 400"
                          value={exactMap[u.id] ?? ""}
                          onChange={(e) => setExactMap((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        />
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1 }}>
                          {u.name} <span className="small">({u.email})</span>
                        </span>
                        <input
                          className="input"
                          style={{ width: 160 }}
                          inputMode="decimal"
                          placeholder="e.g. 25"
                          value={percentMap[u.id] ?? ""}
                          onChange={(e) => setPercentMap((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn--primary" style={{ marginTop: 12 }}>
                Add Expense
              </button>
            </form>
          </div>

          {/* Balances */}
          <div className="card">
            <h3>Balances</h3>
            {!balances ? (
              <p className="card-muted">Loading balances…</p>
            ) : balances.transfers.length === 0 ? (
              <p>All settled 🎉</p>
            ) : (
              <ul className="list">
                {balances.transfers.map((t, idx) => (
                  <li key={idx}>
                    {nameOf(t.from_user_id)} owes {nameOf(t.to_user_id)} <b>₹{money(t.amount_minor)}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Settle Up */}
          <div className="card">
            <h3>Settle Up</h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErr("");
                setMsg("");

                const amt = parseNum(settleAmount);
                if (!settleFrom || !settleTo) return setErr("Select from/to users");
                if (!Number.isFinite(amt) || amt <= 0) return setErr("Amount must be > 0");
                if (settleFrom === settleTo) return setErr("From and To cannot be same");

                try {
                  await createSettlement(groupId, {
                    from_user_id: settleFrom,
                    to_user_id: settleTo,
                    amount: amt,
                  });
                  setMsg("Settlement recorded!");
                  await refreshAll();
                } catch (e2) {
                  setErr(e2?.message ?? String(e2));
                }
              }}
            >
              <label className="label">From (payer)</label>
              <select className="select" value={settleFrom} onChange={(e) => setSettleFrom(e.target.value)}>
                {members.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <label className="label">To (receiver)</label>
              <select className="select" value={settleTo} onChange={(e) => setSettleTo(e.target.value)}>
                {members.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <label className="label">Amount (₹)</label>
              <input
                className="input"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                inputMode="decimal"
              />

              <button type="submit" className="btn btn--primary" style={{ marginTop: 12 }}>
                Record Payment
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ===== Expense Drawer ===== */}
      {selectedExpense && (
        <div className="drawerOverlay" onClick={(e) => e.target === e.currentTarget && closeExpenseDrawer()}>
          <div className="drawer" role="dialog" aria-modal="true">
            <div className="drawerHeader">
              <h4 className="drawerTitle">Expense Details</h4>
              <button type="button" className="drawerClose" onClick={closeExpenseDrawer}>
                Close ✕
              </button>
            </div>

            <div className="drawerBody">
              {!isEditing ? (
                <>
                  <p>
                    <b>{selectedExpense.title}</b> — ₹{money(selectedExpense.amount_minor)}
                  </p>
                  <p>
                    Paid by: {memberById.get(selectedExpense.paid_by)?.name ?? `User#${selectedExpense.paid_by}`}
                  </p>
                  <p>Split type: {selectedExpense.split_type}</p>

                  <h4 style={{ marginTop: 10 }}>Who owes whom</h4>
                  {(() => {
                    const lines = owesLines(selectedExpense);
                    if (lines.length === 0) return <p className="card-muted">Everyone is settled for this expense.</p>;
                    return (
                      <ul className="list">
                        {lines.map((l) => (
                          <li key={`${l.from}->${l.to}`}>
                            <b>{nameOf(l.from)}</b> owes <b>{nameOf(l.to)}</b> ₹{money(l.amount_minor)}
                          </li>
                        ))}
                      </ul>
                    );
                  })()}

                  <div className="hr" />

                  <h4>Split breakdown</h4>
                  {selectedExpense.splits?.length ? (
                    <ul className="list">
                      {selectedExpense.splits.map((s) => (
                        <li key={s.user_id}>
                          {nameOf(s.user_id)} share: ₹{money(s.share_minor)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="card-muted">No splits found.</p>
                  )}

                  <div className="btnRow" style={{ marginTop: 10 }}>
                    <button type="button" className="btn btn--primary" onClick={startEditFromSelected}>
                      Edit
                    </button>
                    <button type="button" className="btn btn--danger" onClick={onDeleteSelectedExpense}>
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h4>Edit Expense</h4>

                  <label className="label">Title</label>
                  <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />

                  <label className="label">Amount (₹)</label>
                  <input
                    className="input"
                    inputMode="decimal"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />

                  <label className="label">Split type</label>
                  <select className="select" value={editSplitType} onChange={(e) => setEditSplitType(e.target.value)}>
                    <option value="equal">Equal</option>
                    <option value="exact">Exact</option>
                    <option value="percent">Percent</option>
                  </select>

                  <label className="label">
                    {editSplitType === "equal"
                      ? "Split among"
                      : editSplitType === "exact"
                      ? "Exact split amounts (₹)"
                      : "Percent split (%)"}
                  </label>

                  <div style={{ border: "1px solid #eee", padding: 10, borderRadius: 12 }}>
                    {members.map((u) => (
                      <div key={u.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        {editSplitType === "equal" ? (
                          <>
                            <input
                              type="checkbox"
                              checked={editParticipants.includes(u.id)}
                              onChange={() => toggleEditParticipant(u.id)}
                            />
                            <span>
                              {u.name} ({u.email})
                            </span>
                          </>
                        ) : editSplitType === "exact" ? (
                          <>
                            <span style={{ flex: 1 }}>
                              {u.name} ({u.email})
                            </span>
                            <input
                              className="input"
                              style={{ width: 160 }}
                              inputMode="decimal"
                              placeholder="e.g. 400"
                              value={editExactMap[u.id] ?? ""}
                              onChange={(e) => setEditExactMap((prev) => ({ ...prev, [u.id]: e.target.value }))}
                            />
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1 }}>
                              {u.name} ({u.email})
                            </span>
                            <input
                              className="input"
                              style={{ width: 160 }}
                              inputMode="decimal"
                              placeholder="e.g. 25"
                              value={editPercentMap[u.id] ?? ""}
                              onChange={(e) => setEditPercentMap((prev) => ({ ...prev, [u.id]: e.target.value }))}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="btnRow" style={{ marginTop: 10 }}>
                    <button type="button" className="btn btn--primary" onClick={saveEdit}>
                      Save
                    </button>
                    <button type="button" className="btn" onClick={resetExpenseEditState}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Settlement Drawer ===== */}
      {selectedSettlement && (
        <div className="drawerOverlay" onClick={(e) => e.target === e.currentTarget && closeSettlementDrawer()}>
          <div className="drawer" role="dialog" aria-modal="true">
            <div className="drawerHeader">
              <h4 className="drawerTitle">Settlement Details</h4>
              <button type="button" className="drawerClose" onClick={closeSettlementDrawer}>
                Close ✕
              </button>
            </div>

            <div className="drawerBody">
              {!isEditingSettlement ? (
                <>
                  <p>
                    <b>{nameOf(selectedSettlement.from_user_id)}</b> paid{" "}
                    <b>{nameOf(selectedSettlement.to_user_id)}</b> ₹{money(selectedSettlement.amount_minor)}
                  </p>

                  <div className="btnRow" style={{ marginTop: 10 }}>
                    <button type="button" className="btn btn--primary" onClick={startEditFromSelectedSettlement}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => onDeleteSettlement(selectedSettlement.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h4>Edit Settlement</h4>

                  <label className="label">From</label>
                  <select className="select" value={editSetFrom} onChange={(e) => setEditSetFrom(e.target.value)}>
                    {members.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>

                  <label className="label">To</label>
                  <select className="select" value={editSetTo} onChange={(e) => setEditSetTo(e.target.value)}>
                    {members.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>

                  <label className="label">Amount (₹)</label>
                  <input
                    className="input"
                    value={editSetAmount}
                    onChange={(e) => setEditSetAmount(e.target.value)}
                    inputMode="decimal"
                  />

                  <div className="btnRow" style={{ marginTop: 10 }}>
                    <button type="button" className="btn btn--primary" onClick={saveSettlementEdit}>
                      Save
                    </button>
                    <button type="button" className="btn" onClick={resetSettlementEditState}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}