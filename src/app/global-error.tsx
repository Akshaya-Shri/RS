'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Critical Layout Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12 font-sans">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-600 mb-6">
            <svg
              className="h-8 w-8"
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

          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            A critical error occurred
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            The application experienced a fundamental layout or routing failure. Please try refreshing or restarting.
          </p>

          <button
            onClick={() => reset()}
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-[#1B5E20] hover:bg-[#154618] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md"
          >
            Attempt Recover
          </button>
        </div>
      </body>
    </html>
  );
}
