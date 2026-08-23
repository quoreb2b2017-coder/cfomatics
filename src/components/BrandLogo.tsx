import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  variant?: "default" | "onDark";
  showWordmark?: boolean;
  className?: string;
};

export default function BrandLogo({
  href = "/",
  variant = "default",
  showWordmark = true,
  className = "",
}: BrandLogoProps) {
  const onDark = variant === "onDark";
  const chartStroke = onDark ? "#FCFCFB" : "#15181C";

  return (
    <Link
      href={href}
      className={`brand-logo ${onDark ? "brand-logo--dark" : ""} ${className}`.trim()}
      aria-label="CFOmatics home"
    >
      <span className="brand-mark" aria-hidden>
        <svg
          viewBox="13.5 13.5 36 37"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44.5 22.2C41.8 18.6 37.2 16.2 32 16.2c-8.7 0-15.8 7.1-15.8 15.8S23.3 47.8 32 47.8c5.2 0 9.8-2.4 12.5-6"
            stroke="#37B98C"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M24 38.5 L31.2 30.8 L36.4 35.2 L45.5 24.5"
            stroke={chartStroke}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="45.5" cy="24.5" r="3.2" fill="#A9812F" />
        </svg>
      </span>
      {showWordmark && (
        <span className="brand-word">
          CFO<span className="m">matics</span>
        </span>
      )}
    </Link>
  );
}
