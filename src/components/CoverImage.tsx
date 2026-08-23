import Image from "next/image";
import CoverArt from "@/components/CoverArt";

export default function CoverImage({
  src,
  alt,
  seed,
  label,
  sizes = "(min-width: 940px) 800px, 100vw",
  priority = false,
}: {
  src: string | null;
  alt: string | null;
  /** Unique per-article key (slug or id) — drives fallback art. */
  seed: string;
  /** Optional badge text on fallback art (topic name). */
  label?: string | null;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return <CoverArt seed={seed} label={label ?? alt} />;
  }

  return (
    <Image
      src={src}
      alt={alt ?? ""}
      fill
      sizes={sizes}
      priority={priority}
      style={{ objectFit: "cover" }}
    />
  );
}
