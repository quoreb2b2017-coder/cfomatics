import { ImageResponse } from "next/og";

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
          background: "#FCFCFB",
          padding: 0,
          margin: 0,
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(8.5 7.4) scale(1.3) translate(-13.5 -13.5)">
            <path
              d="M44.5 22.2C41.8 18.6 37.2 16.2 32 16.2c-8.7 0-15.8 7.1-15.8 15.8S23.3 47.8 32 47.8c5.2 0 9.8-2.4 12.5-6"
              stroke="#37B98C"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M24 38.5 L31.2 30.8 L36.4 35.2 L45.5 24.5"
              stroke="#15181C"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="45.5" cy="24.5" r="3.2" fill="#A9812F" />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
