'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Layers3, Sparkles, User } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/events', label: 'Explore', Icon: Compass },
  { href: '/categories', label: 'Stages', Icon: Layers3 },
  { href: '/become-a-host', label: 'Host', Icon: Sparkles },
  { href: '/profile', label: 'Account', Icon: User },
];

const isActive = (pathname: string | null, href: string) =>
  href === '/' ? pathname === '/' : pathname?.startsWith(href);

export function MobileNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.retro-nav');
    if (!nav) return;

    const update = () => nav.classList.toggle('retro-nav-scrolled', window.scrollY > 18);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <nav
      aria-label="Mobile navigation"
      className="retro-mobile-dock md:hidden fixed bottom-0 left-0 right-0 z-[55] px-2 pb-safe pt-2"
    >
      <div className="mobile-dock-surface mx-auto max-w-md rounded-[1.35rem] border-2 border-[#1e1a14] shadow-[0_8px_28px_rgba(30,26,20,0.18)] px-1.5 py-1.5">
        <div className="grid grid-cols-5 gap-0.5">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-all ${
                  active
                    ? 'bg-[#c93a2a] text-[#f7f0e3]'
                    : 'text-[#1e1a14]/65 hover:bg-[#1e1a14]/8 hover:text-[#1e1a14]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider truncate max-w-full">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
