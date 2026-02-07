'use client';

import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color: string;
  };
}

export default function SectionHeader({ icon, title, subtitle, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {icon}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          {title}
          {badge && (
            <span className={`px-3 py-1 ${badge.color} rounded-full text-lg`}>
              {badge.text}
            </span>
          )}
        </h2>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}
