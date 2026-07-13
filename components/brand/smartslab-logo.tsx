type SmartSlabLogoProps = {
  className?: string;
  /** Show the "SmartSlab" wordmark next to the mark. */
  withWordmark?: boolean;
  /** Mark size in pixels (CSS). */
  markSize?: number;
};

/**
 * Crisp flat vector brand mark (white "S" on the brand cyan) + optional
 * wordmark for header/footer.
 */
export function SmartSlabLogo({
  className,
  withWordmark = true,
  markSize = 28,
}: SmartSlabLogoProps) {
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
        <rect width="64" height="64" rx="14" fill="#1BB0CE" />
        <text
          x="32"
          y="44"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="var(--font-geist-sans), Segoe UI, Helvetica Neue, Arial, sans-serif"
          fontSize="40"
          fontWeight="800"
          letterSpacing="-1"
        >
          S
        </text>
      </svg>
      {withWordmark ? (
        <span className="text-base font-semibold tracking-tight">SmartSlab</span>
      ) : null}
    </span>
  );
}
