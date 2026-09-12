import { ImageResponse } from "next/og";

export const alt = "Fruit Shop — Fresh Fruit Delivery Lahore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0d4a2a 0%, #176b3a 55%, #f39b36 160%)",
          color: "white",
          display: "flex",
          height: "100%",
          padding: "76px",
          position: "relative",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>🍊 🍎 🍐</div>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -3, marginTop: 28 }}>
            Fruit Shop
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.3, marginTop: 22, opacity: 0.9 }}>
            Fresh fruit, delivered across Lahore.
          </div>
        </div>
        <div
          style={{
            border: "3px solid rgba(255,255,255,0.5)",
            borderRadius: 999,
            bottom: 58,
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            padding: "14px 28px",
            position: "absolute",
            right: 64,
          }}
        >
          Fresh • Quality checked • Local delivery
        </div>
      </div>
    ),
    size,
  );
}
