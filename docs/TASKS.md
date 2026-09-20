# Work queue — client

Do these in order. Each page stub already carries its contract in a docblock —
read it before starting the task.

After **every** task: `npx tsc --noEmit && npx next build`. Both must pass.

Do not add dependencies. Everything needed is already installed.

---

### C1 — Shared UI kit
**New files under `src/components/ui/`**

Build these first; every later task uses them. Keep them small and unstyled
beyond what is described — this is a kit, not a design system.

| Component | Props | Notes |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'danger' \| 'ghost'`, `size`, `isLoading`, plus native button props | `isLoading` disables and shows a spinner |
| `Input` | native input props + `label`, `error`, `hint` | Renders the error under the field, red border when set |
| `Select` | same shape as `Input`, plus `options: {value,label}[]` | |
| `Card` | `title?`, `action?`, `children` | The one container used everywhere |
| `Badge` | `tone: 'green' \| 'amber' \| 'red' \| 'slate'`, `children` | Feed it from `attendanceTone` / `classStatusTone` |
| `Table` | `columns`, `rows`, `empty` | Horizontally scrollable on mobile |
| `Modal` | `open`, `onClose`, `title`, `children` | Closes on Escape and backdrop click, traps focus |
| `ConfirmDialog` | `open`, `title`, `body`, `confirmLabel`, `tone`, `onConfirm`, `onClose` | Used for End class, Reject, Suspend |
| `EmptyState` | `title`, `body`, `action?` | |
| `Spinner` | `size?` | |
| `StatTile` | `label`, `value`, `hint?`, `tone?`, `href?` | The dashboard counters |
| `ProgressBar` | `value` (0–100), `threshold?`, `tone?` | Draws a marker line at `threshold` — this is how a student sees the 60% bar |

Accessibility is not optional here: every input needs a real `<label>`, the
modal needs `role="dialog"` and `aria-modal`, and the progress bar needs
`role="progressbar"` with `aria-valuenow`.

---

### C2 — Auth pages
**Files:** `src/app/login/page.tsx`, `register/page.tsx`, `pending/page.tsx`

Contracts are in each file. The things that matter:

- Registration does **not** sign the user in. On success, go to `/pending`.
- `ACCOUNT_PENDING` on login → `/pending`, not an error toast.
- `ACCOUNT_REJECTED` → show `errorMessage(err)` inline; it carries the admin's
  reason, and a student who was rejected needs to read it.
- `UNKNOWN_BATCH_CODE` → set the error on the `batchCode` field. It is the
  single most common mistake on that form.

**Done when:** a new user can register, is told they are awaiting approval, and
after an admin verifies them can sign in and land on `/dashboard`.

---

### C3 — Student pages
**Files:** `src/app/dashboard/page.tsx`, `classes/page.tsx`, `attendance/page.tsx`

Plus the student shell: a header with the batch code, nav links, and sign-out.

The live-class banner on the dashboard is the highest-priority element in the
whole student experience — a student opening the app during class time must see
one button and understand it immediately.

**Done when:** a student can see a live class, join it, and afterwards see the
percentage they were credited on `/attendance`.

---

### C4 — Admin dashboard, verification queue, batches
**Files:** `src/app/admin/page.tsx`, `admin/users/page.tsx`, `admin/batches/page.tsx`

Plus the admin shell: sidebar nav (Overview, Users, Batches, Classes).

The verification queue is where an admin spends their time. Verify and reject
should each be one click plus one confirmation, not a multi-step flow.

**Done when:** an admin can create a batch, see a student's registration
appear, verify them, and watch the student's status change.

---

### C5 — Batch detail and class management
**Files:** `src/app/admin/batches/[id]/page.tsx`, `admin/classes/page.tsx`

Three tabs on batch detail (roster / classes / analytics) and a class list with
status-driven row actions.

In the analytics tab, highlight every student below the threshold. That row is
the only reason an admin opens the page.

**Done when:** an admin can schedule a class for a batch, start it, and end it,
and the analytics tab shows the result.

---

### C6 — The live panel and attendance sheet
**File:** `src/app/admin/classes/[id]/page.tsx`

One route with two faces, switched on class status. The hardest UI task in the
repo; the full contract is in the file's docblock.

Details that are easy to get wrong:

- Poll `useLiveAttendanceQuery` at exactly **10000 ms**. Not faster.
- `projectedStatus` is the column that matters while a class runs — it answers
  "who is about to miss attendance", which is what the admin is watching for.
- After the class ends, show the computed percentage **next to** any overridden
  result. The override does not erase the evidence and the UI should not either.
- The CSV export is built in the browser from `rows`. There is no server
  endpoint for it and you should not add one.

**Done when:** an admin can watch presence climb during a live class, end it,
review the sheet, override one student with a reason, and export the CSV.

---

### C7 — Polish pass

- Loading skeletons on every list, not bare spinners.
- An `EmptyState` on every list that can legitimately be empty.
- Mobile: the student side is used on phones. Every table scrolls; nothing
  overflows the viewport.
- An error boundary (`src/app/error.tsx`) and a `not-found.tsx`.

---

## Not in scope

Do not build, and do not ask about: dark mode, i18n, chat, class recordings,
profile photo upload, password reset, notifications, or payments. They are
deliberately out of v1.
