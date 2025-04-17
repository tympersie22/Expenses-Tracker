'use client';

import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/settings" className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold">Terms & Privacy</h1>
          </div>

          <div className="space-y-6">
            {/* Terms of Service */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Terms of Service</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600">
                  By using our service, you agree to these terms. Please read them carefully.
                </p>
                <h3 className="text-gray-900 font-medium mt-4">1. Account Terms</h3>
                <p className="text-gray-600">
                  You must be 18 years or older to use this service. You are responsible for maintaining the security of your account and password.
                </p>
                <h3 className="text-gray-900 font-medium mt-4">2. Payment Terms</h3>
                <p className="text-gray-600">
                  All payments are processed securely through our payment providers. We do not store your payment information on our servers.
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Privacy Policy</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600">
                  We take your privacy seriously. This policy describes how we collect, use, and protect your personal information.
                </p>
                <h3 className="text-gray-900 font-medium mt-4">1. Information We Collect</h3>
                <p className="text-gray-600">
                  We collect information that you provide directly to us, including your name, email address, and financial information.
                </p>
                <h3 className="text-gray-900 font-medium mt-4">2. How We Use Your Information</h3>
                <p className="text-gray-600">
                  We use your information to provide and improve our services, communicate with you, and ensure the security of your account.
                </p>
                <h3 className="text-gray-900 font-medium mt-4">3. Data Security</h3>
                <p className="text-gray-600">
                  We implement appropriate security measures to protect your personal information from unauthorized access and disclosure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
} 