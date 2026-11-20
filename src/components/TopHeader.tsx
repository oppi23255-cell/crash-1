import { useEffect, useRef, useState } from 'react';
import { LANGUAGE_OPTIONS, type LangCode } from '../data/translations';

interface TopHeaderProps {
  currentLang: LangCode;
  days: [string, string, string, string, string, string, string];
  onChangeLang: (lang: LangCode) => void;
}

export function TopHeader({ currentLang, days, onChangeLang }: TopHeaderProps) {
  const [now, setNow] = useState(() => new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const datePart = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const dayPart = days[now.getDay()] ?? days[0];
  const timePart = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const activeLang = LANGUAGE_OPTIONS.find((l) => l.code === currentLang) ?? LANGUAGE_OPTIONS[0];

  return (
    <header
      className="fixed top-0 left-0 w-full px-4 py-2 flex items-center justify-between z-40 backdrop-blur-md"
      style={{
        background: 'rgba(10, 4, 12, 0.55)',
        borderBottom: '1px solid rgba(255, 46, 147, 0.28)',
      }}
    >
      <div className="flex items-center gap-1.5 font-black text-[11px] sm:text-[14px] whitespace-nowrap shrink-0">
        <span className="font-mono tabular-nums text-[#ff2e93] text-[13px] sm:text-[17px]">
          {timePart}
        </span>
        <span className="text-white/40">|</span>
        <span className="text-[#ff85c0]">{dayPart}</span>
        <span className="text-white/40">-</span>
        <span className="text-[#ff2e93] font-mono tabular-nums">{datePart}</span>
      </div>

      <div className="relative flex items-center shrink-0" dir="ltr" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 hover:bg-[#ff2e93]/20 hover:border-[#ff2e93]"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255, 46, 147, 0.3)',
          }}
          aria-expanded={menuOpen}
          aria-label="Select language"
        >
          <span>{activeLang.flag}</span>
          <span>{activeLang.name}</span>
        </button>

        {menuOpen && (
          <div
            className="absolute top-[42px] left-0 w-[136px] rounded-xl overflow-hidden flex flex-col z-50"
            style={{
              background: 'rgba(18, 8, 22, 0.96)',
              border: '1px solid #ff2e93',
              boxShadow: '0 5px 20px rgba(0, 0, 0, 0.8)',
            }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  onChangeLang(opt.code);
                  setMenuOpen(false);
                }}
                className={`px-3.5 py-2.5 text-left text-[13px] font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                  opt.code === currentLang
                    ? 'bg-[#ff2e93]/25 text-[#ff70b8]'
                    : 'text-white hover:bg-[#ff2e93]/20 hover:text-[#ff70b8]'
                }`}
              >
                <span>{opt.flag}</span>
                <span>{opt.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
