import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode as QrIcon, Check } from 'lucide-react';

export default function QRCodeCard({ url, variant = 'corner' }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Resolve absolute voting URL safely across local, LAN, and Vercel environments
  const effectiveUrl = (() => {
    if (url && typeof url === 'string' && url.trim().length > 0) {
      if (url.startsWith('http://') || url.startsWith('https://')) return url.trim();
      if (url.startsWith('/')) {
        return typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
      }
      return typeof window !== 'undefined' ? `${window.location.origin}/${url}` : url;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/vote`;
    }
    return 'http://localhost:3000/vote';
  })();

  const isHero = variant === 'hero';

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(effectiveUrl, {
      width: isHero ? 560 : 240,
      margin: isHero ? 2 : 1,
      color: {
        dark: '#0a233f',
        light: '#ffffff',
      },
      errorCorrectionLevel: isHero ? 'Q' : 'M',
    })
      .then((dataUri) => {
        if (isMounted) setQrDataUrl(dataUri);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveUrl, isHero]);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(effectiveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Hero Display: Centered under Idle Mode text on Big Screen (calibrated for 3072x1536 LED walls)
  if (isHero) {
    return (
      <div
        className="relative group cursor-pointer select-none"
        onClick={handleCopy}
        title="انقر لنسخ رابط التصويت"
      >
        {/* Ambient atmospheric glow behind hero card */}
        <div className="absolute -inset-2 bg-gradient-to-r from-ksu-green/40 via-ksu-cyan/50 to-emerald-400/30 rounded-[32px] blur-2xl opacity-40 group-hover:opacity-75 transition-opacity duration-700 animate-pulse-slow" />

        {/* Card Body */}
        <div className="relative flex flex-col items-center bg-[#09223c]/90 backdrop-blur-2xl border border-ksu-cyan/40 rounded-3xl p-[clamp(12px,1.8vh,26px)] shadow-[0_20px_50px_rgba(0,0,0,0.65)] transition-all duration-300 group-hover:scale-[1.02] group-hover:border-ksu-cyan">
          {/* QR Code Container with crisp white backing */}
          <div className="relative p-[clamp(8px,1.2vh,18px)] bg-white rounded-2xl md:rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.25)] overflow-hidden flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Scan QR Code to Vote"
                className="w-[clamp(160px,21vh,320px)] h-[clamp(160px,21vh,320px)] object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-[clamp(160px,21vh,320px)] h-[clamp(160px,21vh,320px)] flex items-center justify-center bg-slate-50 text-slate-400">
                <QrIcon className="w-12 h-12 animate-pulse text-ksu-cyan" />
              </div>
            )}
          </div>

          {/* Bilingual Call to Action */}
          <div className="mt-[clamp(8px,1.3vh,18px)] text-center flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 text-white font-arabic font-extrabold text-[clamp(13px,1.8vh,22px)] tracking-wide whitespace-nowrap">
              <Smartphone className="w-[clamp(14px,2vh,22px)] h-[clamp(14px,2vh,22px)] text-ksu-cyan animate-bounce" />
              <span>امسح الكود وصوّت الآن</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-ksu-cyan font-condensed tracking-[0.2em] uppercase font-bold text-[clamp(10px,1.3vh,16px)] text-glow-cyan">
                SCAN TO VOTE
              </span>
              {copied && (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-condensed tracking-wider ml-2 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-400/40">
                  <Check className="w-3 h-3" /> تم نسخ الرابط
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Corner Display: Default bottom corner card (used during Results mode)
  return (
    <div className="relative group">
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-ksu-green to-ksu-cyan rounded-3xl blur-md opacity-35 group-hover:opacity-60 transition duration-500 animate-pulse-slow" />

      {/* Main card - Fluid scaling with clamp */}
      <div className="relative flex flex-col items-center bg-[#0d2745]/85 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl p-[clamp(8px,1.2vh,16px)] shadow-2xl transition-all duration-300">
        {/* QR Code Container with crisp white backing */}
        <div className="relative p-[clamp(4px,0.8vh,10px)] bg-white rounded-xl md:rounded-2xl shadow-inner overflow-hidden flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-[clamp(75px,11vh,136px)] h-[clamp(75px,11vh,136px)] object-contain rounded-md md:rounded-lg transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-[clamp(75px,11vh,136px)] h-[clamp(75px,11vh,136px)] flex items-center justify-center bg-slate-100 text-slate-400">
              <QrIcon className="w-8 h-8 animate-pulse text-ksu-cyan" />
            </div>
          )}
        </div>

        {/* Call to action - Fluid typography */}
        <div className="mt-[clamp(4px,0.8vh,10px)] text-center">
          <div className="flex items-center justify-center gap-1.5 text-white font-arabic font-bold text-[clamp(11px,1.4vh,14px)] tracking-wide whitespace-nowrap">
            <Smartphone className="w-[clamp(12px,1.5vh,16px)] h-[clamp(12px,1.5vh,16px)] text-ksu-cyan animate-bounce" />
            <span>امسح الكود وصوّت</span>
          </div>
          <p className="text-ksu-cyan/90 font-condensed tracking-wider uppercase text-[clamp(9px,1.1vh,12px)] font-semibold mt-0.5">
            Scan to vote
          </p>
        </div>
      </div>
    </div>
  );
}
