'use client';

import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { LiveRoom } from '@/components/LiveRoom';
import { useSession } from '@/hooks/useSession';

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSession();
  const exitHref = user?.role === 'admin' ? `/admin/classes/${id}` : '/classes';

  return (
    <RequireAuth>
      <LiveRoom classId={id} exitHref={exitHref} />
    </RequireAuth>
  );
}
