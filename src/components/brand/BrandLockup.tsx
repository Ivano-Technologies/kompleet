import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BrandWordmark,
  WORDMARK_SIZE_CLASS,
} from "@/components/brand/BrandWordmark";

/** Ivano V mark files (Coco's IVA-186 export, mirrored from ivano-pms public/brand). */
export const IVANO_MARK_SRC = "/brand/ivano-mark.svg";
export const IVANO_MARK_REVERSE_SRC = "/brand/ivano-mark-reverse.svg";

/** viewBox 265.85 x 180 */
const MARK_ASPECT = 265.85 / 180;

/** V height in px per wordmark size, about 1.4x the wordmark letter height. */
const MARK_HEIGHT = {
  sm: 14,
  md: 18,
  lg: 18,
} as const;

/** Collapsed rail: the V alone. */
const COLLAPSED_MARK_HEIGHT = 24;

const TONE_CLASS = {
  default: "text-text-1",
  inverse: "text-white",
  auto: "text-text-1 dark:text-dark-text-1",
} as const;

type BrandLockupProps = {
  href?: string;
  size?: keyof typeof MARK_HEIGHT;
  /**
   * default: ink V on light surfaces. inverse: reverse V on navy panels.
   * auto: ink V, switching to the reverse V when the dark theme is on.
   */
  tone?: keyof typeof TONE_CLASS;
  /** Override the V height in px (the auth card uses 20). */
  markHeight?: number;
  /** Show the V alone at 24px, for a collapsed sidebar. */
  collapsed?: boolean;
  className?: string;
  onClick?: () => void;
};

function MarkImage({
  src,
  height,
  label,
  className,
}: {
  src: string;
  height: number;
  label?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      width={Math.round(height * MARK_ASPECT)}
      height={height}
      style={{ height, width: "auto" }}
      className={cn("shrink-0", className)}
      data-brand-mark
    />
  );
}

/**
 * Ivano V mark + KOMPLEET wordmark lockup (IVA-186), matching the ivano-pms
 * lockup: V, 12px gap, 1px divider in the text colour at 25% opacity as tall
 * as the wordmark letters (Ceoruse caps are about 0.72em), 12px gap, wordmark. The V is decorative next to
 * the wordmark (aria-hidden); when collapsed it carries the alt text.
 */
export function BrandLockup({
  href,
  size = "lg",
  tone = "default",
  markHeight,
  collapsed = false,
  className,
  onClick,
}: BrandLockupProps) {
  const height = collapsed
    ? COLLAPSED_MARK_HEIGHT
    : (markHeight ?? MARK_HEIGHT[size]);
  const label = collapsed ? "Ivano Technologies" : undefined;

  const mark =
    tone === "auto" ? (
      <>
        <MarkImage
          src={IVANO_MARK_SRC}
          height={height}
          label={label}
          className="dark:hidden"
        />
        <MarkImage
          src={IVANO_MARK_REVERSE_SRC}
          height={height}
          label={label}
          className="hidden dark:block"
        />
      </>
    ) : (
      <MarkImage
        src={tone === "inverse" ? IVANO_MARK_REVERSE_SRC : IVANO_MARK_SRC}
        height={height}
        label={label}
      />
    );

  const lockup = (
    <span
      className={cn(
        "inline-flex items-center gap-3",
        TONE_CLASS[tone],
        className,
      )}
      data-brand-lockup={collapsed ? "collapsed" : "full"}
    >
      {mark}
      {!collapsed && (
        <>
          <span
            aria-hidden
            data-brand-divider
            className={cn(
              "block h-[0.72em] w-px shrink-0 bg-current opacity-25",
              WORDMARK_SIZE_CLASS[size],
            )}
          />
          <BrandWordmark
            size={size}
            tone={tone === "inverse" ? "inverse" : "default"}
            className={cn(
              // Ceoruse caps sit about 0.11em above the line box centre;
              // nudge them so they centre on the V and the divider.
              "relative top-[0.11em]",
              tone === "auto" && "dark:text-dark-text-1",
            )}
          />
        </>
      )}
    </span>
  );

  if (!href) {
    return lockup;
  }

  return (
    <Link href={href} className="inline-flex items-center" onClick={onClick}>
      {lockup}
    </Link>
  );
}
