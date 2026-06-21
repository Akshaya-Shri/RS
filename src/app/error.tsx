'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error securely to the console or an external reporting service in production
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:shadow-2xl">
        {/* Error icon with elegant ring animation */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-600 mb-6 relative">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
          <svg
            className="h-8 w-8 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2 font-outfit">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          We encountered an unexpected error while processing your request. Our team has been notified.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-[#1B5E20] hover:bg-[#154618] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md shadow-green-900/10"
          >
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-200 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            Return to Store
          </Link>
        </div>

        {/* Technical details (collapsible) */}
        <details className="mt-8 text-left border-t border-gray-100 pt-6 group">
          <summary className="text-sm font-medium text-gray-500 cursor-pointer select-none flex items-center justify-between hover:text-gray-700 transition-colors">
            <span>View technical details</span>
            <svg
              className="w-4 h-4 transform group-open:rotate-180 transition-transform duration-200 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200 text-xs font-mono text-gray-700 overflow-x-auto max-h-40 text-left leading-normal">
            <p className="font-bold text-red-600 mb-1">{error.name || 'Error'}: {error.message}</p>
            {error.digest && <p className="text-gray-500 mb-1">Digest: {error.digest}</p>}
            {error.stack && <pre className="whitespace-pre-wrap mt-2 text-gray-500">{error.stack}</pre>}
          </div>
        </details>
      </div>
    </div>
  );
}
