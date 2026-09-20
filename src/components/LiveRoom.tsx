'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useHeartbeatMutation, useJoinClassMutation } from '@/store/api/classApi';
import { errorCode, errorMessage } from '@/store/api/baseApi';
import { formatDuration } from '@/lib/format';
import type { JoinGrant } from '@/lib/types';

/**
 * The classroom.
 *
 * Three responsibilities, in order of how badly they break if done wrong:
 *
 *  1. Get a LiveKit credential from OUR server and connect with it. The token
 *     is minted per entry and never cached — see `joinClass`.
 *  2. Keep the heartbeat running while connected. It drives the admin's live
 *     panel only; attendance is recorded server-side from LiveKit's own
 *     presence events, so a student who blocks this request loses nothing and
 *     gains nothing.
 *  3. Show the student roughly how much of the class they have sat through.
 *
 * The time shown in (3) is a LOCAL ESTIMATE and is labelled as one. The real
 * figure is computed by the server at the end of the class from LiveKit's
 * connection log. They will normally agree to within a few seconds; they will
 * differ if the tab was suspended or the connection dropped without a clean
 * disconnect, and when they differ the server is right.
 */

const HEARTBEAT_INTERVAL_MS = 30_000;

interface LiveRoomProps {
  classId: string;
  /** Where to send the user when they leave or the class ends. */
  exitHref: string;
}

export function LiveRoom({ classId, exitHref }: LiveRoomProps) {
  const router = useRouter();
  const [joinClass, { isLoading: isJoining }] = useJoinClassMutation();

  const [grant, setGrant] = useState<JoinGrant | null>(null);
  const [error, setError] = useState<{ message: string; code: string | null } | null>(null);
  const [connected, setConnected] = useState(false);

  // Asked for once on mount. React 18+ mounts effects twice in development, and
  // a second mint would hand out a token nobody uses, so the request is guarded.
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    void (async () => {
      try {
        setGrant(await joinClass(classId).unwrap());
      } catch (err) {
        setError({ message: errorMessage(err, 'Could not join this class.'), code: errorCode(err) });
      }
    })();
  }, [classId, joinClass]);

  const handleDisconnected = useCallback(() => {
    setConnected(false);
    router.push(exitHref);
  }, [exitHref, router]);

  if (isJoining || (!grant && !error)) {
    return <RoomMessage title="Joining the class…" body="Setting up your audio and video." />;
  }

  if (error) {
    return (
      <RoomMessage
        title={error.code === 'CLASS_NOT_LIVE' ? 'This class is not running' : 'Could not join'}
        body={error.message}
        action={{ label: 'Back to classes', href: exitHref }}
      />
    );
  }

  if (!grant) return null;

  return (
    <div className="flex h-dvh flex-col bg-slate-950">
      <LiveKitRoom
        token={grant.token}
        serverUrl={grant.wsUrl}
        connect
        video
        audio
        data-lk-theme="default"
        className="flex-1"
        onConnected={() => setConnected(true)}
        onDisconnected={handleDisconnected}
        onError={(err) => setError({ message: err.message, code: null })}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>

      <Heartbeat classId={classId} active={connected} />

      {!grant.isHost && (
        <PresenceEstimate
          connected={connected}
          startedAt={grant.classSession.startedAt}
          thresholdPct={grant.classSession.attendanceThresholdPct}
          scheduledDurationMin={grant.classSession.scheduledDurationMin}
        />
      )}
    </div>
  );
}

/**
 * Pings the server every 30 seconds while connected.
 *
 * Deliberately renders nothing and is deliberately not load-bearing: if it
 * fails silently, the only consequence is that the admin's live panel shows a
 * stale dot. Errors are swallowed for exactly that reason — a failed heartbeat
 * must never interrupt a class with a toast.
 */
function Heartbeat({ classId, active }: { classId: string; active: boolean }) {
  const [heartbeat] = useHeartbeatMutation();

  useEffect(() => {
    if (!active) return;

    const ping = () => {
      void heartbeat(classId).unwrap().catch(() => undefined);
    };

    ping();
    const id = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, classId, heartbeat]);

  return null;
}

interface PresenceEstimateProps {
  connected: boolean;
  startedAt: string | null;
  thresholdPct: number;
  scheduledDurationMin: number;
}

/**
 * The student's own attendance meter.
 *
 * Accumulated connected time is tracked in a ref rather than state so that the
 * running total survives re-renders, and the interval only adds time while the
 * connection is actually up — a student who disconnects stops accruing, which
 * is what the server will conclude too.
 *
 * The denominator is the scheduled length while the class is still running,
 * because the actual length is not known until it ends. That makes this a
 * conservative estimate: a class that finishes early will finalise at a higher
 * percentage than the bar showed, never a lower one.
 */
function PresenceEstimate({
  connected,
  startedAt,
  thresholdPct,
  scheduledDurationMin,
}: PresenceEstimateProps) {
  const accumulatedMs = useRef(0);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!connected) return;

    const tick = 1000;
    const id = setInterval(() => {
      accumulatedMs.current += tick;
      forceRender((n) => n + 1);
    }, tick);

    return () => clearInterval(id);
  }, [connected]);

  const denominatorMs = scheduledDurationMin * 60_000;
  const pct = Math.min(100, (accumulatedMs.current / denominatorMs) * 100);
  const met = pct >= thresholdPct;
  const remainingMs = Math.max(0, (thresholdPct / 100) * denominatorMs - accumulatedMs.current);

  return (
    <div className="border-t border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span>
          {met ? (
            <span className="font-medium text-emerald-400">
              Attendance secured — {formatDuration(accumulatedMs.current)} in class
            </span>
          ) : (
            <>
              <span className="font-medium text-white">{formatDuration(accumulatedMs.current)}</span> in
              class · {formatDuration(remainingMs)} more for attendance
            </>
          )}
        </span>
        <span className="tabular-nums text-slate-400">
          {Math.floor(pct)}% / {thresholdPct}%
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuenow={Math.floor(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Your attendance progress"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-emerald-500' : 'bg-sky-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Estimated from your time in this room. Your coach&apos;s record is final.
        {startedAt ? '' : ' Waiting for the class to start.'}
      </p>
    </div>
  );
}

function RoomMessage({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <p className="max-w-md text-sm text-slate-400">{body}</p>
      {action && (
        <a
          href={action.href}
          className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
