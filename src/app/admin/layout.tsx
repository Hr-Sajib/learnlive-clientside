import { RequireAuth } from '@/components/RequireAuth';
import { AdminShell } from '@/components/AdminShell';

/**
 * A route-level layout, not a per-page wrapper, is what makes the sidebar
 * persist across `/admin/*` navigations. Each page used to wrap itself in
 * `<AdminShell>` individually, which meant every click tore the whole shell
 * down and remounted it — visible as the rail collapsing and reopening on
 * every navigation, because the browser's hover state can't survive a DOM
 * node being destroyed and recreated. A layout is exclusively re-rendered,
 * never remounted, for navigations between sibling routes it wraps.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="admin">
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
