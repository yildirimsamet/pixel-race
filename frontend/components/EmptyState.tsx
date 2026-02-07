'use client';

import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass text-center py-16 rounded-2xl border border-white/10">
      <div className="flex justify-center items-center mb-6">
        {icon}
      </div>
      <p className="text-2xl font-bold mb-2">{title}</p>
      <p className="text-gray-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
