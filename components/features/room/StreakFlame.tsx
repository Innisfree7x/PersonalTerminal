'use client';

interface StreakFlameProps {
  level: 'none' | 'small' | 'medium' | 'large' | 'legendary';
}

const FLAME_CONFIG = {
  small: { height: 24, flames: 1, opacity: 0.7 },
  medium: { height: 36, flames: 2, opacity: 0.85 },
  large: { height: 48, flames: 3, opacity: 1 },
  legendary: { height: 56, flames: 3, opacity: 1 },
} as const;

function FlamePath({ index, height, opacity }: { index: number; height: number; opacity: number }) {
  const xShift = index * 6 - 3;
  const scaleY = 1 - index * 0.1;
  const colors = ['#f59e0b', '#ea580c', '#fbbf24'];
  const delays = [0, 0.3, 0.6];

  return (
    <path
      d={`M12 ${height}
          C12 ${height}, ${8 + xShift} ${height * 0.5}, ${10 + xShift} ${height * 0.3}
          C${11 + xShift} ${height * 0.15}, 12 0, 12 0
          C12 0, ${13 - xShift} ${height * 0.15}, ${14 - xShift} ${height * 0.3}
          C${16 - xShift} ${height * 0.5}, 12 ${height}, 12 ${height}Z`}
      fill={colors[index % 3]}
      opacity={opacity}
      style={{
        transformOrigin: '12px bottom',
        transform: `scaleY(${scaleY})`,
        animation: `flicker ${1.5 + index * 0.3}s ease-in-out ${delays[index % 3]}s infinite`,
      }}
    />
  );
}

export default function StreakFlame({ level }: StreakFlameProps) {
  if (level === 'none') return null;

  const config = FLAME_CONFIG[level];
  const isLegendary = level === 'legendary';

  return (
    <svg
      width={24}
      height={config.height}
      viewBox={`0 0 24 ${config.height}`}
      className="pointer-events-none"
      aria-hidden="true"
    >
      <style>{`
        @keyframes flicker {
          0%, 100% { transform: scaleY(1); opacity: ${config.opacity}; }
          33% { transform: scaleY(1.05); opacity: ${config.opacity * 0.9}; }
          66% { transform: scaleY(0.98); opacity: ${config.opacity * 0.95}; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
      {isLegendary && (
        <defs>
          <filter id="flame-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g filter={isLegendary ? 'url(#flame-glow)' : undefined}>
        {Array.from({ length: config.flames }).map((_, i) => (
          <FlamePath
            key={i}
            index={i}
            height={config.height}
            opacity={config.opacity - i * 0.15}
          />
        ))}
      </g>
    </svg>
  );
}
