import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the accounts page instead of root
    router.replace('/accounts');
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Welcome to Expense Tracker</h1>
        <p className="text-gray-600">Redirecting to your accounts...</p>
      </div>
    </div>
  );
} 