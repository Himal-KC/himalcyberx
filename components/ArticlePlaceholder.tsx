type PlaceholderVariant = "network" | "grid" | "circuit" | "featured";

interface ArticlePlaceholderProps {
  variant: PlaceholderVariant;
  className?: string;
}

export function ArticlePlaceholder({
  variant,
  className = "",
}: ArticlePlaceholderProps) {
  return (
    <div
      className={`relative overflow-hidden bg-hcx-bg-secondary ${className}`}
      aria-hidden="true"
    >
      {variant === "network" && (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-br from-hcx-cyan/15 via-hcx-bg-secondary to-hcx-green/10"
          />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 40%, rgba(0,217,255,0.12) 0%, transparent 45%),
                linear-gradient(rgba(0,217,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,217,255,0.06) 1px, transparent 1px)
              `,
              backgroundSize: "auto, 28px 28px, 28px 28px",
            }}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 400 220"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="200" cy="110" r="3" fill="#00D9FF" opacity="0.8" />
            <circle cx="120" cy="70" r="2" fill="#00E89D" opacity="0.7" />
            <circle cx="290" cy="90" r="2" fill="#00D9FF" opacity="0.6" />
            <circle cx="260" cy="160" r="2" fill="#94A3B8" opacity="0.5" />
            <line x1="200" y1="110" x2="120" y2="70" stroke="rgba(0,217,255,0.25)" />
            <line x1="200" y1="110" x2="290" y2="90" stroke="rgba(0,217,255,0.2)" />
            <line x1="200" y1="110" x2="260" y2="160" stroke="rgba(0,232,157,0.2)" />
          </svg>
        </>
      )}

      {variant === "grid" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-hcx-orange/10 via-hcx-bg-secondary to-hcx-red/10" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(255,176,32,0.04) 0px,
                  rgba(255,176,32,0.04) 1px,
                  transparent 1px,
                  transparent 16px
                ),
                linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)
              `,
              backgroundSize: "auto, 20px 20px, 20px 20px",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-hcx-orange/20" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-hcx-red/15" />
        </>
      )}

      {variant === "circuit" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-bl from-hcx-green/10 via-hcx-bg-secondary to-hcx-cyan/15" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,232,157,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,232,157,0.05) 1px, transparent 1px)
              `,
              backgroundSize: "32px 32px",
            }}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 400 220"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              d="M60 110 H140 M260 110 H340 M200 50 V90 M200 130 V170"
              stroke="rgba(0,232,157,0.3)"
              strokeWidth="1"
            />
            <rect x="130" y="95" width="40" height="30" rx="4" stroke="rgba(0,217,255,0.35)" />
            <circle cx="200" cy="110" r="4" fill="#00E89D" opacity="0.8" />
            <circle cx="60" cy="110" r="2.5" fill="#00D9FF" opacity="0.6" />
            <circle cx="340" cy="110" r="2.5" fill="#00D9FF" opacity="0.6" />
          </svg>
        </>
      )}

      {variant === "featured" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-hcx-cyan/12 via-hcx-bg-secondary to-hcx-green/8" />
          <div
            className="absolute inset-0 opacity-35"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,217,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,217,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: "36px 36px",
            }}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 600 360"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="300" cy="180" r="100" stroke="rgba(0,217,255,0.12)" />
            <circle cx="300" cy="180" r="60" stroke="rgba(0,217,255,0.08)" />
            <line x1="300" y1="80" x2="300" y2="280" stroke="rgba(0,217,255,0.06)" />
            <line x1="200" y1="180" x2="400" y2="180" stroke="rgba(0,217,255,0.06)" />
            <circle cx="300" cy="180" r="5" fill="#00D9FF" opacity="0.85" />
            <circle cx="300" cy="80" r="3" fill="#00E89D" opacity="0.7" />
            <circle cx="400" cy="180" r="3" fill="#00D9FF" opacity="0.65" />
            <circle cx="240" cy="130" r="2.5" fill="#FF3B5C" opacity="0.6" />
            <circle cx="360" cy="220" r="2.5" fill="#FFB020" opacity="0.55" />
          </svg>
        </>
      )}
    </div>
  );
}
