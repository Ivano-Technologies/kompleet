/**
 * NextAuth-style Floating Background Logos
 * 
 * Features:
 * - Nigerian finance/business brand logos
 * - 10% opacity
 * - Scattered positioning
 * - Non-interactive (pointer-events: none)
 * - Static (no animation)
 */

export interface FloatingLogo {
  name: string;
  x: string;
  y: string;
  icon: string; // Emoji or text representation
}

export interface FloatingLogosProps {
  logos?: FloatingLogo[];
}

const defaultLogos: FloatingLogo[] = [
  { name: 'GTBank', x: '10%', y: '15%', icon: '🏦' },
  { name: 'Access Bank', x: '85%', y: '20%', icon: '💳' },
  { name: 'Zenith Bank', x: '15%', y: '60%', icon: '🏛️' },
  { name: 'UBA', x: '80%', y: '70%', icon: '💰' },
  { name: 'FIRS', x: '50%', y: '40%', icon: '📊' },
  { name: 'First Bank', x: '25%', y: '80%', icon: '🏢' },
  { name: 'Stanbic IBTC', x: '90%', y: '45%', icon: '💼' },
  { name: 'Ecobank', x: '20%', y: '30%', icon: '🌍' },
];

export function FloatingLogos({ logos = defaultLogos }: FloatingLogosProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {logos.map((logo) => (
        <div
          key={logo.name}
          className="absolute opacity-10 text-floating-logo"
          style={{ left: logo.x, top: logo.y }}
          aria-hidden="true"
        >
          <div className="text-6xl">
            {logo.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
