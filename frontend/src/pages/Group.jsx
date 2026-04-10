import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  CreditCard,
  Utensils,
  Plane,
  Home,
  ShoppingBag,
  Film,
  Bus,
  FileText,
  Tag,
  CheckCircle,
  Camera,
  Sparkles,
  Loader2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Undo2,
  ShieldAlert,
} from "lucide-react";

import { groupsApi as groupsApi_raw } from "../api/groupsApi";
import { expensesApi as expensesApi_raw } from "../api/expensesApi";
import { approvalsApi } from "../api/approvalsApi";
import { getActivity } from "../api/activityApi";
import {
  createSettlement,
  updateSettlement,
  deleteSettlement,
  listSettlements,
} from "../api/settlementsApi";

const groupsApi = groupsApi_raw;
const expensesApi = expensesApi_raw;

import ActivityFeed from "../components/ActivityFeed";
import { cn } from "../lib/utils";
import "./group.css";

const CATEGORY_ICONS = {
  food: <Utensils size={16} />,
  travel: <Plane size={16} />,
  rent: <Home size={16} />,
  shopping: <ShoppingBag size={16} />,
  entertainment: <Film size={16} />,
  transport: <Bus size={16} />,
  bills: <FileText size={16} />,
  other: <Tag size={16} />,
};

function money(minor) {
  return (Number(minor || 0) / 100).toFixed(2);
}

export default function Group() {
  const { id } = useParams();
  const groupId = id;
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? "";
  const toast = useToast();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState([]);

  const [inviteEmail, setInviteEmail] = useState("");

  // ── Consensus / Pending Expenses ─────────────────────────────────────────
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [votingId, setVotingId] = useState(null); // tracks which card is in-flight

  async function fetchPending() {
    try {
      const data = await approvalsApi.getPending(groupId);
      setPendingExpenses(Array.isArray(data) ? data : []);
    } catch {
      // non-fatal — group might have 0 pending expenses
    }
  }

  async function onApprove(expenseId) {
    setVotingId(expenseId);
    try {
      await approvalsApi.approve(groupId, expenseId);
      toast.success("Approved! ✅");
      await Promise.all([fetchPending(), refreshAll()]);
    } catch (e) {
      toast.error(e?.message ?? String(e));
    } finally {
      setVotingId(null);
    }
  }

  async function onReject(expenseId) {
    if (!window.confirm("Reject this expense? This will flag it as rejected for everyone.")) return;
    setVotingId(expenseId);
    try {
      await approvalsApi.reject(groupId, expenseId);
      toast.success("Expense rejected.");
      await Promise.all([fetchPending(), refreshAll()]);
    } catch (e) {
      toast.error(e?.message ?? String(e));
    } finally {
      setVotingId(null);
    }
  }

  async function onWithdraw(expenseId) {
    if (!window.confirm("Withdraw this pending expense? It will be cancelled.")) return;
    setVotingId(expenseId);
    try {
      await approvalsApi.withdraw(groupId, expenseId);
      toast.success("Expense withdrawn.");
      await fetchPending();
    } catch (e) {
      toast.error(e?.message ?? String(e));
    } finally {
      setVotingId(null);
    }
  }

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [scanning, setScanning] = useState(false);

  // Add expense form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [participants, setParticipants] = useState([]);
  const [category, setCategory] = useState("");

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
  const [editCategory, setEditCategory] = useState("");

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
    setEditCategory("");
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
      const data = await expensesApi.getExpense(groupId, expenseId);
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

    const amt = parseNum(editSetAmount);
    if (!editSetFrom || !editSetTo) return toast.error("Select from/to users");
    if (editSetFrom === editSetTo) return toast.error("From and To cannot be same");
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Amount must be > 0");

    const sid = editingSettlementId;

    try {
      await updateSettlement(groupId, sid, {
        from_user_id: String(editSetFrom),
        to_user_id: String(editSetTo),
        amount: amt,
      });

      toast.success("Settlement updated ✅");
      resetSettlementEditState();

      await refreshAll();

      // keep drawer open & show latest
      setSelectedSettlementId(sid);
      const latest = (settlements ?? []).find((x) => x.id === sid) || null;
      setSelectedSettlement(latest);
    } catch (e) {
      toast.error(e?.message ?? String(e));
    }
  }

  async function onDeleteSettlement(settlementId) {
    const ok = window.confirm("Delete this settlement? This cannot be undone.");
    if (!ok) return;

    try {
      await deleteSettlement(groupId, settlementId);

      if (selectedSettlementId === settlementId) closeSettlementDrawer();

      toast.success("Settlement deleted ✅");
      await refreshAll();
    } catch (e) {
      toast.error(e?.message ?? String(e));
    }
  }

  // ===== Refresh all =====
  async function refreshAll() {

    const [g, mem, exp, bal, act, sets] = await Promise.all([
      groupsApi.getGroup(groupId),
      groupsApi.listMembers(groupId),
      expensesApi.getGroupExpenses(groupId),
      expensesApi.getBalances(groupId),
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
        const latestExp = await expensesApi.getExpense(groupId, selectedExpenseId);
        setSelectedExpense(latestExp);
      } catch {
        closeExpenseDrawer();
      }
    }

    // Refresh pending expenses panel in parallel
    fetchPending();
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
    refreshAll().catch((e) => toast.error(e?.message ?? String(e)));
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

    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await groupsApi.addMember(groupId, email);
      toast.success("Member added!");
      setInviteEmail("");
      await refreshAll();
    } catch (e2) {
      toast.error(e2?.message ?? String(e2));
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

    const splits = selectedExpense.splits || [];
    setEditParticipants(splits.map((s) => s.user_id));
    setEditCategory(selectedExpense.category || "");

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

    const amt = parseNum(editAmount);
    const st = String(editSplitType || "equal").toLowerCase();
    const payerId = String(selectedExpense.paid_by);

    if (!editTitle.trim()) return toast.error("Title is required");
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Amount must be > 0");

    const selected = editParticipants.map(String);

    // For ALL split types, enforce subset rules
    if (selected.length < 2) return toast.error("Select at least 2 participants");
    if (!selected.includes(payerId)) return toast.error("Payer must be included in participants");

    const payload = {
      title: editTitle.trim(),
      amount: amt,
      split_type: st,
      category: editCategory || undefined,
    };

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
        if (positiveCount === 0) return toast.error("At least one split amount must be > 0");

        const amtMinor = toMinor(amt);
        const sumMinor = splits.reduce((acc, s) => acc + toMinor(s.amount), 0);

        if (sumMinor !== amtMinor) {
          return toast.error(
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
        if (positiveCount === 0) return toast.error("At least one percent must be > 0");

        const sumP = percents.reduce((acc, p) => acc + p.percent, 0);
        if (Math.abs(sumP - 100) > 0.01) return toast.error(`Percents must total 100 (got ${sumP.toFixed(2)})`);

        payload.percents = percents;
      } else {
        return toast.error("Invalid split type");
      }

      await expensesApi.updateExpense(groupId, selectedExpenseId, payload);

      toast.success("Expense updated ✅");
      setIsEditing(false);

      await refreshAll();
      await openExpense(selectedExpenseId);
    } catch (e2) {
      toast.error(e2?.message ?? String(e2));
    }
  }

  async function onDeleteSelectedExpense() {
    if (!selectedExpenseId) return;

    const ok = window.confirm("Delete this expense? This cannot be undone.");
    if (!ok) return;

    try {
      await expensesApi.deleteExpense(groupId, selectedExpenseId);
      toast.success("Expense deleted ✅");
      closeExpenseDrawer();
      await refreshAll();
    } catch (e2) {
      toast.error(e2?.message ?? String(e2));
    }
  }

  async function onAddExpense(e) {
    e.preventDefault();

    const amt = parseNum(amount);
    const payerId = String(paidBy);

    if (!title.trim()) return toast.error("Title is required");
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("Amount must be > 0");
    if (!payerId) return toast.error("Select who paid");

    const selected = participants.map(String);

    if (selected.length < 2) return toast.error("Select at least 2 participants");
    if (!selected.includes(payerId)) return toast.error("Payer must be included in partici    try {
      let payload = {
        title: title.trim(),
        amount: amt,
        paidBy: payerId,
        splitType: splitType,
        category: category || undefined,
      };

      if (splitType === "equal") {
        payload.participants = selected.map(uid => ({ userId: uid }));
      } else if (splitType === "exact") {
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
        payload.splits = splits;
        payload.participants = selected.map(uid => ({ userId: uid }));
      } else if (splitType === "percent") {
        const percents = selected.map((user_id) => {
          const v = percentMap[user_id];
          const n = parseNum(v);
          return { user_id, percent: Number.isFinite(n) ? n : 0 };
        });

        const positiveCount = percents.filter((p) => p.percent > 0).length;
        if (positiveCount === 0) return toast.error("At least one percent must be > 0");

        const sumP = percents.reduce((a, s) => a + s.percent, 0);
        if (Math.abs(sumP - 100) > 0.01) {
          return toast.error(`Percents must total 100 (got ${sumP.toFixed(2)})`);
        }
        payload.percents = percents;
        payload.participants = selected.map(uid => ({ userId: uid }));
      }

      await expensesApi.createExpense(groupId, payload);
        });
      } else {
        return toast.error("Invalid split type");
      }

      toast.success("Expense added! 🎉");
      setTitle("");
      setAmount("");
      setExactMap({});
      setPercentMap({});
      setSplitType("equal");
      setCategory("");

      await refreshAll();
    } catch (e2) {
      toast.error(e2?.message ?? String(e2));
    }
  }

  async function onSmartScan() {
    setScanning(true);
    toast.info("Scanning receipt... 📸");
    
    // Mocking the AI processing time
    await new Promise(r => setTimeout(r, 2000));
    
    setTitle("Dinner at Olive Garden 🇮🇹");
    setAmount("2450.00");
    setCategory("food");
    setScanning(false);
    toast.success("Receipt scanned! Details filled. ✨");
  }

  // ===== Render =====
  if (!group) return <div style={{ padding: 20 }}>Loading...</div>;

  // Compute current user's net balance in minor units
  const myNetMinor = currentUserId && balances?.net ? (balances.net[currentUserId] ?? 0) : 0;

  return (
    <div className="gp">
      <div className="gp-header">
        <div className="gp-title">
          <Link to="/groups" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 4 }}>← Groups</Link>
          <h2>{group.name}</h2>
          <p>Group ID: {group.id}</p>
        </div>

        <div className="btnRow">
          <button
            type="button"
            className="btn"
            onClick={async () => {
              try {
                await refreshAll();
                toast.success("Data refreshed!");
              } catch(e) {
                toast.error(e?.message ?? String(e));
              }
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={async () => {
              try {
                const blob = await expensesApi.exportExpenses(groupId);
                const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `${group?.name || 'group'}_expenses.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success('CSV exported! 📊');
              } catch (e) {
                toast.error('Export failed: ' + (e?.message || String(e)));
              }
            }}
          >
            Export CSV
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
          {/* ── Pending Expenses (Consensus Panel) ───────────────────────────── */}
          {pendingExpenses.length > 0 && (
            <div className="card tilt-card" style={{
              border: "1px solid rgba(251,191,36,0.4)",
              background: "linear-gradient(135deg, rgba(120,53,15,0.25) 0%, rgba(161,98,7,0.12) 100%)",
              marginBottom: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <ShieldAlert size={18} color="#fbbf24" />
                <h3 style={{ margin: 0, color: "#fde68a" }}>Pending Approval</h3>
                <span style={{
                  background: "rgba(251,191,36,0.2)",
                  border: "1px solid rgba(251,191,36,0.4)",
                  color: "#fbbf24",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                }}>
                  {pendingExpenses.length}
                </span>
              </div>
              <p className="small" style={{ opacity: 0.7, marginBottom: 14 }}>
                These expenses need unanimous approval from all group members before they
                appear in the ledger and affect balances.
              </p>

              <div style={{ display: "grid", gap: 12 }}>
                {pendingExpenses.map((pe) => {
                  const creatorName = memberById.get(pe.paid_by)?.name ?? `User#${pe.paid_by}`;
                  const iAmCreator = pe.paid_by === currentUserId;
                  const myVote = pe.approvals?.find((a) => a.user_id === currentUserId);
                  const approvedCount = pe.approvals?.filter((a) => a.vote === "approved").length ?? 0;
                  const required = pe.required_approvals ?? 0;
                  const progress = required > 0 ? Math.min((approvedCount / required) * 100, 100) : 100;
                  const isVoting = votingId === pe.id;

                  // Compute countdown from expires_at
                  let countdown = null;
                  if (pe.expires_at) {
                    const diffMs = new Date(pe.expires_at) - Date.now();
                    if (diffMs > 0) {
                      const h = Math.floor(diffMs / 3600000);
                      const m = Math.floor((diffMs % 3600000) / 60000);
                      countdown = `${h}h ${m}m`;
                    } else {
                      countdown = "Expiring...";
                    }
                  }

                  return (
                    <div
                      key={pe.id}
                      style={{
                        background: "rgba(0,0,0,0.25)",
                        border: "1px solid rgba(251,191,36,0.2)",
                        borderRadius: 12,
                        padding: 14,
                      }}
                    >
                      {/* Header row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>{pe.title}</div>
                          <div className="small" style={{ opacity: 0.7 }}>
                            ₹{money(pe.amount_minor)} · paid by {creatorName}
                            {pe.category && <span style={{ marginLeft: 6 }}>· {pe.category}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#fbbf24", fontSize: 11 }}>
                          <Clock size={12} />
                          <span>{countdown ?? "—"}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ margin: "10px 0 6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
                          <span>{approvedCount} / {required} approvals</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
                          <div style={{
                            height: "100%",
                            borderRadius: 99,
                            width: `${progress}%`,
                            background: progress === 100
                              ? "linear-gradient(90deg, #22c55e, #4ade80)"
                              : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                      </div>

                      {/* Voter chips */}
                      {pe.approvals?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                          {pe.approvals.map((a) => (
                            <span
                              key={a.user_id}
                              style={{
                                fontSize: 10,
                                padding: "2px 7px",
                                borderRadius: 99,
                                fontWeight: 700,
                                background: a.vote === "approved" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                color: a.vote === "approved" ? "#4ade80" : "#f87171",
                                border: `1px solid ${a.vote === "approved" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                              }}
                            >
                              {a.vote === "approved" ? "✓" : "✗"}{" "}
                              {memberById.get(a.user_id)?.name ?? `User#${a.user_id}`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {iAmCreator ? (
                          /* Creator sees only Withdraw */
                          <button
                            type="button"
                            className="btn btn--small"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", gap: 5 }}
                            disabled={isVoting}
                            onClick={() => onWithdraw(pe.id)}
                          >
                            {isVoting ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />}
                            Withdraw
                          </button>
                        ) : myVote ? (
                          /* Already voted */
                          <span style={{ fontSize: 11, opacity: 0.6, alignSelf: "center" }}>
                            You voted: {myVote.vote === "approved" ? "✅ Approved" : "❌ Rejected"}
                          </span>
                        ) : (
                          /* Non-creator who hasn't voted */
                          <>
                            <button
                              type="button"
                              className="btn btn--small"
                              style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", gap: 5 }}
                              disabled={isVoting}
                              onClick={() => onApprove(pe.id)}
                            >
                              {isVoting ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn--small"
                              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", gap: 5 }}
                              disabled={isVoting}
                              onClick={() => onReject(pe.id)}
                            >
                              {isVoting ? <Loader2 size={12} className="animate-spin" /> : <ThumbsDown size={12} />}
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expenses (Approved Ledger) */}
          <div className="card tilt-card" ref={expensesRef}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="category-icon" style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 8, 
                        background: "rgba(255,255,255,0.05)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        color: "#9ca3af"
                      }}>
                        {CATEGORY_ICONS[e.category] || <Tag size={16} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800 }}>{e.title}</div>
                        <div className="small">
                          paid by {memberById.get(e.paid_by)?.name ?? `User#${e.paid_by}`}
                          {e.category && <span style={{ marginLeft: 8, opacity: 0.6 }}>• {e.category}</span>}
                        </div>
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
          <div className="card tilt-card" ref={settlementsRef}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CreditCard size={16} />
                      <div>
                        <div style={{ fontWeight: 800 }}>
                          {nameOf(s.from_user_id)} paid {nameOf(s.to_user_id)}
                        </div>
                        <div className="small">Settlement</div>
                      </div>
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
          <div className="card tilt-card" ref={activityRef}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Activity</h3>
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  try {
                    await refreshAll();
                    toast.success("Activity refreshed!");
                  } catch(e) {
                    toast.error(e?.message ?? String(e));
                  }
                }}
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
          {/* Your Balance Hero Card */}
          <div className="card" style={{
            background: myNetMinor > 0
              ? "linear-gradient(135deg, #052e16 0%, #14532d 100%)"
              : myNetMinor < 0
              ? "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)"
              : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            border: `1px solid ${myNetMinor > 0 ? "#16a34a" : myNetMinor < 0 ? "#dc2626" : "#6366f1"}`,
          }}>
            <p className="small" style={{ marginBottom: 6, opacity: 0.8, color: "#d1d5db" }}>Your Balance</p>
            {myNetMinor === 0 ? (
              <div style={{ fontSize: 20, fontWeight: 800, color: "#a5b4fc" }}>✅ All settled up!</div>
            ) : myNetMinor > 0 ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#86efac", textTransform: "uppercase", letterSpacing: 1 }}>You are owed</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>₹{money(myNetMinor)}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#fca5a5", textTransform: "uppercase", letterSpacing: 1 }}>You owe</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#f87171", fontVariantNumeric: "tabular-nums" }}>₹{money(Math.abs(myNetMinor))}</div>
              </>
            )}
          </div>

          {/* Members */}
          <div className="card tilt-card">
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
          <div className="card tilt-card" style={{ border: scanning ? '1px solid var(--primary)' : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Add Expense</h3>
              <button 
                type="button" 
                className={cn(
                  "btn btn--small gap-2", 
                  "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all",
                  scanning && "animate-pulse"
                )}
                onClick={onSmartScan}
                disabled={scanning}
              >
                {scanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                {scanning ? "Scanning..." : "Smart Scan"}
              </button>
            </div>

            <form onSubmit={onAddExpense}>
              <label className="label">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

              <label className="label">Category</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Auto-detect</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="rent">Rent</option>
                <option value="shopping">Shopping</option>
                <option value="entertainment">Entertainment</option>
                <option value="transport">Transport</option>
                <option value="bills">Bills</option>
                <option value="other">Other</option>
              </select>

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
          <div className="card tilt-card">
            <h3>Balances</h3>
            {!balances ? (
              <p className="card-muted">Loading balances…</p>
            ) : balances.transfers.length === 0 ? (
              <p>All settled 🎉</p>
            ) : (
              <ul className="list">
                {balances.transfers.map((t, idx) => (
                  <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      {nameOf(t.from_user_id)} owes {nameOf(t.to_user_id)} <b>₹{money(t.amount_minor)}</b>
                    </span>
                    <button 
                      type="button" 
                      className="btn btn--small" 
                      style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={() => {
                        setSettleFrom(String(t.from_user_id));
                        setSettleTo(String(t.to_user_id));
                        setSettleAmount((t.amount_minor / 100).toFixed(2));
                        const settleEl = document.querySelector('h3:contains("Settle Up")') || settlementsRef.current;
                        settleEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Settle
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Settle Up */}
          <div className="card tilt-card">
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

              <button type="submit" className="btn btn--primary" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <CreditCard size={16} />
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

                  <label className="label">Category</label>
                  <select className="select" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                    <option value="">Auto-detect</option>
                    <option value="food">Food</option>
                    <option value="travel">Travel</option>
                    <option value="rent">Rent</option>
                    <option value="shopping">Shopping</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="transport">Transport</option>
                    <option value="bills">Bills</option>
                    <option value="other">Other</option>
                  </select>

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