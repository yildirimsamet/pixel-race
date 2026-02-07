import Link from 'next/link';

interface MobileNavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  neonColor: 'blue' | 'purple' | 'pink' | 'green' | 'yellow';
  isActive: boolean;
  onClick?: () => void;
}

export function MobileNavLink({ href, icon, label, neonColor, isActive, onClick }: MobileNavLinkProps) {
  const hoverColors = {
    blue: 'hover:text-neon-blue',
    purple: 'hover:text-neon-purple',
    pink: 'hover:text-neon-pink',
    green: 'hover:text-neon-green',
    yellow: 'hover:text-neon-yellow',
  };

  const activeColors = {
    blue: 'bg-neon-blue/20 text-neon-blue border-l-4 border-neon-blue',
    purple: 'bg-neon-purple/20 text-neon-purple border-l-4 border-neon-purple',
    pink: 'bg-neon-pink/20 text-neon-pink border-l-4 border-neon-pink',
    green: 'bg-neon-green/20 text-neon-green border-l-4 border-neon-green',
    yellow: 'bg-neon-yellow/20 text-neon-yellow border-l-4 border-neon-yellow',
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg min-h-[48px]
        text-gray-300 font-medium
        transition-all duration-300
        hover:bg-white/10 hover:pl-6
        ${hoverColors[neonColor]}
        ${isActive ? activeColors[neonColor] : ''}
      `}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-base">{label}</span>
    </Link>
  );
}
