import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { parseOptionName } from '../utils/bidi';
import { CheckCircle2, AlertCircle, Clock, Lock, Sparkles, Check, Globe } from 'lucide-react';

export default function MobileVote() {
  const { state, voterStatus, submitVote, connected } = useSocket();
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [language, setLanguage] = useState('ar'); // 'ar' | 'en'

  const isAr = language === 'ar';
  const votingState = state.settings?.votingState || 'open';
  const hasVoted = voterStatus && voterStatus.votesRemaining <= 0 && voterStatus.votedOptionIds?.length > 0;
  const canVote = votingState === 'open' && voterStatus?.canVote && !hasVoted;

  const handleSelectOption = (id) => {
    if (!canVote) return;
    setSelectedOptionId(id);
    setErrorMsg('');
  };

  const handleConfirmVote = async () => {
    if (!selectedOptionId || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await submitVote(selectedOptionId);
      if (!res.success) {
        setErrorMsg(res.error || (isAr ? 'تعذر تسجيل التصويت' : 'Failed to submit vote'));
      }
    } catch (err) {
      setErrorMsg(isAr ? 'حدث خطأ في الاتصال، يرجى المحاولة ثانية' : 'Connection error, please retry');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // Find the voted option if locked
  const votedOption = state.options.find((o) => voterStatus?.votedOptionIds?.includes(o.id));

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#071628] text-white flex flex-col justify-between selection:bg-ksu-cyan selection:text-black relative overflow-x-hidden"
    >
      {/* Background Graphic Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 20%, #1d5f53 0%, #153c55 45%, #0d2745 80%, #071628 100%)',
          }}
        />
        <img
          src="/assets/background/background-pattern.png"
          alt=""
          className="w-full h-full object-cover opacity-15 mix-blend-overlay"
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-6">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between pb-5 border-b border-white/10">
          {/* Meeting logo */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/svg/cube-logo-only.svg"
              alt="KSUMC"
              className="w-10 h-10 object-contain drop-shadow"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-condensed font-bold text-xs tracking-wider text-slate-300 uppercase">
                6th Annual KSUMC
              </span>
              <span className="font-condensed font-extrabold text-sm tracking-wide text-white uppercase">
                Pharmacy Meeting
              </span>
            </div>
          </div>

          {/* Language Toggle & Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(isAr ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold transition"
            >
              <Globe className="w-3.5 h-3.5 text-ksu-cyan" />
              <span>{isAr ? 'English' : 'عربي'}</span>
            </button>

            {/* Connection indicator */}
            <span
              title={connected ? (isAr ? 'متصل' : 'Connected') : (isAr ? 'إعادة الاتصال...' : 'Reconnecting...')}
              className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`}
            />
          </div>
        </header>

        {/* Offline Notice if disconnected */}
        {!connected && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'جاري إعادة الاتصال بالخادم... يرجى الانتظار'
                : 'Reconnecting to voting server... Please wait'}
            </span>
          </div>
        )}

        {/* =====================================================================
            STATE 1: VOTING CLOSED
           ===================================================================== */}
        {votingState === 'closed' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-arabic font-extrabold text-2xl text-white mb-2">
              {isAr ? 'انتهت فترة التصويت' : 'Voting Has Concluded'}
            </h2>
            <p className="font-arabic text-slate-300 text-sm max-w-xs leading-relaxed">
              {isAr
                ? 'نشكر جميع المشاركين. تابعوا الشاشة الرئيسية لمشاهدة إعلان الفائزين!'
                : 'Thank you to all participants. Please watch the main big screen for the final results!'}
            </p>
          </div>
        )}

        {/* =====================================================================
            STATE 2: VOTING PAUSED
           ===================================================================== */}
        {votingState === 'paused' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-4 shadow-lg animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="font-arabic font-extrabold text-2xl text-white mb-2">
              {isAr ? 'التصويت متوقف مؤقتاً' : 'Voting Is Paused'}
            </h2>
            <p className="font-arabic text-slate-300 text-sm max-w-xs leading-relaxed">
              {isAr
                ? 'سيتم استئناف التصويت قريباً من قبل المنظمين، يرجى إبقاء هذه الصفحة مفتوحة.'
                : 'Voting will resume shortly. Please keep this screen open.'}
            </p>
          </div>
        )}

        {/* =====================================================================
            STATE 3: ALREADY VOTED (LOCKED & THANK YOU SCREEN)
           ===================================================================== */}
        {hasVoted && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 animate-mobile-in">
            {/* Cinematic Success Orbit & Checkmark from KSU-v.2 */}
            <div className="success-orbit mb-6">
              <div className="success-check">
                ✓
              </div>
            </div>
            <h2 className="font-arabic font-black text-3xl text-white mb-2 text-glow-white">
              {isAr ? 'شكراً لمشاركتك!' : 'Thank You for Voting!'}
            </h2>
            <p className="font-arabic text-emerald-300 text-sm font-semibold mb-6">
              {isAr ? 'لقد تم تسجيل صوتك بنجاح' : 'Your vote has been successfully cast'}
            </p>

            {/* Display the voted project */}
            {votedOption && (
              <div className="w-full p-5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md mb-6 text-center">
                <span className="text-xs uppercase font-condensed tracking-wider text-slate-400 block mb-1">
                  {isAr ? 'صوتك ذهب إلى' : 'You voted for'}
                </span>
                <bdi
                  dir={parseOptionName(votedOption).titleDir}
                  className="font-arabic font-extrabold text-xl text-white block"
                >
                  {parseOptionName(votedOption).title}
                </bdi>
                {parseOptionName(votedOption).hasSubtitle && (
                  <bdi
                    dir={parseOptionName(votedOption).subtitleDir}
                    className="font-arabic font-medium text-sm text-ksu-cyan block mt-1"
                  >
                    {parseOptionName(votedOption).subtitle}
                  </bdi>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-ksu-cyan" />
              <span>
                {isAr
                  ? 'النتائج تظهر مباشرة على شاشة القاعة الرئيسية'
                  : 'Live results are updating on the main event screen'}
              </span>
            </div>
          </div>
        )}

        {/* =====================================================================
            STATE 4: ACTIVE VOTING (SELECT OPTIONS & VOTE)
           ===================================================================== */}
        {canVote && (
          <div className="flex-1 flex flex-col pt-4">
            {/* Title Section */}
            <div className="mb-5 text-center">
              <span className="text-xs font-condensed tracking-widest uppercase text-ksu-cyan font-bold block mb-1 text-glow-cyan">
                {state.settings?.eventSubtitleEnglish || 'AI INNOVATION COMPETITION'}
              </span>
              <h1 className="font-arabic font-black text-2xl text-white">
                {state.settings?.eventTitleArabic || 'ذكاء يُبتكر'}
              </h1>
              <p className="font-arabic text-slate-300 text-xs mt-1.5">
                {isAr
                  ? 'اختر المشروع الذي يستحق صوتك (صوت واحد لكل مشارك)'
                  : 'Choose the project that deserves your vote (1 vote per attendee)'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Options List */}
            <div className="flex flex-col gap-3 pb-24">
              {state.options
                .filter((opt) => opt.enabled)
                .map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const { title, subtitle, titleDir, subtitleDir, hasSubtitle } = parseOptionName(opt);

                  return (
                    <button
                      key={opt.id}
                      dir="rtl"
                      onClick={() => handleSelectOption(opt.id)}
                      className={`relative w-full p-4 rounded-2xl border text-right transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98] ${
                        isSelected
                          ? 'bg-gradient-to-r from-ksu-green/40 to-ksu-teal/40 border-ksu-cyan shadow-[0_0_25px_rgba(0,242,254,0.3)] ring-2 ring-ksu-cyan/60'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Text Section - Right-aligned whether Arabic or English */}
                      <div className="flex-1 min-w-0 text-right" style={{ textAlign: 'right' }}>
                        <bdi
                          dir={titleDir}
                          className="font-arabic font-extrabold text-base text-white block leading-snug truncate text-right w-full"
                          style={{ textAlign: 'right' }}
                        >
                          {title}
                        </bdi>
                        {hasSubtitle && (
                          <bdi
                            dir={subtitleDir}
                            className="font-arabic font-medium text-xs text-cyan-200/90 block mt-1 leading-normal text-right w-full"
                            style={{ textAlign: 'right' }}
                          >
                            {subtitle}
                          </bdi>
                        )}
                      </div>

                      {/* Selection Radio / Check Circle */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-ksu-cyan text-slate-950 border-ksu-cyan shadow-md'
                            : 'border-white/30 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Fixed Bottom CTA Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#071628]/90 backdrop-blur-xl border-t border-white/10 z-30">
              <div className="max-w-lg mx-auto">
                <button
                  disabled={!selectedOptionId || isSubmitting}
                  onClick={() => setShowConfirmModal(true)}
                  className={`w-full py-4 rounded-2xl font-arabic font-extrabold text-lg flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
                    selectedOptionId && !isSubmitting
                      ? 'bg-gradient-to-r from-ksu-green to-ksu-cyan text-slate-950 shadow-[0_0_25px_rgba(0,242,254,0.4)] active:scale-95'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>{isAr ? 'جاري تسجيل الصوت...' : 'Submitting Vote...'}</span>
                    </span>
                  ) : (
                    <span>{isAr ? 'تأكيد واختيار هذا المشروع' : 'Confirm & Cast Vote'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#0d2745] border border-white/20 p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-ksu-cyan/20 border border-ksu-cyan/40 flex items-center justify-center text-ksu-cyan mx-auto mb-4">
              <Check className="w-7 h-7" />
            </div>

            <h3 className="font-arabic font-extrabold text-xl text-white mb-2">
              {isAr ? 'هل أنت متأكد من اختيارك؟' : 'Confirm Your Vote'}
            </h3>

            {/* Option to be voted for */}
            {selectedOptionId && (
              <div className="my-4 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <bdi
                  dir={parseOptionName(state.options.find((o) => o.id === selectedOptionId)).titleDir}
                  className="font-arabic font-bold text-base text-white block"
                >
                  {parseOptionName(state.options.find((o) => o.id === selectedOptionId)).title}
                </bdi>
              </div>
            )}

            <p className="font-arabic text-xs text-slate-300 mb-6">
              {isAr
                ? 'لا يمكن التراجع أو تغيير الصوت بعد التأكيد.'
                : 'Votes cannot be changed or undone after confirmation.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-arabic font-bold text-sm transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmVote}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-ksu-green to-ksu-cyan text-slate-950 font-arabic font-extrabold text-sm transition shadow-lg"
              >
                {isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'نعم، صوّت الآن' : 'Yes, Vote Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

