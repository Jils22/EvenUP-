/**
 * DebtFlowGraph — Visual force-directed debt network using Recharts + SVG.
 *
 * Renders each group member as a node and each debt relationship as a
 * curved arrow (edge). Recharts does not natively support force-directed
 * graphs, so we use a simple physics-free radial layout instead (placing
 * nodes on a circle).  This is deterministic, fast, and visually clear.
 *
 * Props:
 *  - transfers: Array<{ from_user_id, to_user_id, amount_minor, from_user_name, to_user_name }>
 *  - members: Array<{ id, name }>
 */
import { useMemo } from 'react';

interface Transfer {
  from_user_id: string;
  to_user_id: string;
  amount_minor: number;
  from_user_name?: string;
  to_user_name?: string;
}

interface Member {
  id: string;
  name: string;
}

interface DebtFlowGraphProps {
  transfers: Transfer[];
  members: Member[];
  width?: number;
  height?: number;
}

// Generate initials for a member name
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Place N nodes evenly on a circle of given radius centred at cx,cy
function circlePositions(n: number, cx: number, cy: number, radius: number) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

// Compute a quadratic bezier control point that curves arrows away from centre
function controlPoint(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  // Push control point away from centre
  const dx = mx - cx;
  const dy = my - cy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const curveStrength = 40;
  return { cpx: mx + (dx / len) * curveStrength, cpy: my + (dy / len) * curveStrength };
}

const NODE_R = 28;
const ARROW_SIZE = 8;

export function DebtFlowGraph({ transfers, members, width = 480, height = 480 }: DebtFlowGraphProps) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - NODE_R - 10;

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    if (members.length === 0) return pos;
    const coords = circlePositions(members.length, cx, cy, radius);
    members.forEach((m, i) => { pos[m.id] = coords[i]; });
    return pos;
  }, [members, cx, cy, radius]);

  // Maximum amount to normalise stroke widths
  const maxAmount = useMemo(() => {
    if (transfers.length === 0) return 1;
    return Math.max(...transfers.map(t => t.amount_minor));
  }, [transfers]);

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-secondary text-sm">
        No members to display.
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-secondary text-sm">
        <span className="text-4xl">⚖️</span>
        All settled up! No debts in this group.
      </div>
    );
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        {/* Arrow marker */}
        <marker
          id="arrowhead"
          markerWidth={ARROW_SIZE}
          markerHeight={ARROW_SIZE}
          refX={ARROW_SIZE - 1}
          refY={ARROW_SIZE / 2}
          orient="auto"
        >
          <path
            d={`M 0 0 L ${ARROW_SIZE} ${ARROW_SIZE / 2} L 0 ${ARROW_SIZE} z`}
            fill="#C08FF5"
            fillOpacity={0.7}
          />
        </marker>
        {/* Radial gradient for nodes */}
        {members.map(m => (
          <radialGradient key={m.id} id={`ng-${m.id}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#C08FF5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.7" />
          </radialGradient>
        ))}
      </defs>

      {/* Edges */}
      {transfers.map((t, i) => {
        const from = positions[t.from_user_id];
        const to = positions[t.to_user_id];
        if (!from || !to) return null;

        const { cpx, cpy } = controlPoint(from.x, from.y, to.x, to.y, cx, cy);
        // Stroke width scaled by amount (min 1.5, max 5)
        const strokeW = 1.5 + (t.amount_minor / maxAmount) * 3.5;
        const amountLabel = `₹${(t.amount_minor / 100).toFixed(0)}`;

        // Midpoint on curve for label placement
        const lx = 0.25 * from.x + 0.5 * cpx + 0.25 * to.x;
        const ly = 0.25 * from.y + 0.5 * cpy + 0.25 * to.y;

        return (
          <g key={`edge-${i}`}>
            <path
              d={`M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`}
              fill="none"
              stroke="#C08FF5"
              strokeOpacity={0.45}
              strokeWidth={strokeW}
              markerEnd="url(#arrowhead)"
            />
            {/* Amount label on edge */}
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="#C08FF5"
              fillOpacity={0.8}
            >
              {amountLabel}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {members.map(m => {
        const pos = positions[m.id];
        if (!pos) return null;
        return (
          <g key={`node-${m.id}`}>
            {/* Glow ring */}
            <circle cx={pos.x} cy={pos.y} r={NODE_R + 4} fill="#C08FF5" fillOpacity={0.08} />
            {/* Node circle */}
            <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={`url(#ng-${m.id})`} />
            {/* Initials */}
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              fontWeight="bold"
              fill="white"
            >
              {initials(m.name || 'U')}
            </text>
            {/* Name label below node */}
            <text
              x={pos.x}
              y={pos.y + NODE_R + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="#A8B3C7"
            >
              {m.name?.split(' ')[0] || 'Member'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
