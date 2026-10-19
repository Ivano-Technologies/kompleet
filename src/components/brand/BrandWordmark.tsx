import Link from "next/link";
import { cn } from "@/lib/utils";

export const WORDMARK_SIZE_CLASS = {
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
  size?: keyof typeof WORDMARK_SIZE_CLASS;
  tone?: keyof typeof TONE_CLASS;
  className?: string;
  onClick?: () => void;
};

/**
 * Shared KOMPLEET wordmark (Kezie lock, 26 Sep 2026 WAT).
 * Face is Ceoruse via font-ceoruse. Text only; brand slots pair it with the
 * Ivano V mark through BrandLockup (IVA-186).
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
        WORDMARK_SIZE_CLASS[size],
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
