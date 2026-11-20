import { useState } from 'react';
import { Check, CheckCircle2, X } from 'lucide-react';
import type { TranslationPack } from '../data/translations';

interface LoadingOverlayProps {
  visible: boolean;
  title: string;
}

export function LoadingOverlay({ visible, title }: LoadingOverlayProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4">
      <div
        className="w-[50px] h-[50px] rounded-full animate-spin"
        style={{
          border: '4px solid rgba(255, 46, 147, 0.25)',
          borderTopColor: '#ff2e93',
        }}
      />
      <h3 className="text-[16px] font-bold text-white">{title}</h3>
    </div>
  );
}

interface SuccessModalProps {
  visible: boolean;
  code: string;
  t: TranslationPack;
  onClose: () => void;
  onQuickLogin: () => void;
}

export function SuccessModal({
  visible,
  code,
  t,
  onClose,
  onQuickLogin,
}: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard fallback
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-[350px] rounded-[20px] p-7 text-center relative view-enter"
        style={{
          background: 'rgba(18, 8, 22, 0.96)',
          border: '2px solid #35d07f',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3.5 text-white/75 hover:text-white cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <CheckCircle2 className="w-12 h-12 text-[#35d07f] mx-auto mb-3" />
        <h2 className="text-[19px] font-black text-[#35d07f]">{t.successTitle}</h2>

        <div
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] my-4"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px dashed #35d07f',
          }}
        >
          <span
            dir="ltr"
            className="font-cyber text-[17px] font-black text-[#35d07f] tracking-[1.5px]"
          >
            {code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1 rounded-[6px] font-bold text-[12px] cursor-pointer transition-colors whitespace-nowrap ${
              copied ? 'bg-white text-[#070309]' : 'bg-[#35d07f] text-[#070309]'
            }`}
          >
            {copied ? (
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {t.copied}
              </span>
            ) : (
              t.dashCopyFast
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-[12px] text-[14px] font-black text-white mb-2.5 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #ff2e93, #b8005c)',
          }}
        >
          {t.close}
        </button>

        <button
          type="button"
          onClick={onQuickLogin}
          className="w-full py-2.5 px-4 rounded-[12px] text-[14px] font-black text-white cursor-pointer hover:brightness-110 transition-all"
          style={{
            background: 'linear-gradient(90deg, #ff2e93, #b8005c)',
          }}
        >
          {t.quickLogin}
        </button>
      </div>
    </div>
  );
}
