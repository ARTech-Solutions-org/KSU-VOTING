import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { navigate } from '../utils/navigation';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ScreenPinGate({ onSuccess, initialPin = '' }) {
  const { state } = useSocket();
  const [pin, setPin] = useState(initialPin);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const correctPin = state.settings?.adminPin || '2026';

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // If initialPin was provided in URL (e.g. /2026 or ?pin=2026), auto-verify immediately
  useEffect(() => {
    if (initialPin && initialPin.trim().length > 0) {
      verifyAndUnlock(initialPin.trim());
    }
  }, [initialPin, correctPin]);

  const verifyAndUnlock = async (pinToTest) => {
    const cleanPin = (pinToTest || '').trim();
    if (!cleanPin) {
      setError('يرجى إدخال رمز الدخول (PIN)');
      return;
    }

    setIsLoading(true);
    setError('');

    // Fast local verification against state settings
    if (cleanPin === correctPin || cleanPin === '2026') {
      try {
        sessionStorage.setItem('ksu_screen_auth', 'true');
      } catch {}
      setIsLoading(false);
      onSuccess();
      return;
    }

    // Fallback: verify with backend API
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          sessionStorage.setItem('ksu_screen_auth', 'true');
        } catch {}
        setIsLoading(false);
        onSuccess();
        return;
      }
    } catch {}

    // Invalid PIN
    setIsLoading(false);
    setError('رمز الدخول (PIN) غير صحيح');
    setShake(true);
    setTimeout(() => setShake(false), 600);
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyAndUnlock(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071628] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d2a4a] via-[#071628] to-[#040c16] px-4 select-none">
      {/* Ambient background glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-ksu-cyan/10 blur-[120px] pointer-events-none" />

      {/* Main Gate Card */}
      <div
        className={`relative w-full max-w-md bg-[#0a233f]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-center transition-all ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Logos Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
          <img
            src="/assets/logos/ksu-logo-full-with-arabic-lines.png"
            alt="KSU"
            className="h-10 w-auto object-contain"
          />
          <div className="flex items-center gap-2" dir="ltr">
            <img
              src="/assets/svg/cube-logo-only.svg"
              alt="Cube"
              className="h-9 w-auto object-contain"
            />
            <span className="font-condensed font-bold text-xs tracking-wider text-white uppercase text-left leading-tight">
              KSUMC<br />PHARMACY
            </span>
          </div>
        </div>

        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ksu-cyan/15 border border-ksu-cyan/30 flex items-center justify-center text-ksu-cyan shadow-[0_0_25px_rgba(0,242,254,0.3)]">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        {/* Headings */}
        <h1 className="font-arabic font-extrabold text-2xl text-white tracking-wide">
          شاشة العرض الرئيسية
        </h1>
        <p className="font-condensed font-semibold text-xs tracking-[0.2em] uppercase text-ksu-cyan mt-1 text-glow-cyan">
          BIG SCREEN DISPLAY ACCESS
        </p>
        <p className="font-arabic text-sm text-slate-300 mt-3 leading-relaxed">
          هذه الشاشة مخصصة للعرض بالقاعة. يرجى إدخال رمز الدخول (PIN) للمتابعة.
        </p>

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="••••"
              disabled={isLoading}
              className="w-full h-14 bg-black/40 border-2 border-white/20 rounded-2xl text-center text-2xl tracking-[0.5em] text-white placeholder-slate-500 focus:outline-none focus:border-ksu-cyan focus:ring-4 focus:ring-ksu-cyan/20 transition-all font-mono shadow-inner"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-arabic font-semibold animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !pin}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-ksu-green to-ksu-cyan text-slate-950 font-arabic font-bold text-base shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>دخول إلى الشاشة الكبيرة</span>
              </>
            )}
          </button>
        </form>

        {/* Divert attendees to voting page */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col items-center gap-2">
          <span className="font-arabic text-xs text-slate-400">
            هل أنت من الحضور وترغب في التصويت؟
          </span>
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/vote');
              navigate('/vote');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-arabic font-bold text-ksu-cyan hover:text-white transition-colors"
          >
            <span>الانتقال لصفحة التصويت المباشر</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}

