import { useEffect, useRef, useState } from 'react';
import { Fingerprint, Globe, Lock, LogOut, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { PLATFORM_BADGE_SRC } from '../data/constants';
import type { TranslationPack } from '../data/translations';
import { type CrashSyncState, subscribeCrashDatabase } from '../services/crashFirebase';

interface DashboardViewProps {
  t: TranslationPack;
  userId: string;
  expiry: number;
  onLogout: () => void;
}

function playSignalTone(freq = 640) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.19);
  } catch {
    // Optional audio cue
  }
}

export function DashboardView({ t, userId, expiry, onLogout }: DashboardViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((expiry - Date.now()) / 1000))
  );
  const totalSecondsRef = useRef(Math.max(1, Math.ceil((expiry - Date.now()) / 1000)));

  const [syncState, setSyncState] = useState<CrashSyncState>({
    status: 'connecting',
    current: null,
    lockedPrediction: null,
  });
  const [popFlash, setPopFlash] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [badgeError, setBadgeError] = useState(false);

  const prevLockedRoundRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Session countdown timer
  useEffect(() => {
    totalSecondsRef.current = Math.max(1, Math.ceil((expiry - Date.now()) / 1000));
    const updateTimer = () => {
      const rem = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setRemainingSeconds(rem);
      if (rem <= 0) {
        onLogout();
      }
    };
    updateTimer();
    const id = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(id);
  }, [expiry, onLogout]);

  // Real-time Firebase subscription (SSE + 300ms fast polling)
  useEffect(() => {
    let popTimer: number | null = null;

    const unsubscribe = subscribeCrashDatabase((nextState) => {
      setSyncState(nextState);

      if (nextState.status === 'closed') {
        prevLockedRoundRef.current = null;
        return;
      }

      const nextLockedRound = nextState.lockedPrediction?.roundNumber ?? null;
      if (nextLockedRound !== null && nextLockedRound !== prevLockedRoundRef.current) {
        prevLockedRoundRef.current = nextLockedRound;
        setPopFlash(true);
        if (soundEnabledRef.current) {
          playSignalTone(640);
        }
        if (popTimer) window.clearTimeout(popTimer);
        popTimer = window.setTimeout(() => setPopFlash(false), 600);
      }
    });

    return () => {
      unsubscribe();
      if (popTimer) window.clearTimeout(popTimer);
    };
  }, []);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(
    100,
    Math.max(0, (remainingSeconds / totalSecondsRef.current) * 100)
  );

  const isClosed = syncState.status === 'closed';
  const isError = syncState.status === 'error';
  const locked = syncState.lockedPrediction;
  const current = syncState.current;

  const phaseText =
    current?.phase === 'waiting'
      ? t.phaseWaiting
      : current?.phase === 'flight'
        ? t.phaseFlight
        : current?.phase === 'crashed'
          ? t.phaseCrashed
          : null;

  return (
    <div className="w-full flex flex-col items-center gap-3.5 view-enter">
      {/* Big Multiplier Box */}
      <div
        aria-live="polite"
        className="big-box-grid w-full h-[270px] sm:h-[300px] rounded-[26px] relative overflow-hidden flex flex-col items-center justify-center px-5 text-center transition-shadow duration-300"
        style={{
          border: `1px solid ${isClosed ? 'rgba(255, 77, 109, 0.5)' : 'rgba(255, 46, 147, 0.3)'}`,
          background: isClosed
            ? 'radial-gradient(ellipse at 50% 30%, rgba(255, 77, 109, 0.14), transparent 65%), rgba(0, 0, 0, 0.55)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(255, 46, 147, 0.15), transparent 62%), rgba(0, 0, 0, 0.38)',
          boxShadow: popFlash
            ? '0 30px 90px rgba(255, 46, 147, 0.38), 0 10px 30px rgba(184, 0, 92, 0.28)'
            : '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Sound toggle in corner */}
        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-xl text-[#a896a5] hover:text-white bg-black/40 border border-white/10 cursor-pointer transition-colors"
          aria-label="Toggle sound"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#35d07f]" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {isClosed ? (
          <div className="relative z-10 flex flex-col items-center gap-2.5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 77, 109, 0.15)',
                border: '1px solid rgba(255, 77, 109, 0.45)',
              }}
            >
              <Lock className="w-7 h-7 text-[#ff4d6d]" />
            </div>
            <h2 className="text-[18px] font-black text-[#ff4d6d]">{t.dbClosedTitle}</h2>
            <p className="text-[12px] text-[#f5edf3]/80 max-w-[260px] leading-relaxed">
              {t.dbClosedDesc}
            </p>
          </div>
        ) : isError && !locked ? (
          <div className="relative z-10 flex flex-col items-center gap-2.5">
            <WifiOff className="w-9 h-9 text-[#ff70b8]" />
            <p className="text-[13px] font-bold text-[#f5edf3]/80 max-w-[240px]">
              {t.dbErrorDesc}
            </p>
          </div>
        ) : (
          <>
            <div
              className={`font-cyber relative z-10 text-[52px] sm:text-[64px] font-black tracking-[2px] tabular-nums transition-transform duration-200 ${
                popFlash
                  ? 'scale-108 text-[#35d07f]'
                  : locked
                    ? 'scale-100 text-white'
                    : 'scale-100 text-white/40'
              }`}
              style={{
                textShadow: popFlash
                  ? '0 12px 42px rgba(53, 208, 127, 0.65)'
                  : locked
                    ? '0 6px 30px rgba(255, 46, 147, 0.65)'
                    : 'none',
              }}
            >
              {locked ? `${locked.crashPoint.toFixed(2)}x` : '---'}
            </div>

            <div className="relative z-10 mt-3 flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-[#a896a5]">
              {syncState.status === 'connecting' && !current ? (
                <span>{t.dbConnectingLabel}</span>
              ) : !locked ? (
                <>
                  <span>{t.waitingNextRound}</span>
                  {current && phaseText && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-cyber tabular-nums text-white/70">
                        #{current.roundNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#ff70b8]">{phaseText}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="font-cyber tabular-nums text-white/85">
                    {t.roundLabel} #{locked.roundNumber}
                  </span>
                  {phaseText && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          current?.phase === 'waiting'
                            ? 'text-[#35d07f]'
                            : current?.phase === 'flight'
                              ? 'text-[#ff70b8]'
                              : 'text-[#a896a5]'
                        }
                      >
                        {phaseText}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Info Cards */}
      <div className="w-full flex flex-col gap-3">
        {/* Account ID Card */}
        <div
          className="rounded-[24px] px-4 py-3 flex items-center gap-3.5 backdrop-blur-xl"
          style={{
            background: 'rgba(24, 12, 26, 0.58)',
            border: '1px solid rgba(255, 46, 147, 0.32)',
          }}
        >
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[#ff2e93] shrink-0"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '2px solid rgba(255, 46, 147, 0.45)',
            }}
          >
            <Fingerprint className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div dir="ltr" className="font-cyber text-[14px] font-black text-white tabular-nums truncate">
              {userId || '---'}
            </div>
            <div className="text-[10px] text-white/65 uppercase tracking-wide">
              {t.dashAccountId}
            </div>
          </div>
        </div>

        {/* Platform Card */}
        <div
          className="rounded-[24px] px-4 py-3 flex items-center gap-3.5 backdrop-blur-xl"
          style={{
            background: 'rgba(24, 12, 26, 0.58)',
            border: '1px solid rgba(255, 46, 147, 0.32)',
          }}
        >
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '2px solid rgba(255, 46, 147, 0.45)',
            }}
          >
            {!badgeError ? (
              <img
                src={PLATFORM_BADGE_SRC}
                alt={t.platformLabel}
                referrerPolicy="no-referrer"
                onError={() => setBadgeError(true)}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <Globe className="w-5 h-5 text-[#ff2e93]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-cyber text-[14px] font-black text-white">
              {t.platformLabel}
            </div>
            <div
              className={`text-[10px] font-bold flex items-center gap-1.5 ${
                isClosed ? 'text-[#ff4d6d]' : 'text-[#35d07f]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isClosed ? 'bg-[#ff4d6d]' : 'bg-[#35d07f] animate-pulse'
                }`}
              />
              <span>{isClosed ? t.dbClosedTitle : t.dashActive}</span>
            </div>
          </div>
        </div>

        {/* Remaining Time Card */}
        <div
          className="w-full rounded-[24px] p-4 text-center backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(255, 46, 147, 0.12), rgba(184, 0, 92, 0.08))',
            border: '1px solid rgba(255, 46, 147, 0.38)',
          }}
        >
          <div className="text-[11px] text-white/70 font-bold mb-1">
            {t.dashTimeRemaining}
          </div>
          <div
            dir="ltr"
            className="font-cyber text-[26px] font-black text-white tracking-[2px] tabular-nums"
          >
            {formattedCountdown}
          </div>
          <div className="w-full h-2 rounded-full bg-black/45 overflow-hidden mt-2.5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #b8005c, #ff2e93)',
                boxShadow: '0 0 12px rgba(255, 46, 147, 0.6)',
              }}
            />
          </div>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2.5 px-4 rounded-[12px] text-[13px] font-bold text-[#a896a5] hover:text-white hover:border-[#ff2e93]/50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{t.logoutBtn}</span>
        </button>
      </div>
    </div>
  );
}
