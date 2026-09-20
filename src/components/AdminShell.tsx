'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Layers, Video } from 'lucide-react';
import { useOverviewQuery } from '@/store/api/adminApi';
import { useLogoutMutation } from '@/store/api/authApi';
import { useSession } from '@/hooks/useSession';
import { Sidebar, type SidebarItem } from '@/components/Sidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: overview } = useOverviewQuery();
  const { user } = useSession();
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const pending = overview?.pendingVerifications ?? 0;

  const items: SidebarItem[] = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: 'Users', icon: Users, badge: pending },
    { href: '/admin/batches', label: 'Batches', icon: Layers },
    { href: '/admin/classes', label: 'Classes', icon: Video },
  ];

  const onSignOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      // No session to clear.
    }
    router.replace('/login');
  };

  return (
    <Sidebar
      brand="LearnLive"
      brandMeta="Admin"
      items={items}
      userName={user?.name ?? 'Admin'}
      userMeta="Administrator"
      onSignOut={onSignOut}
    >
      {children}
    </Sidebar>
  );
}
