import type { ArticleChart as ArticleChartData } from "@/types/database";

const SERIES_COLORS = ["#158a66", "#a9812f"];
const WIDTH = 680;
const HEIGHT = 300;
const MARGIN = { top: 16, right: 16, bottom: 34, left: 44 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

function formatValue(v: number, unit?: string): string {
  const rounded = Number.isInteger(v) ? v.toString() : v.toFixed(1);
  if (!unit) return rounded;
  if (unit.startsWith("$")) return `$${rounded}${unit.slice(1)}`;
  if (unit === "%") return `${rounded}%`;
  return `${rounded} ${unit}`;
}

// Top-two-corners-rounded, square-baseline bar path (see dataviz skill's
// mark spec: "4px rounded data-end, square at the baseline").
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h);
  if (h <= 0) return "";
  return `M${x},${y + h} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + w - radius} Q${x + w},${y} ${x + w},${y + radius} V${y + h} Z`;
}

export default function ArticleChart({ chart }: { chart: ArticleChartData }) {
  const { title, type, unit, labels, series, sourceNote } = chart;
  const maxRaw = Math.max(0, ...series.flatMap((s) => s.values));
  const max = niceMax(maxRaw);
  const yTo = (v: number) => MARGIN.top + PLOT_H - (v / max) * PLOT_H;
  const bandWidth = PLOT_W / labels.length;

  const tallestIndex = series[0].values.reduce(
    (best, v, i) => (v > series[0].values[best] ? i : best),
    0,
  );

  return (
    <figure className="chart-figure reveal">
      <figcaption className="chart-title">{title}</figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        role="img"
        aria-label={`${title}${sourceNote ? `. ${sourceNote}` : ""}`}
      >
        {[0, 0.5, 1].map((f) => {
          const y = MARGIN.top + PLOT_H - f * PLOT_H;
          return (
            <g key={f}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={y}
                y2={y}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fontFamily="var(--font-ibm-plex-mono), monospace"
                fill="var(--ink-2)"
              >
                {formatValue(max * f, unit)}
              </text>
            </g>
          );
        })}

        {labels.map((label, i) => (
          <text
            key={label}
            x={MARGIN.left + bandWidth * (i + 0.5)}
            y={HEIGHT - MARGIN.bottom + 18}
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-inter), sans-serif"
            fill="var(--ink-2)"
          >
            {label.length > 12 ? `${label.slice(0, 11)}…` : label}
          </text>
        ))}

        {type === "bar" &&
          series.map((s, si) => {
            const groupW = Math.min(24, bandWidth * 0.6);
            const barW = series.length === 2 ? (groupW - 2) / 2 : groupW;
            return s.values.map((v, i) => {
              const x =
                MARGIN.left +
                bandWidth * i +
                bandWidth / 2 -
                groupW / 2 +
                si * (barW + 2);
              const y = yTo(v);
              const h = MARGIN.top + PLOT_H - y;
              return (
                <g key={`${si}-${i}`}>
                  <path
                    d={barPath(x, y, barW, h, 4)}
                    fill={SERIES_COLORS[si]}
                    aria-label={`${s.name}: ${formatValue(v, unit)}`}
                  />
                  {si === 0 && i === tallestIndex && (
                    <text
                      x={x + barW / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={600}
                      fontFamily="var(--font-inter), sans-serif"
                      fill="var(--ink)"
                    >
                      {formatValue(v, unit)}
                    </text>
                  )}
                </g>
              );
            });
          })}

        {type === "line" &&
          series.map((s, si) => {
            const points = s.values.map(
              (v, i) => [MARGIN.left + bandWidth * (i + 0.5), yTo(v)] as const,
            );
            const path = points
              .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
              .join(" ");
            const last = points[points.length - 1];
            return (
              <g key={si}>
                <path
                  d={path}
                  fill="none"
                  stroke={SERIES_COLORS[si]}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {points.map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={4}
                    fill={SERIES_COLORS[si]}
                    stroke="var(--paper)"
                    strokeWidth={2}
                    aria-label={`${s.name} · ${labels[i]}: ${formatValue(s.values[i], unit)}`}
                  />
                ))}
                <text
                  x={last[0]}
                  y={last[1] - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={600}
                  fontFamily="var(--font-inter), sans-serif"
                  fill="var(--ink)"
                >
                  {formatValue(s.values[s.values.length - 1], unit)}
                </text>
              </g>
            );
          })}
      </svg>

      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s, i) => (
            <span key={s.name} className="chart-legend-item">
              <span
                className="chart-legend-swatch"
                style={{ background: SERIES_COLORS[i] }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}

      {sourceNote && <p className="chart-source">{sourceNote}</p>}

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{unit ? `Value (${unit})` : "Value"}</th>
            {series.map((s) => (
              <th scope="col" key={s.name}>
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {series.map((s) => (
                <td key={s.name}>{formatValue(s.values[i], unit)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
