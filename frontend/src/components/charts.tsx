"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatKg, formatShortDate } from "@/lib/format";
import type { ProgressPoint, WeeklyFrequency } from "@/lib/types";

const INK = "#14171A";
const ACCENT = "#C6F432";

export function FrequencyChart({ data }: { data: WeeklyFrequency[] }) {
  const rows = data.map((w) => ({ label: formatShortDate(w.weekStart), sessions: w.sessions }));
  return (
    <div className="h-40 w-full" role="img" aria-label="Gráfico de barras: treinos por semana">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E6E5DE" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5B6168" }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5B6168" }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => [`${String(v)} treino(s)`, "Semana"]} cursor={{ fill: "#E6E5DE" }} />
          <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
            {rows.map((_, i) => (
              <Cell key={i} fill={i === rows.length - 1 ? ACCENT : INK} stroke={i === rows.length - 1 ? INK : undefined} strokeWidth={2} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { isPersonalRecord: boolean };
}

function PointDot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  return payload?.isPersonalRecord ? (
    <circle cx={cx} cy={cy} r={7} fill={ACCENT} stroke={INK} strokeWidth={2} />
  ) : (
    <circle cx={cx} cy={cy} r={4} fill={INK} />
  );
}

export function WeightChart({ points }: { points: ProgressPoint[] }) {
  const rows = points.map((p) => ({
    label: formatShortDate(p.date),
    maxWeightKg: p.maxWeightKg,
    isPersonalRecord: p.isPersonalRecord,
  }));
  return (
    <div className="h-52 w-full" role="img" aria-label="Gráfico de linha: carga máxima por treino, com recordes destacados">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E6E5DE" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5B6168" }} tickLine={false} axisLine={{ stroke: "#B9B8B0" }} />
          <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 11, fill: "#5B6168" }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => [formatKg(Number(v)), "Carga máxima"]} />
          <Line
            type="monotone"
            dataKey="maxWeightKg"
            stroke={INK}
            strokeWidth={3}
            dot={<PointDot />}
            activeDot={{ r: 8, fill: ACCENT, stroke: INK, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
