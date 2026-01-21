import Link from 'next/link';

const footerNavigation = {
  resources: [
    { name: 'Blog', href: '/blog' },
    { name: 'AI Tools', href: '/blog?category=ai-tools' },
    { name: 'Efficiency Guides', href: '/blog?category=operational-efficiency' },
    { name: 'Industry Insights', href: '/blog?category=industry-insights' },
  ],
  company: [
    { name: 'About', href: 'https://optaimum.com' },
    { name: 'Contact', href: '/contact' },
    { name: 'Careers', href: 'https://optaimum.com/careers' },
  ],
  products: [
    { name: 'Asset Library', href: 'https://optaimum.com' },
    { name: 'Workflows', href: 'https://optaimum.com' },
    { name: 'Integrations', href: 'https://optaimum.com' },
  ],
};

const stats = [
  { value: '73%', label: 'Reduced Manual Ops' },
  { value: '2.5x', label: 'Faster Response' },
  { value: '10k+', label: 'Assets Deployed' },
];

export function Footer() {
  return (
    <footer className="bg-brand-900 text-white">
      {/* Stats bar */}
      <div className="border-b border-brand-700">
        <div className="container-wide py-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold text-accent-400">{stat.value}</div>
                <div className="text-xs md:text-sm text-brand-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter signup */}
      <div className="border-b border-brand-700">
        <div className="container-wide py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              Get AI automation insights delivered
            </h3>
            <p className="text-brand-300 mb-6">
              Weekly strategies for reducing manual operations and scaling with AI tools.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-brand-800 border-2 border-brand-700 text-white placeholder-brand-400 focus:border-accent-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-accent-500 text-white font-semibold hover:bg-accent-600 transition-colors border-2 border-accent-500"
              >
                Subscribe
              </button>
            </form>
            <p className="text-xs text-brand-400 mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-wide py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <span className="text-brand-900 font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Optaimum</span>
            </Link>
            <p className="text-sm text-brand-300 mb-4">
              Your one-stop library for AI-powered digital assets. Start small, expand as you adopt.
            </p>
            <Link
              href="/contact"
              className="inline-block px-5 py-2 bg-white text-brand-900 text-sm font-semibold hover:bg-brand-100 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerNavigation.resources.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-brand-300 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Products</h4>
            <ul className="space-y-2">
              {footerNavigation.products.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-brand-300 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-brand-300 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-brand-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-brand-400">
            &copy; {new Date().getFullYear()} Optaimum. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-brand-400 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </Link>
            <Link href="#" className="text-brand-400 hover:text-white transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
