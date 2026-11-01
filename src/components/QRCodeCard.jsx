import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode as QrIcon } from 'lucide-react';

export default function QRCodeCard({ url }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0d2745',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataUri) => {
        setQrDataUrl(dataUri);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
  }, [url]);

  return (
    <div className="relative group">
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-ksu-green to-ksu-cyan rounded-3xl blur-md opacity-35 group-hover:opacity-60 transition duration-500 animate-pulse-slow" />

      {/* Main card */}
      <div className="relative flex flex-col items-center bg-[#0d2745]/85 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl transition-all duration-300">
        {/* QR Code Container with crisp white backing */}
        <div className="relative p-2.5 bg-white rounded-2xl shadow-inner overflow-hidden">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-32 h-32 md:w-36 md:h-36 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-32 h-32 md:w-36 md:h-36 flex items-center justify-center bg-slate-100 text-slate-400">
              <QrIcon className="w-10 h-10 animate-pulse" />
            </div>
          )}
        </div>

        {/* Call to action */}
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-white font-arabic font-bold text-sm tracking-wide">
            <Smartphone className="w-4 h-4 text-ksu-cyan animate-bounce" />
            <span>امسح الكود وصوّت</span>
          </div>
          <p className="text-ksu-cyan/90 font-condensed tracking-wider uppercase text-xs font-semibold mt-0.5">
            Scan to vote
          </p>
        </div>
      </div>
    </div>
  );
}

