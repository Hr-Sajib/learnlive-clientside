import { RequireAuth } from '@/components/RequireAuth';
import { StudentShell } from '@/components/StudentShell';

/**
 * `(student)` is a route group — it groups `dashboard`, `classes` and
 * `attendance` under one persistent shell without adding a URL segment, so
 * `/classes` still resolves here while `/classes/[id]/room` (outside the
 * group, deliberately chrome-free) is untouched.
 *
 * Same reasoning as `admin/layout.tsx`: a layout re-renders across sibling
 * navigations instead of remounting, which is what lets the sidebar's hover
 * state survive a click instead of blinking shut and reopening.
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="student">
      <StudentShell>{children}</StudentShell>
    </RequireAuth>
  );
}
