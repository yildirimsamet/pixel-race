import Link from 'next/link';
import { FiShield } from 'react-icons/fi';

interface AdminButtonProps {
  isActive: boolean;
}

export function AdminButton({ isActive }: AdminButtonProps) {
  return (
    <Link
      href="/admin/dashboard"
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        text-xs font-semibold uppercase tracking-wide
        border transition-all duration-200
        ${isActive
          ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-400 shadow-sm shadow-yellow-500/20'
          : 'bg-transparent border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/50'
        }
      `}
      aria-label="Admin Dashboard"
    >
      <FiShield className="text-sm" />
      <span>Admin</span>
    </Link>
  );
}
