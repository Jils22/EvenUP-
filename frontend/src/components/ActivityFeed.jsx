import { useMemo, useState } from "react";
import "./ActivityFeed.css";

function money(minor) {
  return (Number(minor || 0) / 100).toFixed(2);
}

function getWhen(it) {
  return it?.created_at ?? it?.createdAt ?? it?.timestamp ?? it?.time ?? null;
}

function toTimeMs(it) {
  const raw = getWhen(it);
  if (!raw) return 0;
  const d = new Date(raw);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatTime(it) {
  const raw = getWhen(it);
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function relativeTimeFromMs(ms) {
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 0) return "";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

function formatDateHeader(ms) {
  const d = new Date(ms);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round((startOfToday - startOfThat) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function pickIcon(title) {
  const t = String(title || "").toLowerCase();
  if (t.includes("tea") || t.includes("coffee")) return "☕";
  if (t.includes("drink")) return "🍹";
  if (t.includes("grocery")) return "🛒";
  if (t.includes("dinner") || t.includes("lunch") || t.includes("breakfast") || t.includes("food")) return "🍽️";
  if (t.includes("hotel") || t.includes("stay") || t.includes("room")) return "🏨";
  if (t.includes("uber") || t.includes("ola") || t.includes("taxi") || t.includes("fuel") || t.includes("petrol")) return "🚕";
  if (t.includes("movie") || t.includes("cinema")) return "🎬";
  if (t.includes("rent")) return "🏠";
  if (t.includes("shopping") || t.includes("shoes") || t.includes("cloth")) return "🛍️";
  return "🧾";
}

function buildRow(it, memberById, nameOf) {
  const type = it?.type || "activity";

  if (type === "expense") {
    const payerName = memberById?.get(it.paid_by)?.name ?? `User#${it.paid_by}`;
    const title = it.title || "Expense";
    return {
      type,
      icon: pickIcon(title),
      title: `${payerName} added expense: ${title}`,
      subtitle: `Paid by ${payerName}`,
      amountText: `₹${money(it.amount_minor)}`,
      amountKind: "expense",
    };
  }

  if (type === "settlement") {
    const from = nameOf(it.from_user_id);
    const to = nameOf(it.to_user_id);
    return {
      type,
      icon: "💸",
      title: `${from} paid ${to}`,
      subtitle: "Settlement recorded",
      amountText: `₹${money(it.amount_minor)}`,
      amountKind: "settlement",
    };
  }

  return {
    type,
    icon: "📌",
    title: it.message || it.title || it.description || type,
    subtitle: "",
    amountText: "",
    amountKind: "other",
  };
}

export default function ActivityFeed({
  activity,
  memberById,
  nameOf,
  onOpenExpense,
  onOpenSettlement,
}) {
  const [filter, setFilter] = useState("all"); // all|expense|settlement
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const arr = Array.isArray(activity) ? activity : [];

    const items = arr
      .map((it, idx) => {
        const type = it?.type || "activity";
        const id = it?.expense_id || it?.settlement_id || it?.id || it?._id || `${type}-${idx}`;
        const ms = toTimeMs(it);
        return { it, key: `${type}-${id}`, id, type, ms };
      })
      .sort((a, b) => (b.ms || 0) - (a.ms || 0));

    const byType = filter === "all" ? items : items.filter((x) => x.type === filter);

    const query = q.trim().toLowerCase();
    const filtered = !query
      ? byType
      : byType.filter((x) => {
          const row = buildRow(x.it, memberById, nameOf);
          const hay = `${row.title} ${row.subtitle} ${x.type}`.toLowerCase();
          return hay.includes(query);
        });

    const map = new Map();
    for (const x of filtered) {
      const d = x.ms ? new Date(x.ms) : new Date(0);
      const dayMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (!map.has(dayMs)) map.set(dayMs, []);
      map.get(dayMs).push(x);
    }

    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([dayMs, rows]) => ({ dayMs, rows }));
  }, [activity, filter, q, memberById, nameOf]);

  function handleOpen(type, id) {
    if (!id) return;
    if (type === "expense") onOpenExpense?.(id);
    else if (type === "settlement") onOpenSettlement?.(id);
  }

  return (
    <div className="af">
      <div className="af-controls">
        <div className="af-filters">
          <button
            type="button"
            className={`af-chip ${filter === "all" ? "af-chip--active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`af-chip ${filter === "expense" ? "af-chip--active" : ""}`}
            onClick={() => setFilter("expense")}
          >
            Expenses
          </button>
          <button
            type="button"
            className={`af-chip ${filter === "settlement" ? "af-chip--active" : ""}`}
            onClick={() => setFilter("settlement")}
          >
            Settlements
          </button>
        </div>

        <input
          className="af-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search activity…"
        />
      </div>

      {groups.length === 0 ? (
        <p className="af-empty">No matching activity.</p>
      ) : (
        groups.map((g) => (
          <div key={g.dayMs} className="af-group">
            <div className="af-date">{formatDateHeader(g.dayMs)}</div>

            <div className="af-list">
              {g.rows.map(({ it, key, id, type }, idx) => {
                const row = buildRow(it, memberById, nameOf);
                const ms = toTimeMs(it);
                const time = formatTime(it);
                const rel = relativeTimeFromMs(ms);

                return (
                  <button
                    key={key}
                    type="button"
                    className={`af-item af-itemBtn ${idx === g.rows.length - 1 ? "af-item--last" : ""}`}
                    onClick={() => handleOpen(type, id)}
                    title="Click to open details"
                  >
                    {/* timeline rail */}
                    <div className="af-rail" aria-hidden="true">
                      <span className={`af-dotCircle af-dotCircle--${row.type}`} />
                      <span className="af-line" />
                    </div>

                    <div className="af-left">
                      <div className="af-icon" aria-hidden="true">
                        {row.icon}
                      </div>

                      <div className="af-main">
                        <div className="af-title">
                          <span className={`af-badge af-badge--${row.type}`}>
                            {row.type === "expense"
                              ? "Expense"
                              : row.type === "settlement"
                              ? "Settlement"
                              : row.type}
                          </span>
                          <span className="af-titleText">{row.title}</span>
                        </div>

                        <div className="af-sub">
                          {row.subtitle ? <span>{row.subtitle}</span> : null}
                          {time ? <span className="af-dotSep">•</span> : null}
                          {time ? <span className="af-time">{time}</span> : null}
                          {rel ? <span className="af-dotSep">•</span> : null}
                          {rel ? <span className="af-time">{rel}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className={`af-amount af-amount--${row.amountKind}`}>{row.amountText}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}