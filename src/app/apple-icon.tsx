import { ImageResponse } from "next/og";

// Home-screen icon for iPhones and iPads: the slate planet on an ice tile.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e7edf1",
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 999,
            backgroundColor: "#16202a",
          }}
        />
      </div>
    ),
    size,
  );
}
