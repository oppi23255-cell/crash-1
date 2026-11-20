import { ChangeEvent, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Download,
  ImagePlus,
  XCircle,
} from 'lucide-react';
import {
  PLATFORM_BADGE_SRC,
  PLATFORM_DOWNLOAD_URL,
  PLATFORM_NAME,
  PROMO_CODE,
} from '../data/constants';
import type { TranslationPack } from '../data/translations';

interface AffiliateViewProps {
  t: TranslationPack;
  isRtl: boolean;
  onBackToLogin: () => void;
  onStartVerification: (userId: string) => void;
}

export function AffiliateView({
  t,
  isRtl,
  onBackToLogin,
  onStartVerification,
}: AffiliateViewProps) {
  const [verifyId, setVerifyId] = useState('');
  const [depositPreview, setDepositPreview] = useState<string | null>(null);
  const [promoPreview, setPromoPreview] = useState<string | null>(null);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [badgeError, setBadgeError] = useState(false);

  const depositInputRef = useRef<HTMLInputElement>(null);
  const promoInputRef = useRef<HTMLInputElement>(null);

  const isIdValid = verifyId.length === 10 && parseInt(verifyId, 10) >= 1600000000;
  const isIdInvalid = verifyId.length > 0 && !isIdValid;
  const isReadyToVerify = isIdValid && Boolean(depositPreview) && Boolean(promoPreview);

  const handleCopyPromo = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
    } catch {
      // Clipboard fallback
    }
    setCopiedPromo(true);
    window.setTimeout(() => setCopiedPromo(false), 2000);
  };

  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (dataUrl: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setter(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3.5 view-enter">
      <h2 className="text-[18px] font-black text-[#ff70b8] text-center w-full">
        {t.affTitle}
      </h2>

      {/* Platform Selector */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          className="flex-1 py-2.5 px-4 rounded-[14px] text-white font-bold text-[14px] flex flex-col items-center gap-1.5 cursor-pointer transition-all"
          style={{
            border: '2px solid #ff2e93',
            background: 'rgba(255, 46, 147, 0.14)',
            boxShadow: '0 0 20px rgba(255, 46, 147, 0.35)',
          }}
        >
          {!badgeError ? (
            <img
              src={PLATFORM_BADGE_SRC}
              alt={PLATFORM_NAME}
              referrerPolicy="no-referrer"
              onError={() => setBadgeError(true)}
              className="w-[56px] h-[56px] object-cover rounded-[10px]"
            />
          ) : (
            <div className="w-[56px] h-[56px] rounded-[10px] bg-pink-950/60 border border-[#ff2e93]/40 flex items-center justify-center font-cyber text-xs text-[#ff70b8]">
              XB
            </div>
          )}
          <span className="tracking-wider text-xs font-cyber">
            {t.platformLabel}
          </span>
        </button>
      </div>

      {/* 5 Activation Steps */}
      <div className="w-full flex flex-col gap-2.5 my-1">
        <div
          className="flex items-center gap-3 p-2.5 rounded-[12px] transition-colors hover:bg-[#ff2e93]/14"
          style={{
            background: 'rgba(255, 46, 147, 0.07)',
            border: '1px solid rgba(255, 46, 147, 0.2)',
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[#ff2e93] text-white flex items-center justify-center font-black text-[14px] shrink-0">
            1
          </div>
          <div className="flex-1 text-[13px] sm:text-[14px] text-[#f5edf3] leading-snug">
            {t.step1Prefix} <strong className="font-black">{PLATFORM_NAME}</strong>
          </div>
        </div>

        <div
          className="flex items-center gap-3 p-2.5 rounded-[12px] transition-colors hover:bg-[#ff2e93]/14"
          style={{
            background: 'rgba(255, 46, 147, 0.07)',
            border: '1px solid rgba(255, 46, 147, 0.2)',
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[#ff2e93] text-white flex items-center justify-center font-black text-[14px] shrink-0">
            2
          </div>
          <div className="flex-1 text-[13px] sm:text-[14px] text-[#f5edf3] leading-snug">
            {t.step2Prefix} (
            <span className="text-[#ff70b8] font-black">{PROMO_CODE}</span>)
          </div>
        </div>

        {[t.step3, t.step4, t.step5].map((stepText, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2.5 rounded-[12px] transition-colors hover:bg-[#ff2e93]/14"
            style={{
              background: 'rgba(255, 46, 147, 0.07)',
              border: '1px solid rgba(255, 46, 147, 0.2)',
            }}
          >
            <div className="w-8 h-8 rounded-full bg-[#ff2e93] text-white flex items-center justify-center font-black text-[14px] shrink-0">
              {idx + 3}
            </div>
            <div className="flex-1 text-[13px] sm:text-[14px] text-[#f5edf3] leading-snug">
              {stepText}
            </div>
          </div>
        ))}
      </div>

      {/* Promo Box */}
      <div
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-[8px]"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px dashed #ff2e93',
        }}
      >
        <span className="font-cyber text-[18px] font-black text-[#ff70b8] tracking-[2px]">
          {PROMO_CODE}
        </span>
        <button
          type="button"
          onClick={handleCopyPromo}
          className={`lightning-btn px-3 py-1.5 rounded-[6px] font-bold text-[13px] cursor-pointer transition-colors whitespace-nowrap ${
            copiedPromo
              ? 'bg-white text-[#070309]'
              : 'bg-[#ff2e93] text-white hover:bg-[#e60073]'
          }`}
        >
          {copiedPromo ? (
            <span className="inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {t.copied}
            </span>
          ) : (
            t.copyBtn
          )}
        </button>
      </div>

      {/* Download Platform CTA */}
      <a
        href={PLATFORM_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="lightning-btn w-full py-3 px-4 rounded-[12px] text-[15px] font-black text-white flex items-center justify-center gap-2.5 cursor-pointer transition-opacity hover:opacity-95 whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #ff2e93, #b8005c)',
          boxShadow: '0 10px 30px rgba(255, 46, 147, 0.35)',
        }}
      >
        <Download className="w-[18px] h-[18px] shrink-0" />
        <span>{t.downloadPlatform}</span>
      </a>

      {/* Verification Form Box */}
      <div
        className="w-full rounded-[15px] p-4 text-center"
        style={{
          background: 'rgba(0, 0, 0, 0.42)',
          border: '1px solid rgba(255, 46, 147, 0.35)',
        }}
      >
        <h3 className="text-[15px] font-black text-[#ff70b8] mb-3">{t.verifyTitle}</h3>

        <div className="relative w-full mb-3.5">
          <input
            type="tel"
            inputMode="numeric"
            value={verifyId}
            onChange={(e) => setVerifyId(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder={t.verifyIdPlace}
            autoComplete="off"
            className={`w-full py-3 rounded-[12px] text-[15px] text-white placeholder:text-white/45 outline-none transition-all ${
              isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'
            }`}
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: `1px solid ${
                isIdValid
                  ? '#ff2e93'
                  : isIdInvalid
                    ? '#ff4d6d'
                    : 'rgba(255, 255, 255, 0.14)'
              }`,
            }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${
              isRtl ? 'right-3.5' : 'left-3.5'
            }`}
          >
            {isIdValid ? (
              <CheckCircle2 className="w-[18px] h-[18px] text-[#35d07f]" />
            ) : isIdInvalid ? (
              <XCircle className="w-[18px] h-[18px] text-[#ff4d6d]" />
            ) : (
              <BadgeCheck className="w-[18px] h-[18px] text-[#ff2e93]" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          {/* Deposit Upload */}
          <div
            className="rounded-[16px] p-2.5"
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 46, 147, 0.2)',
            }}
          >
            <label className="block font-black text-[11px] text-[#a896a5] mb-2 truncate">
              {t.depositLabel}
            </label>
            <button
              type="button"
              onClick={() => depositInputRef.current?.click()}
              className="w-full h-[120px] rounded-[14px] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{
                background: depositPreview
                  ? `url(${depositPreview}) center/cover no-repeat`
                  : 'rgba(0, 0, 0, 0.15)',
                border: depositPreview
                  ? '2px solid #ff2e93'
                  : '2px dashed rgba(255, 46, 147, 0.5)',
              }}
            >
              {!depositPreview && (
                <ImagePlus className="w-7 h-7 text-[#ff2e93]/70 mb-2" />
              )}
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] text-[#f5edf3] font-bold backdrop-blur-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.55)',
                  border: '1px solid rgba(255, 46, 147, 0.35)',
                }}
              >
                {t.uploadDeposit}
              </span>
            </button>
            <input
              ref={depositInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setDepositPreview)}
            />
          </div>

          {/* Promocode Upload */}
          <div
            className="rounded-[16px] p-2.5"
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 46, 147, 0.2)',
            }}
          >
            <label className="block font-black text-[11px] text-[#a896a5] mb-2 truncate">
              {t.promocodeLabel}
            </label>
            <button
              type="button"
              onClick={() => promoInputRef.current?.click()}
              className="w-full h-[120px] rounded-[14px] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{
                background: promoPreview
                  ? `url(${promoPreview}) center/cover no-repeat`
                  : 'rgba(0, 0, 0, 0.15)',
                border: promoPreview
                  ? '2px solid #ff2e93'
                  : '2px dashed rgba(255, 46, 147, 0.5)',
              }}
            >
              {!promoPreview && (
                <ImagePlus className="w-7 h-7 text-[#ff2e93]/70 mb-2" />
              )}
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] text-[#f5edf3] font-bold backdrop-blur-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.55)',
                  border: '1px solid rgba(255, 46, 147, 0.35)',
                }}
              >
                {t.uploadPromocode}
              </span>
            </button>
            <input
              ref={promoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setPromoPreview)}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!isReadyToVerify}
          onClick={() => isReadyToVerify && onStartVerification(verifyId)}
          className={`lightning-btn w-full py-3 px-4 rounded-[12px] font-black text-[14px] text-white transition-all whitespace-nowrap ${
            isReadyToVerify
              ? 'opacity-100 cursor-pointer hover:brightness-110'
              : 'opacity-45 cursor-not-allowed'
          }`}
          style={{
            background: 'linear-gradient(90deg, #ff2e93, #b8005c)',
          }}
        >
          {t.verifyBtn}
        </button>
      </div>

      {/* Back to Login */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="lightning-btn w-full py-3 px-4 rounded-[12px] text-[15px] font-black text-white flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-95 whitespace-nowrap"
        style={{
          background: 'linear-gradient(90deg, #ff2e93, #b8005c)',
        }}
      >
        {isRtl ? (
          <ArrowRight className="w-[18px] h-[18px] shrink-0" />
        ) : (
          <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
        )}
        <span>{t.backBtn}</span>
      </button>
    </div>
  );
}
