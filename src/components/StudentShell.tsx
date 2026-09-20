'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard, Video, ClipboardCheck } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useLogoutMutation } from '@/store/api/authApi';
import { Sidebar, type SidebarItem } from '@/components/Sidebar';

const ITEMS: SidebarItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/classes', label: 'Classes', icon: Video },
  { href: '/attendance', label: 'My attendance', icon: ClipboardCheck },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
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
    <Sidebar
      brand="LearnLive"
      brandMeta={user?.batch?.code}
      items={ITEMS}
      userName={user?.name ?? 'Student'}
      userMeta={user?.batch?.code}
      onSignOut={onSignOut}
    >
      {children}
    </Sidebar>
  );
}
