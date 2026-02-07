'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { GiHorseHead } from 'react-icons/gi';
import { PiCloverFill } from 'react-icons/pi';
import { FiChevronDown } from 'react-icons/fi';

interface UserMenuDropdownProps {
  pathname: string;
}

interface MenuItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  neonColor: string;
  isActive: boolean;
}

export function UserMenuDropdown({ pathname }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const menuItems: MenuItem[] = [
    {
      href: '/stable',
      icon: <GiHorseHead className="text-lg" />,
      label: 'Stable',
      neonColor: 'green',
      isActive: pathname === '/stable',
    },
    {
      href: '/goodluck',
      icon: <PiCloverFill className="text-lg" />,
      label: 'GoodLuck',
      neonColor: 'green',
      isActive: pathname === '/goodluck',
    },
  ];

  const hasActiveItem = menuItems.some(item => item.isActive);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          text-sm font-medium transition-all duration-200
          ${hasActiveItem || isOpen
            ? 'text-white bg-white/10'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>My Account</span>
        <FiChevronDown
          className={`text-base transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-lg border border-purple-500/30 rounded-lg shadow-xl shadow-purple-500/20 overflow-hidden animate-slide-down">
          <div className="py-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3
                  transition-all duration-200
                  ${item.isActive
                    ? 'bg-purple-600/20 text-white border-l-2 border-neon-purple'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white hover:pl-5'
                  }
                `}
              >
                <span className={item.isActive ? 'text-neon-' + item.neonColor : ''}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>
      )}
    </div>
  );
}
