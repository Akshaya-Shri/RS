import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-xl w-full text-center bg-white rounded-2xl shadow-xl p-10 border border-gray-100 transition-all duration-300 hover:shadow-2xl">
        {/* Animated Gold/Green SVG for 404 */}
        <div className="mx-auto flex items-center justify-center h-28 w-28 rounded-full bg-green-50 mb-8 relative">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#A5D6A7] opacity-20 animate-pulse"></span>
          {/* Custom drawing representing a drop of oil inside a location finder */}
          <svg className="h-16 w-16 text-[#C9A227]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 0-9 6-9 10.5a9 9 0 1018 0C21 9 13.2 3 12 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5" />
          </svg>
        </div>

        {/* 404 Status Code */}
        <span className="text-sm font-extrabold text-[#C9A227] tracking-widest uppercase bg-amber-50 px-4 py-1.5 rounded-full">
          404 Error
        </span>

        {/* English Title & Subtitle */}
        <div className="mt-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-outfit">
            Page Not Found
          </h1>
          <p className="mt-2 text-gray-600 leading-relaxed max-w-md mx-auto text-sm">
            We couldn&apos;t find the page you are looking for. It might have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Decorative Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-300">RS</span>
          </div>
        </div>

        {/* Tamil Title & Subtitle */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight font-tamil">
            பக்கம் கண்டறியப்படவில்லை
          </h2>
          <p className="mt-2 text-gray-500 leading-relaxed max-w-md mx-auto text-xs font-tamil">
            நீங்கள் தேடும் பக்கத்தைக் கண்டறிய முடியவில்லை. அது நீக்கப்பட்டிருக்கலாம் அல்லது முகவரி தவறாக இருக்கலாம்.
          </p>
        </div>

        {/* Return Button */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex justify-center items-center px-8 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-[#1B5E20] hover:bg-[#154618] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md shadow-green-900/10 hover:shadow-lg hover:shadow-green-900/20"
          >
            Go Back Home / முகப்புப்பக்கம்
          </Link>
        </div>
      </div>
    </div>
  );
}
