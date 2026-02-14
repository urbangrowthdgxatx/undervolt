import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Undervolt — Urban Infrastructure Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Award Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            borderRadius: "50px",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: "24px" }}>🏆</span>
          <span style={{ color: "#f59e0b", fontSize: "20px", fontWeight: 600 }}>
            1st Place Urban Growth — NVIDIA DGX Spark Frontier Hackathon
          </span>
        </div>

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "72px" }}>⚡</span>
          <h1
            style={{
              fontSize: "84px",
              fontWeight: 700,
              color: "white",
              margin: 0,
            }}
          >
            <span style={{ color: "white" }}>Under</span>
            <span style={{ color: "#6b7280" }}>volt</span>
          </h1>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "32px",
            color: "rgba(255,255,255,0.6)",
            margin: "0 0 48px 0",
            textAlign: "center",
          }}
        >
          Urban Infrastructure Intelligence
        </p>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "48px",
          }}
        >
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "48px", fontWeight: 700, color: "#10b981" }}>2.34M</span>
            <span style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)" }}>Permits Analyzed</span>
          </div>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "48px", fontWeight: 700, color: "#3b82f6" }}>NVIDIA</span>
            <span style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)" }}>RAPIDS + DGX Spark</span>
          </div>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "48px", fontWeight: 700, color: "#8b5cf6" }}>Jetson</span>
            <span style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)" }}>AGX Orin 64GB</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
