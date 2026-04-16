'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
          language === 'en'
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ta')}
        className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
          language === 'ta'
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        TA
      </button>
    </div>
  );
}
