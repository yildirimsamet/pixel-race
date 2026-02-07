'use client';

import { ReactNode } from 'react';

interface HeroHeaderProps {
  icon: ReactNode;
  title: string | ReactNode;
  subtitle: string;
  action?: ReactNode;
  borderColor?: string;
  shadowColor?: string;
  iconColor?: string;
}

export default function HeroHeader({
  icon,
  title,
  subtitle,
  action,
  borderColor = 'border-neon-blue/30',
  shadowColor = 'shadow-neon',
  iconColor = 'text-neon-blue'
}: HeroHeaderProps) {
  return (
    <div className={`glass rounded-3xl p-8 border ${borderColor} ${shadowColor} relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-64 h-64 ${iconColor.replace('text-', 'bg-')}/10 rounded-full blur-3xl`}></div>

      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className={`text-5xl sm:text-6xl ${iconColor}`}>
            {icon}
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{title}</h1>
            <p className="text-gray-400 text-sm sm:text-base">{subtitle}</p>
          </div>
        </div>

        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
