'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  WalletIcon,
  UserCircleIcon,
  ClockIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/accounts', icon: CreditCardIcon, label: 'Accounts' },
    { href: '/wallets', icon: WalletIcon, label: 'Wallets' },
    { href: '/history', icon: ClockIcon, label: 'History' },
    { href: '/profile', icon: UserCircleIcon, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t">
      <div className="flex justify-around items-center p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center p-2 ${
              isActive(item.href)
                ? 'text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
} 