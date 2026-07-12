import { useId } from "react";

type SmartSlabLogoProps = {
  className?: string;
  /** Show the "SmartSlab" wordmark next to the mark. */
  withWordmark?: boolean;
  /** Mark size in pixels (CSS). */
  markSize?: number;
};

/**
 * Crisp vector brand mark (S/) + optional wordmark for header/footer.
 */
export function SmartSlabLogo({
  className,
  withWordmark = true,
  markSize = 28,
}: SmartSlabLogoProps) {
  const gradientId = useId();

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0 rounded-lg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B7BB8" />
            <stop offset="35%" stopColor="#C5D96B" />
            <stop offset="70%" stopColor="#1BB0CE" />
            <stop offset="100%" stopColor="#0D8FA8" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="12" fill={`url(#${gradientId})`} />
        <text
          x="32"
          y="42"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="var(--font-geist-sans), Segoe UI, Helvetica Neue, Arial, sans-serif"
          fontSize="28"
          fontWeight="800"
          letterSpacing="-1.5"
        >
          S/
        </text>
      </svg>
      {withWordmark ? (
        <span className="text-base font-semibold tracking-tight">SmartSlab</span>
      ) : null}
    </span>
  );
}
