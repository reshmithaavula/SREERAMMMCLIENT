'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, PieChart, Settings, TrendingUp, Menu, X, LogOut, User, Monitor, Twitter } from 'lucide-react';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import styles from './Sidebar.module.css';

const mainNavItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Watchlist', href: '/watchlist', icon: List },
  { name: 'Portfolio', href: '/portfolio', icon: PieChart },
  { name: 'Penny Stocks', href: '/penny-stocks', icon: TrendingUp },
];

const addonItems = [
  { name: 'Common Lists', href: '/common-lists' },
  { name: 'Overnight Analysis', href: '/overnight-analysis' },
  { name: 'Market Sessions', href: '/market-sessions' },
];

const secondaryNavItems = [
  { name: 'Automation', href: '/automation', icon: Monitor },
  { name: 'Twitter', href: '/twitter', icon: Twitter },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  // Don't show sidebar on login page
  if (pathname === '/login') return null;

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const userInitials = (session?.user?.name && typeof session.user.name === 'string' && session.user.name.trim().length > 0)
    ? session.user.name.trim().split(/\s+/).map((n: string) => n[0]).join('').toUpperCase()
    : (session?.user?.email ? session.user.email[0].toUpperCase() : 'U');

  return (
    <>
      {/* Hamburger Menu Button - Only visible on mobile */}
      <button className={styles.hamburger} onClick={toggleSidebar} aria-label="Toggle menu">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay - Only visible on mobile when sidebar is open */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <Link href="/" className={styles.logo} onClick={closeSidebar}>
          <TrendingUp className={styles.logoIcon} />
          <span>StockTrack</span>
        </Link>
        <nav className={styles.nav}>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="mt-2">
            <h3 className={`px-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-3 ${!isOpen ? 'hidden' : ''}`}>
              Registry
            </h3>
            {addonItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={styles.navItem}
                onClick={closeSidebar}
              >
                <div className="w-5" /> {/* Spacer for icon alignment */}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-2 text-xs">
            {secondaryNavItems.map((item) => {
              const isOwner = (session?.user as any)?.role === 'owner';

              // Only hide Automation and Twitter for non-owners
              if (item.name !== 'Settings' && !isOwner) {
                return null;
              }

              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={closeSidebar}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {session && (
          <div className={styles.footer}>
            <div className="flex items-center gap-3 px-4 py-4 border-t border-[var(--border-color)] mt-auto bg-gray-50/50">
              <div className="w-8 h-8 rounded bg-[var(--accent-blue)] flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[var(--text-primary)] truncate uppercase tracking-tight">{session.user?.name || 'Operator'}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] truncate font-semibold leading-tight">{session.user?.email}</p>
                <div className="mt-1">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${(session.user as any)?.role === 'owner' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                    {(session.user as any)?.role || 'user'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-colors hover:bg-red-50 rounded"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
