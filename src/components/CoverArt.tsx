/**
 * Deterministic unique cover illustration per article seed (slug/id).
 * Used when no Pexels photo is set, so every article still looks distinct.
 */

const PALETTES = [
  { bg: "#15181C", ink: "#37B98C", accent: "#A9812F", muted: "#2A2F36", label: "#EAF3EF" },
  { bg: "#0C6B4F", ink: "#EAF3EF", accent: "#F0D9A8", muted: "rgba(255,255,255,.14)", label: "#EAF3EF" },
  { bg: "#EFF1EC", ink: "#0C6B4F", accent: "#A9812F", muted: "#DADCD5", label: "#15181C" },
  { bg: "#20262E", ink: "#5FB0C9", accent: "#C9A24C", muted: "#333B45", label: "#E6EEF2" },
  { bg: "#1A2330", ink: "#7EC8A3", accent: "#E8B86D", muted: "#2C3848", label: "#EAF3EF" },
  { bg: "#F7F3EA", ink: "#08543E", accent: "#A9812F", muted: "#E4DED0", label: "#15181C" },
  { bg: "#0E2A24", ink: "#4AD0A0", accent: "#D4A84B", muted: "#1A3D34", label: "#EAF3EF" },
  { bg: "#F0F4F8", ink: "#1B4F72", accent: "#A9812F", muted: "#D5DEE6", label: "#15181C" },
] as const;

type Style = "line" | "bars" | "grid" | "donut" | "candles" | "area" | "docs" | "nodes";

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function labelText(label?: string | null) {
  if (!label) return "CFOMATICS";
  return label.replace(/&/g, "&amp;").toUpperCase().slice(0, 22);
}

function GridLines({ color }: { color: string }) {
  return (
    <>
      {[45, 90, 135, 180].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="400"
          y2={y}
          stroke={color}
          strokeWidth="1"
        />
      ))}
    </>
  );
}

function Badge({
  text,
  fill,
}: {
  text: string;
  fill: string;
}) {
  const w = Math.max(54, text.length * 9 + 18);
  return (
    <g transform="translate(16,16)">
      <rect x="0" y="0" width={w} height="22" rx="3" fill="rgba(0,0,0,.28)" />
      <text
        x="9"
        y="15"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="10"
        letterSpacing="1.5"
        fill={fill}
      >
        {text}
      </text>
    </g>
  );
}

export default function CoverArt({
  seed,
  label,
}: {
  seed: string;
  label?: string | null;
}) {
  const h = hash(seed || "cfomatics");
  const palette = PALETTES[h % PALETTES.length];
  const styles: Style[] = [
    "line",
    "bars",
    "grid",
    "donut",
    "candles",
    "area",
    "docs",
    "nodes",
  ];
  const style = styles[(h >>> 3) % styles.length];
  const uid = `ca-${(h % 1_000_000).toString(36)}`;
  const text = labelText(label);

  return (
    <svg
      viewBox="0 0 400 225"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.ink} stopOpacity=".45" />
          <stop offset="1" stopColor={palette.ink} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill={palette.bg} />
      <GridLines color={palette.muted} />

      {style === "line" && (
        <>
          <path
            d={`M 0 ${120 + (h % 40)} L 50 ${100 + (h % 30)} L 100 ${80 + (h % 50)} L 150 ${95 + (h % 25)} L 200 ${70 + (h % 40)} L 250 ${110 + (h % 20)} L 300 ${90 + (h % 35)} L 350 ${130 + (h % 15)} L 400 ${100 + (h % 45)} L 400 225 L 0 225 Z`}
            fill={`url(#${uid}-fade)`}
          />
          <path
            d={`M 0 ${120 + (h % 40)} L 50 ${100 + (h % 30)} L 100 ${80 + (h % 50)} L 150 ${95 + (h % 25)} L 200 ${70 + (h % 40)} L 250 ${110 + (h % 20)} L 300 ${90 + (h % 35)} L 350 ${130 + (h % 15)} L 400 ${100 + (h % 45)}`}
            fill="none"
            stroke={palette.ink}
            strokeWidth="2.5"
          />
        </>
      )}

      {style === "bars" &&
        Array.from({ length: 8 }, (_, i) => {
          const height = 40 + ((h >> (i + 2)) % 120);
          return (
            <rect
              key={i}
              x={30 + i * 46}
              y={200 - height}
              width="28"
              height={height}
              rx="2"
              fill={i % 3 === 0 ? palette.accent : palette.ink}
              opacity={0.55 + (i % 5) * 0.08}
            />
          );
        })}

      {style === "grid" &&
        Array.from({ length: 32 }, (_, i) => {
          const col = i % 8;
          const row = Math.floor(i / 8);
          const op = 0.15 + (((h >> i) & 7) / 7) * 0.75;
          return (
            <rect
              key={i}
              x={40 + col * 46}
              y={40 + row * 40}
              width="30"
              height="26"
              rx="2"
              fill={palette.ink}
              opacity={op}
            />
          );
        })}

      {style === "donut" && (
        <>
          <path
            d="M 200 54 A 58 58 0 0 1 237 156"
            fill="none"
            stroke={palette.ink}
            strokeWidth="20"
          />
          <path
            d="M 237 156 A 58 58 0 0 1 171 162"
            fill="none"
            stroke={palette.accent}
            strokeWidth="20"
          />
          <path
            d="M 171 162 A 58 58 0 0 1 150 83"
            fill="none"
            stroke={palette.ink}
            strokeWidth="20"
            opacity="0.55"
          />
          <path
            d="M 150 83 A 58 58 0 0 1 200 54"
            fill="none"
            stroke={palette.muted}
            strokeWidth="20"
          />
        </>
      )}

      {style === "candles" &&
        Array.from({ length: 9 }, (_, i) => {
          const x = 42 + i * 42;
          const mid = 80 + ((h >> i) % 60);
          const body = 12 + ((h >> (i + 3)) % 36);
          const up = ((h >> i) & 1) === 1;
          const color = up ? palette.ink : palette.accent;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={mid - 18}
                x2={x}
                y2={mid + body + 18}
                stroke={color}
                strokeWidth="2"
              />
              <rect
                x={x - 8}
                y={mid}
                width="16"
                height={body}
                rx="1.5"
                fill={color}
              />
            </g>
          );
        })}

      {style === "area" && (
        <>
          <path
            d={`M 0 ${140 - (h % 30)} C 80 ${60 + (h % 40)}, 160 ${160 - (h % 50)}, 240 ${90 + (h % 30)} S 360 ${150 - (h % 20)}, 400 ${110 + (h % 25)} L 400 225 L 0 225 Z`}
            fill={`url(#${uid}-fade)`}
          />
          <path
            d={`M 0 ${140 - (h % 30)} C 80 ${60 + (h % 40)}, 160 ${160 - (h % 50)}, 240 ${90 + (h % 30)} S 360 ${150 - (h % 20)}, 400 ${110 + (h % 25)}`}
            fill="none"
            stroke={palette.ink}
            strokeWidth="2.5"
          />
        </>
      )}

      {style === "docs" && (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${70 + i * 90}, ${50 + i * 12})`}>
              <rect
                width="110"
                height="130"
                rx="4"
                fill={palette.ink}
                opacity={0.12 + i * 0.1}
                stroke={palette.ink}
                strokeWidth="1.5"
              />
              <line x1="16" y1="28" x2="94" y2="28" stroke={palette.ink} strokeWidth="3" opacity="0.5" />
              <line x1="16" y1="48" x2="88" y2="48" stroke={palette.ink} strokeWidth="2" opacity="0.35" />
              <line x1="16" y1="68" x2="92" y2="68" stroke={palette.ink} strokeWidth="2" opacity="0.35" />
              <line x1="16" y1="88" x2="70" y2="88" stroke={palette.accent} strokeWidth="2" opacity="0.6" />
            </g>
          ))}
        </>
      )}

      {style === "nodes" && (
        <>
          {(
            [
              [60, 70],
              [160, 50],
              [260, 80],
              [340, 55],
              [100, 150],
              [200, 140],
              [300, 160],
            ] as const
          ).map(([x, y], i, arr) => {
            const next = arr[i + 1];
            return (
              <g key={i}>
                {next && (
                  <line
                    x1={x}
                    y1={y}
                    x2={next[0]}
                    y2={next[1]}
                    stroke={palette.ink}
                    strokeWidth="1.5"
                    opacity="0.45"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={8 + (i % 3) * 3}
                  fill={i % 2 === 0 ? palette.ink : palette.accent}
                  opacity="0.85"
                />
              </g>
            );
          })}
        </>
      )}

      <Badge text={text} fill={palette.label} />
    </svg>
  );
}
