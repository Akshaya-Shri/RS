import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 border-t border-primary-light/20 pt-16 pb-8 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 100 100" className="w-8 h-8 text-primary-light">
                <path d="M50 15 Q30 45 30 70 A20 20 0 0 0 70 70 Q70 45 50 15 Z" fill="currentColor" />
              </svg>
              <div>
                <span className="text-xl font-bold text-white leading-tight block">REVATHI</span>
                <span className="text-xs font-semibold tracking-widest text-primary-light uppercase">Store</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              Authenticity, tradition, and purity since 1975. From our own oil mill to your home.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white/10 text-xs rounded border border-white/20">GST: 33DKNPS7396D1ZK</span>
              <span className="px-2 py-1 bg-white/10 text-xs rounded border border-white/20">MSME: TN23A0003022</span>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary-light transition-colors">Home</Link></li>
              <li><Link href="/products" className="hover:text-primary-light transition-colors">All Products</Link></li>
              <li><Link href="/wholesale" className="hover:text-primary-light transition-colors">Wholesale Inquiry</Link></li>
              <li><Link href="/about" className="hover:text-primary-light transition-colors">Our Story</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-bold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=groundnut" className="hover:text-primary-light transition-colors">Groundnut Oil</Link></li>
              <li><Link href="/products?category=coconut" className="hover:text-primary-light transition-colors">Coconut Oil</Link></li>
              <li><Link href="/products?category=sesame" className="hover:text-primary-light transition-colors">Sesame / Gingelly Oil</Link></li>
              <li><Link href="/products?category=castor" className="hover:text-primary-light transition-colors">Castor Oil</Link></li>
              <li><Link href="/products?category=deepam" className="hover:text-primary-light transition-colors">Deepam Oil</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Revathi Store, Theni, Tamil Nadu</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Call Us for Orders<br/><span className="text-xs opacity-75">+91 90000 00000</span></span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} Revathi Store (Since 1975). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
