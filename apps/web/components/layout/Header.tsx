'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Blog', href: '/blog' },
  { name: 'Intake', href: '/intake' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
      <nav className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          
          <Link href="/" className="text-2xl font-bold text-black" style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
          <div>OPTAIMUM</div>
          </Link>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-6 py-2 text-sm font-semibold transition-colors border-2 ${
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
