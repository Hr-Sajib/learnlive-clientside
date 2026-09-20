'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { useTheme } from '@/hooks/useTheme';

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

/** Shared row styling for nav links, the theme toggle and sign-out — one
 *  interactive-row treatment used everywhere in the rail. */
const ROW =
  'transition-ads relative flex h-10 w-full shrink-0 items-center gap-3 rounded-md px-[11px] text-left';

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
 *
 * Every colour here is a semantic token (`bg-surface`, `text-text`, …), not
 * a fixed dark palette — that's what lets the rail itself flip between the
 * light and dark variants shown in the reference, in step with the rest of
 * the site, instead of staying permanently dark.
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
  const { theme, toggle } = useTheme();
  const initial = userName.trim().charAt(0).toUpperCase() || '?';
  const isDark = theme === 'dark';
  const asideRef = useRef<HTMLElement>(null);

  /**
   * `:focus-within` keeps the rail expanded so a keyboard user tabbing
   * through nav items can still read labels — but clicking a link or the
   * theme toggle also leaves that element focused, and focus (unlike hover)
   * doesn't clear on its own when the mouse moves away. Without this, the
   * rail would stay expanded after any click until something else stole
   * focus. Blurring on mouse-leave makes hover authoritative for mouse
   * users while leaving pure keyboard navigation (which never fires
   * `mouseleave` at all) unaffected.
   */
  const collapseOnMouseLeave = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && asideRef.current?.contains(active)) {
      active.blur();
    }
  };

  return (
    <div className="min-h-dvh">
      <aside
        ref={asideRef}
        onMouseLeave={collapseOnMouseLeave}
        className="transition-ads group fixed inset-y-3 left-3 z-40 flex w-16 flex-col overflow-hidden rounded-xl bg-surface shadow-rail hover:w-64 focus-within:w-64"
        style={{ transitionProperty: 'width' }}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 px-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
            L
          </div>
          <div className="min-w-0 overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <div className="truncate text-sm font-semibold whitespace-nowrap text-text">{brand}</div>
            {brandMeta && (
              <div className="truncate text-xs whitespace-nowrap text-text-subtle">{brandMeta}</div>
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
                className={`${ROW} ${
                  active
                    ? 'bg-accent/10 text-text'
                    : 'text-text-subtle hover:bg-surface-hover hover:text-text'
                }`}
                style={{ transitionProperty: 'background-color, color' }}
              >
                <span className="relative shrink-0">
                  <Icon size={18} strokeWidth={2} className={active ? 'text-accent' : ''} />
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

        {/* Theme toggle + user + sign out */}
        <div className="shrink-0 border-t border-border px-2.5 py-2.5">
          <button
            onClick={toggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            className={`${ROW} mb-0.5 text-text-subtle hover:bg-surface-hover hover:text-text`}
            style={{ transitionProperty: 'background-color, color' }}
          >
            <span className="relative flex shrink-0 items-center justify-center">
              <Sun
                size={18}
                strokeWidth={2}
                className={`transition-ads absolute ${isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                style={{ transitionProperty: 'opacity, transform' }}
              />
              <Moon
                size={18}
                strokeWidth={2}
                className={`transition-ads ${isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                style={{ transitionProperty: 'opacity, transform' }}
              />
            </span>
            <span className="min-w-0 flex-1 overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="whitespace-nowrap">{isDark ? 'Dark mode' : 'Light mode'}</span>
            </span>
          </button>

          <div className="flex h-10 items-center gap-3 rounded-md px-[11px]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[11px] font-semibold text-text">
              {initial}
            </span>
            <span className="min-w-0 flex-1 overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="block truncate text-sm whitespace-nowrap text-text">{userName}</span>
              {userMeta && (
                <span className="block truncate text-xs whitespace-nowrap text-text-subtle">
                  {userMeta}
                </span>
              )}
            </span>
            <button
              onClick={onSignOut}
              title="Sign out"
              className="transition-ads shrink-0 rounded-md p-1.5 text-text-subtle hover:bg-surface-hover hover:text-text"
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
