'use client';

import { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationContextType {
  handleBack: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  handleBack: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to home page if no history
      router.push('/');
    }
  };

  return (
    <NavigationContext.Provider value={{ handleBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
} 