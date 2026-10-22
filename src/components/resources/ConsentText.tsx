import Link from "next/link";
import { parseConsentText } from "@/lib/resources";

export default function ConsentText({ text }: { text: string }) {
  return (
    <>
      {parseConsentText(text).map((part, index) => {
        if (part.type === "text") return <span key={index}>{part.value}</span>;
        if (part.type === "bold") return <strong key={index}>{part.value}</strong>;
        if (part.href.startsWith("/")) {
          return (
            <Link key={index} href={part.href} className="consent-token">
              {part.label}
            </Link>
          );
        }
        return (
          <a key={index} href={part.href} className="consent-token" target="_blank" rel="noopener noreferrer">
            {part.label}
          </a>
        );
      })}
    </>
  );
}
