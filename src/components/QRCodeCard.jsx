import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode as QrIcon } from 'lucide-react';

export default function QRCodeCard({ url }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

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

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(effectiveUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0d2745',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
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
  }, [effectiveUrl]);

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

