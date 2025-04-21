'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Wallet, History, User } from 'lucide-react';

const navItems = [
  {
    label: 'Accounts',
    href: '/accounts',
    icon: Home,
  },
  {
    label: 'Wallets',
    href: '/wallets',
    icon: Wallet,
  },
  {
    label: 'History',
    href: '/history',
    icon: History,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 