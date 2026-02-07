import Link from 'next/link';

interface DesktopNavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  neonColor: 'blue' | 'purple' | 'pink' | 'green' | 'yellow';
  isActive: boolean;
}

export function DesktopNavLink({ href, icon, label, neonColor, isActive }: DesktopNavLinkProps) {
  const glowColors = {
    blue: 'hover:shadow-[0_0_20px_rgba(0,217,255,0.6)] hover:text-neon-blue',
    purple: 'hover:shadow-[0_0_20px_rgba(181,55,255,0.6)] hover:text-neon-purple',
    pink: 'hover:shadow-[0_0_20px_rgba(255,46,151,0.6)] hover:text-neon-pink',
    green: 'hover:shadow-[0_0_20px_rgba(0,255,136,0.6)] hover:text-neon-green',
    yellow: 'hover:shadow-[0_0_20px_rgba(255,234,0,0.6)] hover:text-neon-yellow',
  };

  const activeColors = {
    blue: 'bg-neon-blue/10 text-neon-blue shadow-[0_0_15px_rgba(0,217,255,0.4)]',
    purple: 'bg-neon-purple/10 text-neon-purple shadow-[0_0_15px_rgba(181,55,255,0.4)]',
    pink: 'bg-neon-pink/10 text-neon-pink shadow-[0_0_15px_rgba(255,46,151,0.4)]',
    green: 'bg-neon-green/10 text-neon-green shadow-[0_0_15px_rgba(0,255,136,0.4)]',
    yellow: 'bg-neon-yellow/10 text-neon-yellow shadow-[0_0_15px_rgba(255,234,0,0.4)]',
  };

  return (
    <Link
      href={href}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-t-lg
        text-gray-300 font-medium text-sm
        transition-all duration-300 ease-out
        hover:scale-105 hover:bg-white/5
        ${glowColors[neonColor]}
        ${isActive ? activeColors[neonColor] : ''}
        group
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="text-lg transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>
      <span>{label}</span>

      {isActive && (
        <span
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink animate-slide-in"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
