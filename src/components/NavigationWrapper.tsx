'use client';

import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('./Navigation'), {
  ssr: false
});

export default function NavigationWrapper() {
  return <Navigation />;
} 