export const metadata = {
  title: 'Our Story | Revathi Store',
  description: 'Almost 50 years of delivering uncompromised purity and tradition. Founded in 1975 in Theni.'
};

import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

import AboutClient from './AboutClient';

export default function AboutPage() {
  return <AboutClient />;
}
