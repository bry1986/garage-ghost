import { ImageResponse } from "next/og";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const alt = `${APP_NAME} — ${APP_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Risk-level chips, mirroring the in-app RISK_META badges. */
const CHIPS = [
  { label: "STOP NOW", color: "#f87171", ring: "rgba(248,113,113,0.4)" },
  { label: "DRIVE CAREFULLY", color: "#fbbf24", ring: "rgba(251,191,36,0.4)" },
  { label: "BOOK SERVICE", color: "#60a5fa", ring: "rgba(96,165,250,0.4)" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
        padding: "0 84px",
        background: "#09090b",
        overflow: "hidden",
      }}
    >
      {/* Brand glow bleeding from the top-left */}
      <div
        style={{
          position: "absolute",
          left: "-18%",
          top: "-34%",
          width: 760,
          height: 760,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(59,130,246,0.3), transparent 65%)",
        }}
      />
      {/* Faint ghost echo G behind the copy */}
      <div
        style={{
          position: "absolute",
          right: -70,
          top: -120,
          display: "flex",
          color: "rgba(255,255,255,0.04)",
          fontSize: 700,
          fontWeight: 800,
          letterSpacing: "-0.05em",
        }}
      >
        G
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            G
          </div>
          <div
            style={{
              display: "flex",
              color: "#3b82f6",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.22em",
            }}
          >
            {APP_NAME.toUpperCase()}
          </div>
        </div>

        {/* Headline — the tagline, split for a strong two-line lockup */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 44,
            color: "#fafafa",
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.04,
          }}
        >
          <span>Understand the warning.</span>
          <span>Choose the safe next step.</span>
        </div>

        {/* Value line */}
        <div style={{ display: "flex", marginTop: 30, color: "#a1a1aa", fontSize: 28 }}>
          Free AI vehicle diagnosis · OBD-II &amp; VIN lookup · No account needed
        </div>

        {/* Risk-level chips */}
        <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
          {CHIPS.map((chip) => (
            <div
              key={chip.label}
              style={{
                display: "flex",
                padding: "12px 26px",
                borderRadius: 999,
                border: `1.5px solid ${chip.ring}`,
                color: chip.color,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              {chip.label}
            </div>
          ))}
        </div>
      </div>

      {/* Domain footer */}
      <div
        style={{
          position: "absolute",
          right: 84,
          bottom: 44,
          display: "flex",
          color: "#52525b",
          fontSize: 22,
        }}
      >
        garage-ghost.vercel.app
      </div>
    </div>
    ),
    { ...size }
  );
}
