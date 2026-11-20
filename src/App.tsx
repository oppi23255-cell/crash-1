import { useCallback, useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { AffiliateView } from './components/AffiliateView';
import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { LoadingOverlay, SuccessModal } from './components/Modals';
import { SplashScreen } from './components/SplashScreen';
import { TopHeader } from './components/TopHeader';
import { CRASH_LOGO_SRC } from './data/constants';
import { TRANSLATIONS, type LangCode } from './data/translations';

type ViewMode = 'loginView' | 'affiliateView' | 'dashboardView';

interface StoredGeneratedCode {
  userId: string;
  code: string;
  expiry: number;
  platform: string;
}

interface StoredSession {
  userId: string;
  expiry: number;
  platform: string;
}

function detectInitialLang(): LangCode {
  const saved = localStorage.getItem('site_lang') as LangCode | null;
  if (saved && TRANSLATIONS[saved]) return saved;
  const browser = navigator.language.slice(0, 2) as LangCode;
  return TRANSLATIONS[browser] ? browser : 'ar';
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [lang, setLang] = useState<LangCode>(detectInitialLang);
  const [activeView, setActiveView] = useState<ViewMode>(() => {
    try {
      const session = JSON.parse(localStorage.getItem('loggedIn') || 'null') as StoredSession | null;
      if (session && Date.now() < session.expiry) return 'dashboardView';
    } catch {
      // Ignore malformed storage
    }
    return 'loginView';
  });

  const [session, setSession] = useState<StoredSession | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('loggedIn') || 'null') as StoredSession | null;
      if (saved && Date.now() < saved.expiry) return saved;
    } catch {
      // Ignore
    }
    return null;
  });

  const [loginUserId, setLoginUserId] = useState('');
  const [loginActCode, setLoginActCode] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [loadingModal, setLoadingModal] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [emblemError, setEmblemError] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Sync HTML dir and lang attributes
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('site_lang', lang);
  }, [lang, isRtl]);

  // Splash auto-dismiss after 2.2s
  useEffect(() => {
    const id = window.setTimeout(() => setShowSplash(false), 2200);
    return () => window.clearTimeout(id);
  }, []);

  const handleLoginSubmit = (userId: string, actCode: string) => {
    if (!userId || !actCode) {
      setLoginError(t.errEmpty);
      return;
    }
    if (userId.length < 10 || parseInt(userId, 10) < 1600000000) {
      setLoginError(t.errId);
      return;
    }

    try {
      const stored = JSON.parse(
        localStorage.getItem('generatedCode') || 'null'
      ) as StoredGeneratedCode | null;
      if (
        stored &&
        stored.userId === userId &&
        stored.code === actCode &&
        Date.now() < stored.expiry
      ) {
        const newSession: StoredSession = {
          userId,
          expiry: stored.expiry,
          platform: 'XpriBet',
        };
        localStorage.setItem('loggedIn', JSON.stringify(newSession));
        setSession(newSession);
        setLoginError(null);
        setActiveView('dashboardView');
        return;
      }
    } catch {
      // Ignore storage error
    }

    setLoginError(t.dashErrorLogin);
  };

  const handleStartVerification = async (verifiedUserId: string) => {
    setLoadingModal(true);
    await new Promise((r) => window.setTimeout(r, 1500));
    const randomCode = `CRASH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const generated: StoredGeneratedCode = {
      userId: verifiedUserId,
      code: randomCode,
      expiry: Date.now() + 3600000,
      platform: 'XpriBet',
    };
    localStorage.setItem('generatedCode', JSON.stringify(generated));
    setLoadingModal(false);
    setSuccessCode(randomCode);
  };

  const handleQuickLogin = () => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('generatedCode') || 'null'
      ) as StoredGeneratedCode | null;
      if (stored) {
        setLoginUserId(stored.userId);
        setLoginActCode(stored.code);
        setLoginError(null);
      }
    } catch {
      // Ignore
    }
    setSuccessCode(null);
    setActiveView('loginView');
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('loggedIn');
    setSession(null);
    setActiveView('loginView');
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {showSplash && <SplashScreen onSkip={() => setShowSplash(false)} />}

      {/* Rising Pink Background Particles */}
      <div className="bg-circles" aria-hidden="true">
        <div />
        <div />
        <div />
        <div />
      </div>

      {/* Top Fixed Header */}
      <TopHeader
        currentLang={lang}
        days={t.days}
        onChangeLang={(next) => setLang(next)}
      />

      {/* Main Centered Shell */}
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center pt-[64px] pb-10 px-3">
        <div className="w-[94%] max-w-[420px] mt-[54px]">
          <section
            className="w-full rounded-[30px] px-5 sm:px-6 pt-9 pb-7 backdrop-blur-[25px] relative flex flex-col items-center gap-4"
            style={{
              background: 'rgba(18, 10, 20, 0.9)',
              border: '1px solid rgba(255, 46, 147, 0.28)',
              boxShadow:
                '0 25px 50px rgba(0, 0, 0, 0.55), 0 0 42px rgba(255, 46, 147, 0.12)',
            }}
          >
            {/* Floating Morphing Emblem */}
            <div className="absolute -top-[54px] left-1/2 -translate-x-1/2 w-[100px] h-[100px] z-20">
              <div className="profile-hex flex items-center justify-center bg-white p-1.5">
                {!emblemError ? (
                  <img
                    src={CRASH_LOGO_SRC}
                    alt="Crash Hack"
                    referrerPolicy="no-referrer"
                    onError={() => setEmblemError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Rocket className="w-10 h-10 text-[#ff2e93]" />
                )}
              </div>
            </div>

            {/* Brand Title */}
            <div className="text-center mt-3">
              {isRtl ? (
                <h1
                  className="text-[28px] sm:text-[32px] font-black leading-tight"
                  style={{
                    background: 'linear-gradient(to bottom, #ffffff, #ff2e93)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  كراش هاك
                </h1>
              ) : (
                <h1 dir="ltr" className="font-cyber text-[25px] sm:text-[28px] font-black tracking-[2px] leading-tight">
                  <span
                    style={{
                      background: 'linear-gradient(to bottom, #ffffff, #ff2e93)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Crash
                  </span>{' '}
                  <span className="text-[#ff2e93]">Hack</span>
                </h1>
              )}
              <p className="text-[11px] text-[#a896a5] tracking-[1.5px] mt-0.5 uppercase">
                LIVE MULTIPLIER
              </p>
            </div>

            {/* Active View */}
            {activeView === 'loginView' && (
              <LoginView
                t={t}
                isRtl={isRtl}
                userId={loginUserId}
                actCode={loginActCode}
                errorMsg={loginError}
                onUserIdChange={(val) => {
                  setLoginUserId(val);
                  if (loginError) setLoginError(null);
                }}
                onActCodeChange={(val) => {
                  setLoginActCode(val);
                  if (loginError) setLoginError(null);
                }}
                onSubmit={handleLoginSubmit}
                onOpenAffiliate={() => {
                  setLoginError(null);
                  setActiveView('affiliateView');
                }}
              />
            )}

            {activeView === 'affiliateView' && (
              <AffiliateView
                t={t}
                isRtl={isRtl}
                onBackToLogin={() => setActiveView('loginView')}
                onStartVerification={handleStartVerification}
              />
            )}

            {activeView === 'dashboardView' && session && (
              <DashboardView
                t={t}
                userId={session.userId}
                expiry={session.expiry}
                onLogout={handleLogout}
              />
            )}
          </section>
        </div>
      </main>

      {/* Modals */}
      <LoadingOverlay visible={loadingModal} title={t.loadingTitle} />
      <SuccessModal
        visible={Boolean(successCode)}
        code={successCode ?? ''}
        t={t}
        onClose={() => setSuccessCode(null)}
        onQuickLogin={handleQuickLogin}
      />
    </div>
  );
}
