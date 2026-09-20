# UI specification

## Navigation

Two shells, chosen by role. Build them as layouts so pages never repeat chrome.

**Student** — `src/app/(student)/layout.tsx` or a shared `<StudentShell>`:

```
┌─────────────────────────────────────────────┐
│ LearnLive        B12-FRONTEND      [ Sajib ▾]│
│ Dashboard · Classes · My attendance          │
└─────────────────────────────────────────────┘
```

The batch code sits in the header permanently. It is the student's identity in
this product and the thing they quote when asking for help.

**Admin** — sidebar:

```
┌──────────┬──────────────────────────────────┐
│ LearnLive│                                  │
│          │                                  │
│ Overview │                                  │
│ Users  ③ │        page content              │
│ Batches  │                                  │
│ Classes  │                                  │
│          │                                  │
│ Sign out │                                  │
└──────────┴──────────────────────────────────┘
```

The badge on **Users** is the pending-verification count from
`useOverviewQuery()`. It is the app's only notification, and it means a real
person is blocked and waiting.

The classroom route (`/classes/[id]/room`) has **no shell**. Full bleed, dark.

## Screens

### Student dashboard

Priority order, top to bottom:

1. **Live now** — a full-width card, brand background, one button: "Join class".
   Only rendered when a live class exists. Nothing goes above it.
2. **Next up** — the next five scheduled classes, each with `formatClassTime`.
3. **Your attendance** — the `overall` block as one line plus a progress bar.

### Class list (student)

Cards, not a table — this is read on a phone. Each card: title, time, duration,
status badge. A live class gets the join button; a scheduled one gets the start
time and no button.

### My attendance

A summary line at the top ("You attended 14 of 18 classes — 77.8%"), then a
table: class, date, time present, percentage, status badge.

Always show the percentage next to the badge. "Absent" on its own reads as an
accusation; "Absent — 54% (60% needed)" reads as a fact the student can check.

### Verification queue

Table with status tabs. Each row: name, email, phone, requested batch code,
registered-at. Two buttons: **Verify** (primary) and **Reject** (ghost, red).

Verify opens a small confirm with a batch select pre-filled to the code they
typed — changeable, because people mistype codes. Reject opens a confirm with a
required reason field, labelled so the admin knows the student will read it.

### Live class panel

```
┌────────────────────────────────────────────────────────┐
│ React Hooks Deep Dive            ● LIVE  ·  42:17       │
│ B12-FRONTEND · 11 of 15 in the room   [Join] [End class]│
├────────────────────────────────────────────────────────┤
│  Student          In room   Present    Progress         │
│  ● Rafi Ahmed        yes      38m   ▓▓▓▓▓▓▓▓░░ 90% ✓    │
│  ● Nusrat Jahan      yes      31m   ▓▓▓▓▓▓▓░░░ 73% ✓    │
│  ○ Tanvir Islam      no       19m   ▓▓▓▓░░░░░░ 45%      │
│  ○ Mehedi Hasan      no        0m   ░░░░░░░░░░  0%      │
└────────────────────────────────────────────────────────┘
```

The threshold marker on each bar is what makes this screen useful — an admin
scanning it should see at a glance who is about to fall short while there is
still time to say something.

Sort by percentage descending, which puts the people at risk at the bottom
where the eye lands last, or offer a sort toggle. Do not sort by name.

### Attendance sheet (ended class)

Stat tiles from `summary`, then the table. An overridden row shows both the
override badge and the computed percentage, greyed. Export CSV builds from
`rows` in the browser.

## Visual language

- Surface `bg-slate-50`, cards white with `border-slate-200`, `rounded-lg`.
- Primary action `brand-600`; destructive `rose-600`.
- Attendance colours come from `attendanceTone` in `@/lib/format` — green for
  present, amber for partial, rose for absent. Never invent a fourth.
- Live status is red with a pulsing dot. It is the only thing in the app that
  animates.
- Numbers in tables use `tabular-nums` so columns line up.

## States every list must have

1. **Loading** — a skeleton shaped like the content, not a centred spinner.
2. **Empty** — `<EmptyState>` saying what would appear here and, when the user
   can act, the button to make it happen.
3. **Error** — the server's `message`, plus a retry button.

A new admin's first login hits the empty state on every single screen. That
first run should read as a product waiting to be set up, not a broken one.
