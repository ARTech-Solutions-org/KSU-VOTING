import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { parseOptionName } from '../utils/bidi';
import { Trophy, Award, Medal, Sparkles } from 'lucide-react';

export default function ResultsBars({
  options = [],
  totalVotes = 0,
  showCounts = true,
  showPercentages = true,
  showTopN = 0,
  revealMode = false,
  revealedCount = 0,
}) {
  // Sort options high to low by votes
  const sortedOptions = [...options].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  // Filter top N if configured
  const displayOptions = showTopN > 0 ? sortedOptions.slice(0, showTopN) : sortedOptions;
  const maxVotes = sortedOptions[0]?.votes || 1;

  // Track if #1 was just revealed to fire confetti
  const prevRevealedCount = useRef(revealedCount);

  useEffect(() => {
    if (revealMode && revealedCount >= displayOptions.length && prevRevealedCount.current < displayOptions.length) {
      // Fire celebration confetti when #1 (winner) is revealed
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#27b373', '#f59e0b', '#ffffff'],
        });
      } catch {}
    }
    prevRevealedCount.current = revealedCount;
  }, [revealMode, revealedCount, displayOptions.length]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-[clamp(5px,0.85vh,11px)] px-2 md:px-4">
      {displayOptions.map((opt, index) => {
        const rank = index + 1;
        const votes = opt.votes || 0;
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
        const barWidthPct = totalVotes > 0 ? Math.max(4, Math.round((votes / maxVotes) * 100)) : 0;
        const { title, subtitle, titleDir, subtitleDir, hasSubtitle } = parseOptionName(opt);

        // In Reveal Mode:
        // Rank 1 is the LAST to be revealed. Rank 6 is the FIRST to be revealed.
        // So an option is revealed if (displayOptions.length - index) <= revealedCount
        const isRevealed = !revealMode || displayOptions.length - index <= revealedCount;

        // Styling based on rank
        const isFirst = rank === 1;
        const isSecond = rank === 2;
        const isThird = rank === 3;

        let rankBadgeBg = 'bg-white/10 text-slate-300 border-white/20';
        let barGradient = 'from-ksu-green to-ksu-teal';
        let cardBorder = 'border-white/10';
        let glowShadow = '';

        if (isFirst) {
          rankBadgeBg = 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 font-black border-amber-300';
          barGradient = 'from-emerald-500 via-teal-400 to-cyan-300';
          cardBorder = 'border-amber-400/50';
          glowShadow = 'shadow-[0_0_35px_rgba(245,158,11,0.25)]';
        } else if (isSecond) {
          rankBadgeBg = 'bg-gradient-to-r from-slate-300 to-slate-100 text-slate-900 font-bold border-slate-200';
          barGradient = 'from-ksu-green to-cyan-400';
          cardBorder = 'border-slate-300/40';
          glowShadow = 'shadow-[0_0_20px_rgba(148,163,184,0.15)]';
        } else if (isThird) {
          rankBadgeBg = 'bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold border-amber-600';
          barGradient = 'from-ksu-green to-teal-500';
          cardBorder = 'border-amber-600/30';
        }

        return (
          <div
            key={opt.id}
            style={{ animationDelay: `${index * 80}ms` }}
            className={`relative rounded-xl md:rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-700 animate-result-row-in ${cardBorder} ${glowShadow} ${
              isFirst ? 'bg-[#0f3458]/85 scale-[1.01]' : 'bg-[#0a233f]/75'
            } ${!isRevealed ? 'opacity-40 grayscale' : 'opacity-100'}`}
          >
            {/* Background percentage fill bar */}
            {isRevealed && (
              <div
                className={`absolute top-0 bottom-0 right-0 bg-gradient-to-l ${barGradient} opacity-20 transition-all duration-1000 ease-out`}
                style={{ width: `${barWidthPct}%` }}
              />
            )}

            {/* Glowing leading edge bar */}
            {isRevealed && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-ksu-cyan shadow-[0_0_15px_#00f2fe] transition-all duration-1000 ease-out"
                style={{ right: `${barWidthPct}%` }}
              />
            )}

            {/* Content row - Fluid scaling */}
            <div className="relative z-10 flex items-center justify-between px-[clamp(8px,1.2vw,18px)] py-[clamp(5px,0.8vh,12px)] gap-2 md:gap-4">
              {/* Left side: Rank badge + Option name */}
              <div className="flex items-center gap-[clamp(6px,0.9vw,14px)] min-w-0 flex-1">
                {/* Rank badge */}
                <div
                  className={`flex items-center justify-center w-[clamp(24px,3.2vh,38px)] h-[clamp(24px,3.2vh,38px)] rounded-lg md:rounded-xl border shadow-md font-condensed text-[clamp(11px,1.5vh,17px)] shrink-0 ${rankBadgeBg}`}
                >
                  {isFirst ? (
                    <Trophy className="w-[clamp(12px,1.7vh,18px)] h-[clamp(12px,1.7vh,18px)] text-slate-950" />
                  ) : isSecond ? (
                    <Award className="w-[clamp(12px,1.7vh,18px)] h-[clamp(12px,1.7vh,18px)] text-slate-900" />
                  ) : isThird ? (
                    <Medal className="w-[clamp(12px,1.7vh,18px)] h-[clamp(12px,1.7vh,18px)] text-white" />
                  ) : (
                    <span>{rank}</span>
                  )}
                </div>

                {/* Option Name with 2-line bilingual support */}
                <div className="flex flex-col min-w-0 flex-1 justify-center leading-tight">
                  {isRevealed ? (
                    <>
                      <bdi
                        dir={titleDir}
                        className={`font-arabic font-extrabold truncate text-white ${
                          isFirst
                            ? 'text-[clamp(12px,1.7vh,18px)] text-glow-white'
                            : 'text-[clamp(11px,1.5vh,16px)]'
                        }`}
                      >
                        {title}
                      </bdi>
                      {hasSubtitle && (
                        <bdi
                          dir={subtitleDir}
                          className="font-arabic font-medium text-[clamp(9px,1.1vh,12px)] text-cyan-200/90 truncate mt-0.5"
                        >
                          {subtitle}
                        </bdi>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-ksu-cyan" />
                      <span className="font-arabic font-bold text-[clamp(11px,1.4vh,15px)] tracking-widest">
                        قيد الكشف...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: Percentages and Vote Count */}
              <div className="flex items-center gap-[clamp(6px,1vw,14px)] shrink-0">
                {isRevealed ? (
                  <>
                    {/* Vote count */}
                    {showCounts && (
                      <div className="text-left font-condensed font-extrabold text-[clamp(12px,1.7vh,18px)] text-slate-200 min-w-[42px] leading-none">
                        <span>{votes.toLocaleString()}</span>
                        <span className="text-[clamp(8px,1vh,10px)] uppercase text-slate-400 font-semibold ml-1">
                          صوت
                        </span>
                      </div>
                    )}

                    {/* Percentage Pill */}
                    {showPercentages && (
                      <div
                        className={`flex items-center justify-center px-[clamp(6px,0.8vw,12px)] py-[clamp(2px,0.4vh,5px)] rounded-full font-condensed font-black text-[clamp(11px,1.5vh,15px)] border shadow-sm ${
                          isFirst
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-ksu-cyan/20 text-ksu-cyan border-ksu-cyan/40'
                        }`}
                      >
                        <span>{percentage}%</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-condensed text-[clamp(10px,1.2vh,12px)] text-slate-400">
                    ???
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

