'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useOverviewQuery } from '@/store/api/adminApi';
import { useLogoutMutation } from '@/store/api/authApi';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/batches', label: 'Batches' },
  { href: '/admin/classes', label: 'Classes' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: overview } = useOverviewQuery();
  const pathname = usePathname();
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const pending = overview?.pendingVerifications ?? 0;

  const onSignOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      // No session to clear.
    }
    router.replace('/login');
  };

  return (
    <div className="min-h-dvh md:flex">
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:min-h-dvh md:w-56 md:border-b-0 md:border-r">
        <div className="px-4 py-4 font-semibold text-slate-900">LearnLive</div>

        <nav className="flex gap-1 px-2 md:flex-col">
          {NAV.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  active
                    ? 'bg-slate-100 font-medium text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                {item.href === '/admin/users' && pending > 0 && (
                  <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-2">
          <button
            onClick={onSignOut}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
