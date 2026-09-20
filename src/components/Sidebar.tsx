'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact-match only. Everything else matches on `pathname.startsWith(href)`. */
  exact?: boolean;
  badge?: number;
}

interface SidebarProps {
  brand: string;
  /** Small chip under the brand mark — the student's batch code, for example. */
  brandMeta?: string;
  items: SidebarItem[];
  userName: string;
  /** Shown under the user's name once expanded — role, batch, etc. */
  userMeta?: string;
  onSignOut: () => void;
  children: ReactNode;
}

/**
 * The floating, hover-to-expand rail every shell in the app uses.
 *
 * It never touches the viewport edge — `inset-y-3 left-3` keeps a constant
 * gap on all four sides, which is what makes it read as a panel floating
 * over the page rather than a flush-mounted dock. Collapsed, it's 64px of
 * icons; on hover (or keyboard focus, via `focus-within`, so it isn't a
 * mouse-only affordance) it grows to 264px and labels fade in.
 *
 * It expands as an OVERLAY, not a reflow: the content pane's left margin is
 * sized for the COLLAPSED width only, so hovering the rail never shoves the
 * page around. `z-40` keeps it under Modal's `z-50`, so a dialog always
 * wins.
 */
export function Sidebar({
  brand,
  brandMeta,
  items,
  userName,
  userMeta,
  onSignOut,
  children,
}: SidebarProps) {
  const pathname = usePathname();
  const initial = userName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-dvh">
      <aside
        className="transition-ads group fixed inset-y-3 left-3 z-40 flex w-16 flex-col overflow-hidden rounded-xl bg-ink-800 shadow-rail hover:w-64 focus-within:w-64"
        style={{ transitionProperty: 'width' }}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 px-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
            L
          </div>
          <div className="min-w-0 overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <div className="truncate text-sm font-semibold whitespace-nowrap text-white">{brand}</div>
            {brandMeta && (
              <div className="truncate text-xs whitespace-nowrap text-ink-text-subtle">{brandMeta}</div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-2">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`transition-ads relative flex h-10 shrink-0 items-center gap-3 rounded-md px-[11px] ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-ink-text hover:bg-white/5 hover:text-white'
                }`}
                style={{ transitionProperty: 'background-color, color' }}
              >
                <span className="relative shrink-0">
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className={active ? 'text-brand-300' : ''}
                  />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger-600 text-[9px] font-semibold text-white group-hover:hidden">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                  <span className="whitespace-nowrap">{item.label}</span>
                </span>
                {item.badge != null && item.badge > 0 && (
                  <span className="hidden shrink-0 items-center justify-center rounded-full bg-danger-600 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:flex group-hover:opacity-100">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="shrink-0 border-t border-white/10 px-2.5 py-2.5">
          <div className="flex h-10 items-center gap-3 rounded-md px-[11px]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-500 text-[11px] font-semibold text-white">
              {initial}
            </span>
            <span className="min-w-0 flex-1 overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="block truncate text-sm whitespace-nowrap text-white">{userName}</span>
              {userMeta && (
                <span className="block truncate text-xs whitespace-nowrap text-ink-text-subtle">
                  {userMeta}
                </span>
              )}
            </span>
            <button
              onClick={onSignOut}
              title="Sign out"
              className="transition-ads shrink-0 rounded-md p-1.5 text-ink-text-subtle hover:bg-white/10 hover:text-white"
              style={{ transitionProperty: 'background-color, color' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Reserves space for the COLLAPSED rail only — the hover-expanded
          state overlays on top instead of reflowing this margin. */}
      <main className="ml-[92px] min-w-0 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
