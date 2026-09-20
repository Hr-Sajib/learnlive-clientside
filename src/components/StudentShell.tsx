'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useLogoutMutation } from '@/store/api/authApi';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/classes', label: 'Classes' },
  { href: '/attendance', label: 'My attendance' },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [logout] = useLogoutMutation();

  const onSignOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      // No session to clear.
    }
    router.replace('/login');
  };

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="font-semibold text-slate-900">
              LearnLive
            </Link>
            {user?.batch && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {user.batch.code}
              </span>
            )}
            <nav className="flex items-center gap-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 text-sm ${
                      active
                        ? 'bg-slate-100 font-medium text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.name}</span>
            <button onClick={onSignOut} className="text-sm text-slate-500 hover:text-slate-700">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
