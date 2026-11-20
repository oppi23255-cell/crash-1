export const FIREBASE_DB_URL = 'https://mrwan-dd795-default-rtdb.firebaseio.com';

export type CrashPhase = 'waiting' | 'flight' | 'crashed';

export interface CrashCurrentData {
  roundNumber: number;
  phase: CrashPhase;
  crashPoint: number;
  roundStartedAt?: number;
  flightStartedAt?: number;
  updatedAt?: number;
  clientId?: string;
}

export interface CrashSyncState {
  status: 'connecting' | 'connected' | 'closed' | 'error';
  closedReason?: 'permission_denied' | 'disabled' | 'false_root';
  current: CrashCurrentData | null;
  lockedPrediction: {
    roundNumber: number;
    crashPoint: number;
  } | null;
}

/**
 * Sends a custom override to crash/override ONLY if the target round
 * has not started flying yet (future round or current round during waiting).
 */
export async function sendCrashOverride(
  targetRoundNumber: number,
  crashPoint: number,
  currentData: CrashCurrentData | null
): Promise<{ ok: boolean; reason?: string }> {
  if (!Number.isInteger(targetRoundNumber) || crashPoint < 1) {
    return { ok: false, reason: 'invalid_payload' };
  }

  if (currentData) {
    const isCurrentWaiting =
      targetRoundNumber === currentData.roundNumber && currentData.phase === 'waiting';
    const isFutureRound = targetRoundNumber > currentData.roundNumber;

    if (!isCurrentWaiting && !isFutureRound) {
      return { ok: false, reason: 'round_already_started' };
    }
  }

  const payload = {
    roundNumber: targetRoundNumber,
    crashPoint: Number(crashPoint.toFixed(2)),
    updatedAt: Date.now(),
  };

  const res = await fetch(`${FIREBASE_DB_URL}/crash/override.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { ok: false, reason: `http_${res.status}` };
  }

  return { ok: true };
}

export function subscribeCrashDatabase(
  onUpdate: (state: CrashSyncState) => void
): () => void {
  let stopped = false;
  let lastShownRound: number | null = null;
  let lockedPrediction: { roundNumber: number; crashPoint: number } | null = null;
  let inFlight = false;
  let eventSource: EventSource | null = null;
  let enabledEventSource: EventSource | null = null;

  const emitClosed = (reason: 'permission_denied' | 'disabled' | 'false_root') => {
    lastShownRound = null;
    lockedPrediction = null;
    onUpdate({
      status: 'closed',
      closedReason: reason,
      current: null,
      lockedPrediction: null,
    });
  };

  const pollOnce = async () => {
    if (stopped || inFlight) return;
    inFlight = true;

    try {
      const [enabledRes, currentRes] = await Promise.all([
        fetch(`${FIREBASE_DB_URL}/crash/enabled.json`, { cache: 'no-store' }),
        fetch(`${FIREBASE_DB_URL}/crash/current.json`, { cache: 'no-store' }),
      ]);

      if (stopped) return;

      // Check PERMISSION_DENIED HTTP codes
      if (
        enabledRes.status === 401 ||
        enabledRes.status === 403 ||
        currentRes.status === 401 ||
        currentRes.status === 403
      ) {
        emitClosed('permission_denied');
        return;
      }

      if (!enabledRes.ok || !currentRes.ok) {
        onUpdate({
          status: 'error',
          current: null,
          lockedPrediction,
        });
        return;
      }

      const [enabledJson, currentJson] = await Promise.all([
        enabledRes.json(),
        currentRes.json(),
      ]);

      if (stopped) return;

      // Check Firebase JSON error payloads (e.g., PERMISSION_DENIED)
      if (
        (enabledJson && typeof enabledJson === 'object' && 'error' in enabledJson) ||
        (currentJson && typeof currentJson === 'object' && 'error' in currentJson)
      ) {
        emitClosed('permission_denied');
        return;
      }

      // Check crash/enabled === false or crash/current === false
      if (enabledJson === false) {
        emitClosed('disabled');
        return;
      }

      if (currentJson === false) {
        emitClosed('false_root');
        return;
      }

      // If current is null, also verify if /crash itself is false
      if (currentJson === null) {
        const rootRes = await fetch(`${FIREBASE_DB_URL}/crash.json?shallow=true`, {
          cache: 'no-store',
        });
        if (rootRes.status === 401 || rootRes.status === 403) {
          emitClosed('permission_denied');
          return;
        }
        const rootVal = await rootRes.json();
        if (rootVal === false) {
          emitClosed('false_root');
          return;
        }
        if (rootVal && typeof rootVal === 'object' && 'error' in rootVal) {
          emitClosed('permission_denied');
          return;
        }
      }

      const data =
        currentJson && typeof currentJson === 'object'
          ? (currentJson as Partial<CrashCurrentData>)
          : null;

      if (!data || typeof data.roundNumber !== 'number' || typeof data.phase !== 'string') {
        onUpdate({
          status: 'connected',
          current: null,
          lockedPrediction,
        });
        return;
      }

      const currentData: CrashCurrentData = {
        roundNumber: data.roundNumber,
        phase: data.phase as CrashPhase,
        crashPoint: typeof data.crashPoint === 'number' ? data.crashPoint : 0,
        roundStartedAt: data.roundStartedAt,
        flightStartedAt: data.flightStartedAt,
        updatedAt: data.updatedAt,
        clientId: data.clientId,
      };

      // Strict synchronization rule:
      // Update prediction ONLY when phase === "waiting",
      // roundNumber !== lastShownRound, and crashPoint >= 1.
      // Once shown, lock lastShownRound = data.roundNumber through "flight" & "crashed".
      if (
        currentData.phase === 'waiting' &&
        currentData.roundNumber !== lastShownRound &&
        currentData.crashPoint >= 1
      ) {
        lastShownRound = currentData.roundNumber;
        lockedPrediction = {
          roundNumber: currentData.roundNumber,
          crashPoint: currentData.crashPoint,
        };
      }

      onUpdate({
        status: 'connected',
        current: currentData,
        lockedPrediction,
      });
    } catch {
      if (!stopped) {
        onUpdate({
          status: 'error',
          current: null,
          lockedPrediction,
        });
      }
    } finally {
      inFlight = false;
    }
  };

  // Immediate initial sync
  void pollOnce();

  // Real-time SSE streams for instant push triggers (Firebase RTDB REST streaming)
  if (typeof EventSource !== 'undefined') {
    try {
      eventSource = new EventSource(`${FIREBASE_DB_URL}/crash/current.json`);
      eventSource.addEventListener('put', () => void pollOnce());
      eventSource.addEventListener('patch', () => void pollOnce());
      eventSource.addEventListener('auth_revoked', () => emitClosed('permission_denied'));

      enabledEventSource = new EventSource(`${FIREBASE_DB_URL}/crash/enabled.json`);
      enabledEventSource.addEventListener('put', () => void pollOnce());
    } catch {
      // Fallback polling continues every 300ms
    }
  }

  // Fast 300ms polling guarantee
  const intervalId = window.setInterval(() => {
    void pollOnce();
  }, 300);

  return () => {
    stopped = true;
    window.clearInterval(intervalId);
    if (eventSource) eventSource.close();
    if (enabledEventSource) enabledEventSource.close();
  };
}
