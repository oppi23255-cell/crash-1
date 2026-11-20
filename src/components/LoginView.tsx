import { FormEvent, useState } from 'react';
import { KeyRound, User } from 'lucide-react';
import type { TranslationPack } from '../data/translations';

interface LoginViewProps {
  t: TranslationPack;
  isRtl: boolean;
  userId: string;
  actCode: string;
  errorMsg: string | null;
  onUserIdChange: (val: string) => void;
  onActCodeChange: (val: string) => void;
  onSubmit: (userId: string, actCode: string) => void;
  onOpenAffiliate: () => void;
}

export function LoginView({
  t,
  isRtl,
  userId,
  actCode,
  errorMsg,
  onUserIdChange,
  onActCodeChange,
  onSubmit,
  onOpenAffiliate,
}: LoginViewProps) {
  const [focusedField, setFocusedField] = useState<'id' | 'code' | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(userId.trim(), actCode.trim());
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 view-enter">
      {errorMsg && (
        <div
          role="alert"
          className="w-full rounded-[10px] p-3 text-center text-[13px] font-bold"
          style={{
            background: 'rgba(255, 46, 147, 0.15)',
            border: '1px solid var(--bad)',
            color: 'var(--bad)',
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative w-full mb-3.5">
          <input
            type="tel"
            inputMode="numeric"
            value={userId}
            onFocus={() => setFocusedField('id')}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => onUserIdChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder={t.idPlaceholder}
            autoComplete="off"
            className={`w-full py-3 rounded-[12px] text-[15px] text-white placeholder:text-white/45 outline-none transition-all ${
              isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'
            }`}
            style={{
              background: 'rgba(0, 0, 0, 0.34)',
              border: `1px solid ${focusedField === 'id' ? '#ff2e93' : 'rgba(255, 255, 255, 0.14)'}`,
              boxShadow: focusedField === 'id' ? '0 0 15px rgba(255, 46, 147, 0.3)' : 'none',
            }}
          />
          <User
            className={`w-[18px] h-[18px] text-[#ff2e93] absolute top-1/2 -translate-y-1/2 pointer-events-none ${
              isRtl ? 'right-3.5' : 'left-3.5'
            }`}
          />
        </div>

        <div className="relative w-full mb-4">
          <input
            type="text"
            value={actCode}
            onFocus={() => setFocusedField('code')}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => onActCodeChange(e.target.value)}
            placeholder={t.codePlaceholder}
            autoComplete="off"
            className={`w-full py-3 rounded-[12px] text-[15px] text-white placeholder:text-white/45 outline-none transition-all ${
              isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'
            }`}
            style={{
              background: 'rgba(0, 0, 0, 0.34)',
              border: `1px solid ${focusedField === 'code' ? '#ff2e93' : 'rgba(255, 255, 255, 0.14)'}`,
              boxShadow: focusedField === 'code' ? '0 0 15px rgba(255, 46, 147, 0.3)' : 'none',
            }}
          />
          <KeyRound
            className={`w-[18px] h-[18px] text-[#ff2e93] absolute top-1/2 -translate-y-1/2 pointer-events-none ${
              isRtl ? 'right-3.5' : 'left-3.5'
            }`}
          />
        </div>

        <button
          type="submit"
          className="lightning-btn w-full py-3 px-4 rounded-[12px] text-[15px] font-black text-white flex items-center justify-center gap-2.5 cursor-pointer transition-transform active:scale-[0.99] whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #ff2e93, #b8005c)',
            boxShadow: '0 10px 30px rgba(255, 46, 147, 0.42)',
          }}
        >
          <span>{t.loginBtn}</span>
        </button>
      </form>

      <button
        type="button"
        onClick={onOpenAffiliate}
        className="lightning-btn w-full py-3 px-4 rounded-[12px] text-[15px] font-black text-[#ff70b8] flex items-center justify-center gap-2.5 cursor-pointer transition-colors hover:bg-[#ff2e93]/12 whitespace-nowrap"
        style={{
          background: 'transparent',
          border: '1px solid #ff2e93',
        }}
      >
        <span>{t.getCodeBtn}</span>
      </button>
    </div>
  );
}
