import Link from "next/link";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

const TONE_CLASS = {
  default: "text-text-1",
  inverse: "text-white",
} as const;

type BrandWordmarkProps = {
  href?: string;
  size?: keyof typeof SIZE_CLASS;
  tone?: keyof typeof TONE_CLASS;
  className?: string;
  onClick?: () => void;
};

/**
 * Shared KOMPLEET wordmark (Kezie lock, 26 Sep 2026 WAT).
 * Uses the existing ceoruse face + 0.08em tracking. No logo mark.
 */
export function BrandWordmark({
  href,
  size = "lg",
  tone = "default",
  className,
  onClick,
}: BrandWordmarkProps) {
  const wordmark = (
    <span
      className={cn(
        "font-ceoruse font-bold uppercase",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      )}
    >
      KOMPLEET
    </span>
  );

  if (!href) {
    return wordmark;
  }

  return (
    <Link href={href} className="inline-flex items-center" onClick={onClick}>
      {wordmark}
    </Link>
  );
}
