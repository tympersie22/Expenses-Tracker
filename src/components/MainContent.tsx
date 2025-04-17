'use client';

import React from 'react';
import { NavigationProvider } from '@/contexts/NavigationContext';
import NavigationWrapper from './NavigationWrapper';

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <div className="relative min-h-screen">
        <main className="max-w-md mx-auto bg-white pb-20">
          {children}
        </main>
        <NavigationWrapper />
      </div>
    </NavigationProvider>
  );
} 