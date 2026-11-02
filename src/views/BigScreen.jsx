import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import BigScreenBackground from '../components/BigScreenBackground';
import QRCodeCard from '../components/QRCodeCard';
import LiveCounter from '../components/LiveCounter';
import ResultsBars from '../components/ResultsBars';
import { sound } from '../hooks/useSound';
import { navigate } from '../utils/navigation';
import { Maximize2, Minimize2, Eye, RefreshCw, BarChart3, Radio } from 'lucide-react';

export default function BigScreen() {
  const { state, socket, latestVoteEvent } = useSocket();
  const [screenMode, setScreenMode] = useState(state.settings?.screenMode || 'idle');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(true);
  const cursorTimerRef = useRef(null);
  const stageRef = useRef(null);

  const toggleBottomBar = () => {
    setShowBottomBar((prev) => !prev);
  };

  // Sync screenMode with server settings
  useEffect(() => {
    if (state.settings?.screenMode && state.settings.screenMode !== screenMode) {
      triggerTransition(state.settings.screenMode);
    }
  }, [state.settings?.screenMode]);

  // Cinematic 3D transition between Idle and Results (matching KSU-v.2 shockwave & cube)
  const triggerTransition = (targetMode) => {
    if (targetMode === screenMode) return;
    setIsTransitioning(true);
    sound.playTransitionWhoosh();

    // After animation midpoint (750ms), swap views seamlessly under the shockwave
    setTimeout(() => {
      setScreenMode(targetMode);
    }, 750);

    // End transition layer after full 2.2s shockwave completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2200);
  };

  const toggleMode = () => {
    const nextMode = screenMode === 'idle' ? 'results' : 'idle';
    triggerTransition(nextMode);
    if (socket) {
      socket.emit('admin:setScreenMode', { mode: nextMode });
    }
  };

  // Keyboard shortcuts: R for Results toggle, F for fullscreen, A for Admin (\admin), H for Hide bottom
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        toggleMode();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'a' || e.key === 'A') {
        navigate('/admin');
      } else if (e.key === 'h' || e.key === 'H') {
        toggleBottomBar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenMode]);

  // Auto-cycle mode between Idle and Results
  useEffect(() => {
    if (!state.settings?.autoCycle || state.settings?.revealMode) return;

    const intervalSeconds = Math.max(5, state.settings?.autoCycleInterval || 15);
    const timer = setInterval(() => {
      const nextMode = screenMode === 'idle' ? 'results' : 'idle';
      triggerTransition(nextMode);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [state.settings?.autoCycle, state.settings?.autoCycleInterval, screenMode, state.settings?.revealMode]);

  // Auto-hide cursor after 3s of inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setCursorHidden(false);
      clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => {
        setCursorHidden(true);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(cursorTimerRef.current);
    };
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={stageRef}
      className={`stage-container ${cursorHidden ? 'cursor-none' : 'cursor-default'}`}
    >
      {/* Fluid Full-Bleed Master Stage */}
      <div className="stage-16-9 w-full h-full relative select-none">
        {/* Animated Background & GPU Canvas Particles */}
        <BigScreenBackground rippleTrigger={latestVoteEvent?.timestamp} />

        {/* Cinematic 3D Shockwave & Signal Transition Layer (From KSU-v.2) */}
        <div className={`transition-layer ${isTransitioning ? 'active' : ''}`} aria-hidden={!isTransitioning}>
          <div className="transition-wave" />
          <img className="transition-cube" src="/assets/svg/cube-logo-only.svg" alt="" />
          <span className="transition-word">
            {screenMode === 'idle' ? 'LIVE RESULTS' : 'AI INNOVATION'}
          </span>
        </div>

        {/* Test Mode Banner if active */}
        {state.settings?.testMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-1 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs uppercase tracking-widest shadow-lg flex items-center gap-1.5 animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>وضع التجربة والمحاكاة - TEST MODE</span>
          </div>
        )}

        {/* =========================================================================
            HEADER LAYER: Swapped Logos - KSU Logo (Top-Left) & Meeting Logo (Top-Right)
           ========================================================================= */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-[clamp(16px,3.5vw,64px)] pt-[clamp(14px,2.5vh,40px)] pointer-events-none">
          {/* Top-Left: King Saud University Logo including Arabic sub-lines */}
          <button
            onClick={() => navigate('/admin')}
            title="انقر لفتح لوحة التحكم (/admin)"
            className="pointer-events-auto flex items-center group focus:outline-none transition-transform duration-300 hover:scale-105 active:scale-95 animate-logo-intro"
          >
            <div className="relative">
              <img
                src="/assets/logos/ksu-logo-full-with-arabic-lines.png"
                alt="King Saud University"
                className="h-[clamp(38px,6.5vh,88px)] w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-condensed tracking-wider uppercase text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#0d2745]/90 px-2 py-0.5 rounded-full border border-amber-400/40 whitespace-nowrap shadow-lg">
                Admin Panel (A)
              </span>
            </div>
          </button>

          {/* Top-Right: 6th Annual KSUMC Pharmacy Meeting Cube Logo (Fully Responsive & Unclipped) */}
          <button
            onClick={toggleMode}
            title="انقر للتبديل بين الشاشة الترحيبية والنتائج (R)"
            dir="ltr"
            className="pointer-events-auto flex items-center group focus:outline-none transition-transform duration-300 hover:scale-105 active:scale-95 animate-logo-intro [animation-delay:150ms]"
          >
            <div className="relative flex items-center gap-2.5 sm:gap-3.5">
              <img
                src="/assets/svg/cube-logo-only.svg"
                alt="KSUMC Cube"
                className="h-[clamp(36px,6.2vh,84px)] w-auto object-contain drop-shadow-[0_4px_14px_rgba(0,242,254,0.35)] shrink-0"
              />
              <div className="flex flex-col text-left leading-none select-none">
                <span className="font-condensed font-semibold text-[clamp(11px,1.65vh,22px)] tracking-[0.14em] text-white/95 uppercase whitespace-nowrap mb-1">
                  6TH ANNUAL KSUMC
                </span>
                <span className="font-condensed font-extrabold text-[clamp(13px,2.1vh,28px)] tracking-[0.07em] text-white uppercase whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  PHARMACY MEETING
                </span>
              </div>

              {/* Subtle hover pulse indicator */}
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-condensed tracking-wider uppercase text-ksu-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#0d2745]/90 px-2 py-0.5 rounded-full border border-ksu-cyan/30 whitespace-nowrap shadow-lg">
                {screenMode === 'idle' ? 'Show Results (R)' : 'Show Welcome (R)'}
              </span>
            </div>
          </button>
        </header>

        {/* =========================================================================
            MAIN STAGE CONTENT: IDLE MODE vs RESULTS MODE
           ========================================================================= */}
        <main className="absolute inset-0 z-20 flex flex-col justify-center items-center px-4 md:px-12 pointer-events-none">
          {/* VIEW A: IDLE (ATTRACT) MODE */}
          {screenMode === 'idle' && (
            <div
              className={`flex flex-col items-center justify-center text-center -translate-y-[clamp(14px,2.6vh,44px)] transition-all duration-700 ease-out transform ${
                isTransitioning ? 'scale-90 opacity-0 -translate-y-12' : 'scale-100 opacity-100'
              }`}
            >
              {/* Text Group: Shifted Upwards */}
              <div className="flex flex-col items-center justify-center">
                {/* Cyan Eyebrow: AI INNOVATION COMPETITION */}
                <div className="relative mb-[clamp(4px,0.7vh,10px)]">
                  <img
                    src="/assets/text/ai-innovation-competition-cyan.png"
                    alt="AI INNOVATION COMPETITION"
                    className="h-[clamp(16px,2.6vh,38px)] w-auto object-contain drop-shadow-[0_0_20px_rgba(0,242,254,0.7)] animate-masked-reveal"
                  />
                </div>

                {/* Thin White Divider Line under Cyan text */}
                <div className="relative w-full max-w-[clamp(260px,46vw,840px)] mb-[clamp(6px,1.1vh,16px)]">
                  <img
                    src="/assets/text/divider-line-white.png"
                    alt=""
                    className="w-full h-[clamp(2px,0.25vh,4px)] object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-line-reveal"
                  />
                </div>

                {/* Main Arabic Title: ذكاء يُبتكر */}
                <div className="relative group">
                  <img
                    src="/assets/text/title-arabic-white.png"
                    alt="ذكاء يُبتكر"
                    className="h-[clamp(70px,13.5vh,185px)] w-auto object-contain drop-shadow-[0_10px_35px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-[1.02] animate-title-reveal"
                  />
                </div>
              </div>

              {/* Large Hero QR Code Card directly underneath */}
              <div className="mt-[clamp(12px,2.2vh,34px)] pointer-events-auto animate-card-intro">
                <QRCodeCard url={state.settings?.votingUrl} variant="hero" />
              </div>
            </div>
          )}

          {/* VIEW B: RESULTS MODE */}
          {screenMode === 'results' && (
            <div
              className={`w-full flex flex-col items-center justify-center transition-all duration-700 ease-out transform ${
                isTransitioning ? 'scale-90 opacity-0 translate-y-8' : 'scale-100 opacity-100 translate-y-0'
              }`}
            >
              {/* Results Header */}
              <div className="flex flex-col items-center mb-[clamp(6px,1.2vh,16px)] text-center animate-results-rise">
                <div className="flex items-center gap-2 text-ksu-cyan font-condensed tracking-wider uppercase text-[clamp(11px,1.4vh,15px)] font-extrabold text-glow-cyan">
                  <BarChart3 className="w-[clamp(14px,1.7vh,19px)] h-[clamp(14px,1.7vh,19px)]" />
                  <span>AI Innovation Competition - Live Results</span>
                </div>
                <h2 className="font-arabic font-black text-[clamp(18px,2.8vh,34px)] text-white tracking-wide text-glow-white mt-0.5">
                  نتائج التصويت المباشر
                </h2>
                <div className="results-total mt-1 text-[clamp(10px,1.2vh,13px)]">
                  <span>Total votes</span>
                  <strong className="text-[clamp(13px,1.8vh,18px)]">{new Intl.NumberFormat('en-US').format(state.stats?.totalVotes || 0)}</strong>
                </div>
                {state.settings?.revealMode && (
                  <div className="mt-1 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-arabic text-[clamp(10px,1.2vh,12px)] font-bold">
                    وضع الكشف التدريجي (المرحلة {state.settings?.revealedCount || 0} من{' '}
                    {state.options?.length || 0})
                  </div>
                )}
              </div>

              {/* Results Horizontal Bars */}
              <ResultsBars
                options={state.options}
                totalVotes={state.stats?.totalVotes || 0}
                showCounts={state.settings?.showCounts}
                showPercentages={state.settings?.showPercentages}
                showTopN={state.settings?.showTopN}
                revealMode={state.settings?.revealMode}
                revealedCount={state.settings?.revealedCount || 0}
              />
            </div>
          )}
        </main>

        {/* =========================================================================
            BOTTOM LAYER: Live Counter (Right) & Corner QR Code (Left in Results Mode)
            Clickable: Clicking either element (or pressing H) toggles visibility
           ========================================================================= */}
        <footer className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-between px-[clamp(16px,3.5vw,64px)] pb-[clamp(14px,2.5vh,40px)] pointer-events-none">
          {/* Bottom-Right (in RTL): Live Total Votes Counter */}
          <div
            onClick={toggleBottomBar}
            title={showBottomBar ? 'انقر لإخفاء عدد الأصوات والـ QR (H)' : 'انقر لإعادة إظهار عدد الأصوات والـ QR (H)'}
            className={`pointer-events-auto cursor-pointer min-w-[clamp(140px,16vw,200px)] min-h-[clamp(60px,8vh,90px)] flex items-end justify-start transition-all duration-500 ease-out transform ${
              showBottomBar
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 translate-y-3 hover:opacity-20'
            }`}
          >
            <LiveCounter
              count={state.stats?.totalVotes || 0}
              isVotingOpen={state.settings?.votingState === 'open'}
            />
          </div>

          {/* Bottom-Left (in RTL): Corner QR Code Card - Shown in Results Mode */}
          {screenMode === 'results' ? (
            <div
              onClick={toggleBottomBar}
              title={showBottomBar ? 'انقر لإخفاء الـ QR (H)' : 'انقر لإعادة إظهار الـ QR (H)'}
              className={`pointer-events-auto cursor-pointer min-w-[clamp(100px,12vw,160px)] min-h-[clamp(100px,12vw,160px)] flex items-end justify-end transition-all duration-500 ease-out transform ${
                showBottomBar
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 translate-y-3 hover:opacity-20'
              }`}
            >
              <QRCodeCard url={state.settings?.votingUrl} variant="corner" />
            </div>
          ) : (
            <div className="w-[clamp(100px,12vw,160px)] pointer-events-none" />
          )}
        </footer>

        {/* Quick floating controls: Fullscreen & Sound indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            title="تبديل وضع ملء الشاشة (F)"
            className="p-1.5 rounded-lg bg-black/40 text-white/80 hover:text-white hover:bg-black/70 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMode}
            title="تبديل العرض (R)"
            className="p-1.5 rounded-lg bg-black/40 text-white/80 hover:text-white hover:bg-black/70 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

