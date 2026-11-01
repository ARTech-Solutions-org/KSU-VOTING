import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { parseOptionName } from '../utils/bidi';
import {
  X,
  Lock,
  Unlock,
  Play,
  Pause,
  StopCircle,
  BarChart2,
  Settings,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  FileJson,
  Radio,
  Sliders,
  Sparkles,
  ChevronUp,
  ChevronDown,
  History,
  QrCode,
  Check,
} from 'lucide-react';

export default function AdminModal({ onClose }) {
  const { state, socket } = useSocket();
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'options' | 'settings' | 'reveal' | 'audit'

  // Option Editor State
  const [editingOption, setEditingOption] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual Adjust Modal
  const [adjustModal, setAdjustModal] = useState(null); // { id, title, votes, reason }

  // Double Confirmation Modal for Reset All
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Handle PIN Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (!socket) return;
    socket.emit('admin:verify', { pin: pinInput }, (res) => {
      if (res && res.success) {
        setIsAuthenticated(true);
        setPinError('');
      } else {
        setPinError('رمز الدخول غير صحيح');
      }
    });
  };

  // Helper for admin socket emits
  const emitAdmin = (event, payload = {}) => {
    if (!socket || !isAuthenticated) return;
    socket.emit(event, { ...payload, pin: pinInput });
  };

  // Escape key to close and return to /
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#091b30] border border-white/20 shadow-2xl text-white overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c2440]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ksu-cyan/20 border border-ksu-cyan/40 flex items-center justify-center text-ksu-cyan shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-arabic font-extrabold text-lg text-white">
                لوحة تحكم المنظمين
              </h2>
              <span className="font-condensed text-xs uppercase tracking-wider text-ksu-cyan font-semibold">
                AI Innovation Competition - Admin Panel
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================================================================
            VIEW 1: PIN AUTHENTICATION GATE
           =================================================================== */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-4 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-arabic font-extrabold text-2xl text-white mb-2">
              تسجيل دخول المشرف
            </h3>
            <p className="font-arabic text-sm text-slate-300 mb-6 max-w-sm">
              أدخل رمز المرور السري (الرمز الافتراضي: <span className="font-mono text-ksu-cyan font-bold">2026</span>)
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-ksu-cyan focus:ring-2 focus:ring-ksu-cyan/40"
              />

              {pinError && (
                <span className="font-arabic text-xs text-red-400 font-bold">
                  {pinError}
                </span>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-ksu-green to-ksu-cyan text-slate-950 font-arabic font-extrabold text-base shadow-lg hover:brightness-110 transition active:scale-95"
              >
                تأكيد الدخول
              </button>
            </form>
          </div>
        ) : (
          /* ===================================================================
              VIEW 2: FULL ADMIN DASHBOARD
             =================================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-[#091b30] overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'overview', label: 'نظرة عامة والتحكم', icon: BarChart2 },
                { id: 'options', label: 'إدارة الخيارات (المشاريع)', icon: Sliders },
                { id: 'settings', label: 'قواعد التصويت والشاشة', icon: Settings },
                { id: 'reveal', label: 'مراسم إعلان الفائزين', icon: Sparkles },
                { id: 'audit', label: 'سجل العمليات وإعادة الضبط', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-arabic font-bold text-xs whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-[#0f2d4f] text-ksu-cyan border-t-2 border-ksu-cyan'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: OVERVIEW & CONTROLS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="font-arabic text-xs text-slate-400 block mb-1">
                        مجموع الأصوات
                      </span>
                      <span className="font-condensed font-black text-3xl text-ksu-cyan">
                        {state.stats?.totalVotes || 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="font-arabic text-xs text-slate-400 block mb-1">
                        المصوتين الفعليين
                      </span>
                      <span className="font-condensed font-black text-3xl text-emerald-400">
                        {state.stats?.uniqueVotersCount || 0}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="font-arabic text-xs text-slate-400 block mb-1">
                        حالة التصويت
                      </span>
                      <span className="font-arabic font-extrabold text-lg text-white">
                        {state.settings?.votingState === 'open'
                          ? 'مفتوح للجميع'
                          : state.settings?.votingState === 'paused'
                          ? 'متوقف مؤقتاً'
                          : 'مغلق'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="font-arabic text-xs text-slate-400 block mb-1">
                        نمط الشاشة
                      </span>
                      <span className="font-arabic font-extrabold text-lg text-ksu-cyan">
                        {state.settings?.screenMode === 'results' ? 'شاشة النتائج' : 'الشاشة الترحيبية'}
                      </span>
                    </div>
                  </div>

                  {/* Primary Event Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Voting State Switcher */}
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="font-arabic font-bold text-sm text-white mb-3">
                        التحكم بحالة التصويت
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => emitAdmin('admin:setVotingState', { state: 'open' })}
                          className={`py-3 px-2 rounded-xl font-arabic font-bold text-xs flex flex-col items-center gap-1 transition ${
                            state.settings?.votingState === 'open'
                              ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <Play className="w-4 h-4" />
                          <span>فتح التصويت</span>
                        </button>

                        <button
                          onClick={() => emitAdmin('admin:setVotingState', { state: 'paused' })}
                          className={`py-3 px-2 rounded-xl font-arabic font-bold text-xs flex flex-col items-center gap-1 transition ${
                            state.settings?.votingState === 'paused'
                              ? 'bg-amber-600 text-white shadow-lg ring-2 ring-amber-400'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <Pause className="w-4 h-4" />
                          <span>إيقاف مؤقت</span>
                        </button>

                        <button
                          onClick={() => emitAdmin('admin:setVotingState', { state: 'closed' })}
                          className={`py-3 px-2 rounded-xl font-arabic font-bold text-xs flex flex-col items-center gap-1 transition ${
                            state.settings?.votingState === 'closed'
                              ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <StopCircle className="w-4 h-4" />
                          <span>إغلاق التصويت</span>
                        </button>
                      </div>
                    </div>

                    {/* Big Screen Mode Switcher */}
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="font-arabic font-bold text-sm text-white mb-3">
                        التحكم بالشاشة الرئيسية
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => emitAdmin('admin:setScreenMode', { mode: 'idle' })}
                          className={`py-3 px-3 rounded-xl font-arabic font-bold text-xs flex items-center justify-center gap-2 transition ${
                            state.settings?.screenMode === 'idle'
                              ? 'bg-ksu-green text-white shadow-lg ring-2 ring-ksu-cyan'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>الشاشة الترحيبية (Idle)</span>
                        </button>

                        <button
                          onClick={() => emitAdmin('admin:setScreenMode', { mode: 'results' })}
                          className={`py-3 px-3 rounded-xl font-arabic font-bold text-xs flex items-center justify-center gap-2 transition ${
                            state.settings?.screenMode === 'results'
                              ? 'bg-ksu-navy text-ksu-cyan shadow-lg ring-2 ring-ksu-cyan'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <BarChart2 className="w-4 h-4" />
                          <span>شاشة النتائج (Results)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Test Mode & Rehearsal Simulator */}
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-amber-300 font-arabic font-bold text-sm mb-1">
                        <Radio className="w-4 h-4" />
                        <span>وضع التدريب ومحاكاة الأصوات (Test Mode)</span>
                      </div>
                      <p className="font-arabic text-xs text-slate-300">
                        يتيح توليد أصوات وهمية لاختبار وتدريب الحركات والرسوم البيانية وتفاعل الشاشة قبل بدء الحفل.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          emitAdmin('admin:updateSettings', {
                            settings: { testMode: !state.settings?.testMode },
                          })
                        }
                        className={`px-3 py-2 rounded-xl font-arabic font-bold text-xs transition ${
                          state.settings?.testMode
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {state.settings?.testMode ? 'إلغاء وضع التدريب' : 'تفعيل وضع التدريب'}
                      </button>

                      <button
                        onClick={() => emitAdmin('admin:simulateVote')}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-ksu-green to-ksu-cyan text-slate-950 font-arabic font-extrabold text-xs shadow-md active:scale-95 transition"
                      >
                        + محاكاة صوت عشوائي
                      </button>
                    </div>
                  </div>

                  {/* Quick Export Bar */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="font-arabic text-xs text-slate-300">
                      تصدير وحفظ نتائج التصويت:
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/admin/export/csv?pin=${pinInput}`}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-arabic text-xs font-bold transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>تحميل Excel (CSV)</span>
                      </a>
                      <a
                        href={`/api/admin/export/json?pin=${pinInput}`}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 font-arabic text-xs font-bold transition"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                        <span>تحميل JSON</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OPTIONS MANAGEMENT */}
              {activeTab === 'options' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-arabic font-extrabold text-base text-white">
                      قائمة المشاريع المرشحة ({state.options?.length || 0})
                    </h3>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-ksu-green to-ksu-cyan text-slate-950 font-arabic font-extrabold text-xs shadow-lg active:scale-95 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة مشروع جديد</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {state.options.map((opt, idx) => {
                      const { title, subtitle, titleDir, subtitleDir, hasSubtitle } = parseOptionName(opt);
                      return (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition gap-3"
                        >
                          {/* Order Buttons */}
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              disabled={idx === 0}
                              onClick={() => {
                                const newOrder = [...state.options.map((o) => o.id)];
                                const temp = newOrder[idx];
                                newOrder[idx] = newOrder[idx - 1];
                                newOrder[idx - 1] = temp;
                                emitAdmin('admin:reorderOptions', { orderedIds: newOrder });
                              }}
                              className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={idx === state.options.length - 1}
                              onClick={() => {
                                const newOrder = [...state.options.map((o) => o.id)];
                                const temp = newOrder[idx];
                                newOrder[idx] = newOrder[idx + 1];
                                newOrder[idx + 1] = temp;
                                emitAdmin('admin:reorderOptions', { orderedIds: newOrder });
                              }}
                              className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <bdi dir={titleDir} className="font-arabic font-bold text-sm text-white truncate">
                                {title}
                              </bdi>
                              {!opt.enabled && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-arabic text-[10px]">
                                  معطّل
                                </span>
                              )}
                            </div>
                            {hasSubtitle && (
                              <bdi dir={subtitleDir} className="font-arabic text-xs text-ksu-cyan block mt-0.5 truncate">
                                {subtitle}
                              </bdi>
                            )}
                          </div>

                          {/* Votes & Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Current Votes count badge */}
                            <button
                              onClick={() =>
                                setAdjustModal({
                                  id: opt.id,
                                  title: opt.title,
                                  votes: opt.votes || 0,
                                  reason: '',
                                })
                              }
                              title="انقر لتعديل عدد الأصوات يدوياً"
                              className="px-2.5 py-1 rounded-xl bg-ksu-cyan/15 border border-ksu-cyan/30 text-ksu-cyan font-condensed font-black text-sm hover:bg-ksu-cyan/30 transition"
                            >
                              {opt.votes || 0} صوت
                            </button>

                            {/* Enable/Disable Toggle */}
                            <button
                              onClick={() =>
                                emitAdmin('admin:editOption', {
                                  id: opt.id,
                                  data: { enabled: !opt.enabled },
                                })
                              }
                              className={`p-2 rounded-xl text-xs font-arabic transition ${
                                opt.enabled
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              }`}
                            >
                              {opt.enabled ? 'مفعّل' : 'معطّل'}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingOption(opt);
                                setNewTitle(opt.title);
                                setNewSubtitle(opt.subtitle || '');
                              }}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Reset this option's votes */}
                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من تصفير أصوات "${opt.title}"؟`)) {
                                  emitAdmin('admin:resetOption', { id: opt.id });
                                }
                              }}
                              title="تصفير أصوات هذا المشروع"
                              className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف "${opt.title}" نهائياً؟`)) {
                                  emitAdmin('admin:deleteOption', { id: opt.id });
                                }
                              }}
                              className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: VOTING RULES & DISPLAY SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Voting Rules */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h3 className="font-arabic font-extrabold text-sm text-white">
                      قواعد وضوابط تصويت الحضور
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Max Votes Per Person */}
                      <div>
                        <label className="font-arabic text-xs text-slate-300 block mb-1.5">
                          الحد الأقصى للأصوات لكل مشارك:
                        </label>
                        <select
                          value={state.settings?.maxVotesPerPerson || 1}
                          onChange={(e) =>
                            emitAdmin('admin:updateSettings', {
                              settings: { maxVotesPerPerson: parseInt(e.target.value, 10) },
                            })
                          }
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0d2745] border border-white/20 text-white font-arabic text-sm focus:outline-none focus:border-ksu-cyan"
                        >
                          <option value="1">صوت واحد فقط (الافتراضي)</option>
                          <option value="2">صوتان لكل شخص</option>
                          <option value="3">3 أصوات لكل شخص</option>
                          <option value="5">5 أصوات لكل شخص</option>
                        </select>
                      </div>

                      {/* Allow Same Option Multiple Times */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <span className="font-arabic font-bold text-xs text-white block">
                            تكرار التصويت لنفس الخيار
                          </span>
                          <span className="font-arabic text-[11px] text-slate-400">
                            السماح للمشارك بتوزيع أصواته على نفس المشروع
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(state.settings?.allowSameOptionMultiple)}
                          onChange={(e) =>
                            emitAdmin('admin:updateSettings', {
                              settings: { allowSameOptionMultiple: e.target.checked },
                            })
                          }
                          className="w-5 h-5 accent-ksu-cyan rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Big Screen Display Settings */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h3 className="font-arabic font-extrabold text-sm text-white">
                      إعدادات عرض الشاشة الرئيسية
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Show Counts Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="font-arabic font-bold text-xs text-white">
                          إظهار أعداد الأصوات
                        </span>
                        <input
                          type="checkbox"
                          checked={state.settings?.showCounts !== false}
                          onChange={(e) =>
                            emitAdmin('admin:updateSettings', {
                              settings: { showCounts: e.target.checked },
                            })
                          }
                          className="w-5 h-5 accent-ksu-cyan rounded cursor-pointer"
                        />
                      </div>

                      {/* Show Percentages Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="font-arabic font-bold text-xs text-white">
                          إظهار النسب المئوية
                        </span>
                        <input
                          type="checkbox"
                          checked={state.settings?.showPercentages !== false}
                          onChange={(e) =>
                            emitAdmin('admin:updateSettings', {
                              settings: { showPercentages: e.target.checked },
                            })
                          }
                          className="w-5 h-5 accent-ksu-cyan rounded cursor-pointer"
                        />
                      </div>

                      {/* Sound Effects Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="font-arabic font-bold text-xs text-white">
                          المؤثرات الصوتية للشاشة
                        </span>
                        <input
                          type="checkbox"
                          checked={Boolean(state.settings?.soundEnabled)}
                          onChange={(e) =>
                            emitAdmin('admin:updateSettings', {
                              settings: { soundEnabled: e.target.checked },
                            })
                          }
                          className="w-5 h-5 accent-ksu-cyan rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Auto-cycle Setting */}
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="font-arabic font-bold text-xs text-white block">
                          التبديل التلقائي بين الشاشات (Auto-Cycle)
                        </span>
                        <span className="font-arabic text-[11px] text-slate-400">
                          تبديل العرض بين الترحيب والنتائج دورياً
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          disabled={!state.settings?.autoCycle}
                          value={state.settings?.autoCycleInterval || 15}
                          onChange={(e) =>
                            emitAdmin('admin:updateSettings', {
                              settings: { autoCycleInterval: parseInt(e.target.value, 10) },
                            })
                          }
                          className="py-1 px-2 rounded-lg bg-[#0d2745] border border-white/20 text-white font-arabic text-xs disabled:opacity-40"
                        >
                          <option value="10">كل 10 ثوانٍ</option>
                          <option value="15">كل 15 ثانية</option>
                          <option value="30">كل 30 ثانية</option>
                          <option value="60">كل دقيقة</option>
                        </select>
                        <input
                          type="checkbox"
                          checked={Boolean(state.settings?.autoCycle)}
                          onChange={(e) =>
                            emitAdmin('admin:updateSettings', {
                              settings: { autoCycle: e.target.checked },
                            })
                          }
                          className="w-5 h-5 accent-ksu-cyan rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Voting URL & QR Target */}
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                      <label className="font-arabic text-xs text-slate-300 block mb-1.5">
                        رابط التصويت في الباركود (Voting URL):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={state.settings?.votingUrl || ''}
                          onChange={(e) =>
                            emitAdmin('admin:updateSettings', {
                              settings: { votingUrl: e.target.value },
                            })
                          }
                          className="flex-1 py-2 px-3 rounded-xl bg-[#0d2745] border border-white/20 text-ksu-cyan font-mono text-xs focus:outline-none focus:border-ksu-cyan"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CEREMONY & REVEAL MODE */}
              {activeTab === 'reveal' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-ksu-navy/40 to-ksu-cyan/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 text-amber-300 font-arabic font-extrabold text-base mb-1">
                      <Sparkles className="w-5 h-5" />
                      <span>مراسم إعلان الفائزين (Reveal Mode)</span>
                    </div>
                    <p className="font-arabic text-xs text-slate-300 leading-relaxed mb-4">
                      في هذا النمط، تُخفى النتائج على الشاشة الكبيرة، ويتم الكشف عنها تدريجياً أمام الجمهور من المركز
                      الأخير صعوداً حتى المركز الأول الفائز مع مؤثرات احتفالية وشهب نارية رقمية!
                    </p>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 border border-white/15 mb-4">
                      <span className="font-arabic font-bold text-xs text-white">
                        تفعيل وضع الكشف التدريجي على الشاشة
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(state.settings?.revealMode)}
                        onChange={(e) =>
                          emitAdmin('admin:updateSettings', {
                            settings: { revealMode: e.target.checked },
                          })
                        }
                        className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>

                    {/* Step Controls */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => emitAdmin('admin:revealNext')}
                        disabled={!state.settings?.revealMode}
                        className="py-3 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-arabic font-extrabold text-xs shadow-lg transition active:scale-95 disabled:opacity-40"
                      >
                        + كشف المركز التالي
                      </button>

                      <button
                        onClick={() => emitAdmin('admin:revealAll')}
                        disabled={!state.settings?.revealMode}
                        className="py-3 px-3 rounded-xl bg-ksu-cyan hover:bg-cyan-300 text-slate-950 font-arabic font-extrabold text-xs shadow-lg transition active:scale-95 disabled:opacity-40"
                      >
                        كشف كافة المراكز دفعة واحدة
                      </button>

                      <button
                        onClick={() => emitAdmin('admin:revealReset')}
                        disabled={!state.settings?.revealMode}
                        className="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-arabic font-bold text-xs transition disabled:opacity-40"
                      >
                        إعادة إخفاء النتائج
                      </button>
                    </div>

                    <div className="mt-4 text-center">
                      <span className="font-arabic text-xs text-slate-400">
                        تم كشف {state.settings?.revealedCount || 0} من أصل {state.options?.length || 0} مراكز
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AUDIT LOG & RESETS */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  {/* Danger Zone: Resets */}
                  <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-4">
                    <h3 className="font-arabic font-extrabold text-sm text-red-400">
                      منطقة الإجراءات الحاسمة وإعادة الضبط
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Clear Voter Locks (Allows attendees to vote again without deleting counts) */}
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3">
                        <div>
                          <span className="font-arabic font-bold text-xs text-white block">
                            فتح أقفال المصوتين (Clear Locks)
                          </span>
                          <span className="font-arabic text-[11px] text-slate-400">
                            يسمح للحضور بالتصويت مجدداً مع الحفاظ على الأرقام الحالية (مفيد للتجارب).
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('هل تريد السماح لجميع الأجهزة بالتصويت مجدداً؟')) {
                              emitAdmin('admin:resetLocks');
                            }
                          }}
                          className="py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-arabic font-bold text-xs transition"
                        >
                          تصفير أقفال الأجهزة فقط
                        </button>
                      </div>

                      {/* Hard Reset All Votes */}
                      <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex flex-col justify-between gap-3">
                        <div>
                          <span className="font-arabic font-bold text-xs text-red-300 block">
                            تصفير كافة الأصوات (Reset All)
                          </span>
                          <span className="font-arabic text-[11px] text-slate-400">
                            يمسح جميع الأصوات ويُرجع كافة الخيارات إلى 0 صوت مع طلب تأكيد مكرر.
                          </span>
                        </div>
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-arabic font-bold text-xs shadow transition"
                        >
                          تصفير شامل لكافة الأصوات
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add New Option Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-3xl bg-[#0d2745] border border-white/20 p-6 shadow-2xl">
            <h3 className="font-arabic font-extrabold text-lg text-white mb-4">
              إضافة مشروع تصويت جديد
            </h3>

            <div className="space-y-3 mb-5">
              <div>
                <label className="font-arabic text-xs text-slate-300 block mb-1">
                  اسم المشروع الرئيسي (العنوان):
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: دوائي الذكي أو MedCompanion"
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-arabic text-sm focus:outline-none focus:border-ksu-cyan"
                />
              </div>

              <div>
                <label className="font-arabic text-xs text-slate-300 block mb-1">
                  العنوان الفرعي / السطر الثاني (اختياري):
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="مثال: بوصلة الصرف الذكي"
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-arabic text-sm focus:outline-none focus:border-ksu-cyan"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTitle('');
                  setNewSubtitle('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-arabic font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                disabled={!newTitle.trim()}
                onClick={() => {
                  emitAdmin('admin:addOption', {
                    option: { title: newTitle.trim(), subtitle: newSubtitle.trim() },
                  });
                  setShowAddModal(false);
                  setNewTitle('');
                  setNewSubtitle('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-ksu-green to-ksu-cyan text-slate-950 font-arabic font-extrabold text-xs shadow-md disabled:opacity-40"
              >
                إضافة المشروع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Option Modal */}
      {editingOption && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-3xl bg-[#0d2745] border border-white/20 p-6 shadow-2xl">
            <h3 className="font-arabic font-extrabold text-lg text-white mb-4">
              تعديل بيانات المشروع
            </h3>

            <div className="space-y-3 mb-5">
              <div>
                <label className="font-arabic text-xs text-slate-300 block mb-1">
                  اسم المشروع الرئيسي:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-arabic text-sm focus:outline-none focus:border-ksu-cyan"
                />
              </div>

              <div>
                <label className="font-arabic text-xs text-slate-300 block mb-1">
                  العنوان الفرعي (السطر الثاني):
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-arabic text-sm focus:outline-none focus:border-ksu-cyan"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingOption(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-arabic font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                disabled={!newTitle.trim()}
                onClick={() => {
                  emitAdmin('admin:editOption', {
                    id: editingOption.id,
                    data: { title: newTitle.trim(), subtitle: newSubtitle.trim() },
                  });
                  setEditingOption(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-ksu-green to-ksu-cyan text-slate-950 font-arabic font-extrabold text-xs shadow-md"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjust Votes Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm rounded-3xl bg-[#0d2745] border border-white/20 p-6 shadow-2xl">
            <h3 className="font-arabic font-extrabold text-lg text-white mb-1">
              تصحيح يدوي للأصوات
            </h3>
            <p className="font-arabic text-xs text-slate-300 mb-4">
              مشروع: <span className="text-ksu-cyan font-bold">{adjustModal.title}</span>
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="font-arabic text-xs text-slate-300 block mb-1">
                  العدد الجديد للأصوات:
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustModal.votes}
                  onChange={(e) =>
                    setAdjustModal({ ...adjustModal, votes: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full py-2 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-mono text-base focus:outline-none focus:border-ksu-cyan"
                />
              </div>

              <div>
                <label className="font-arabic text-xs text-slate-300 block mb-1">
                  سبب التعديل (يسجل في سجل التدقيق):
                </label>
                <input
                  type="text"
                  placeholder="مثال: تصحيح خطأ تقني، فرز ورقي..."
                  value={adjustModal.reason}
                  onChange={(e) => setAdjustModal({ ...adjustModal, reason: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-arabic text-xs focus:outline-none focus:border-ksu-cyan"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAdjustModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-arabic font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  emitAdmin('admin:adjustVotes', {
                    id: adjustModal.id,
                    votes: adjustModal.votes,
                    reason: adjustModal.reason || 'تصحيح يدوي',
                  });
                  setAdjustModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-ksu-cyan text-slate-950 font-arabic font-extrabold text-xs shadow-md"
              >
                تأكيد التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double Confirmation Modal for Reset All */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-md rounded-3xl bg-red-950/90 border border-red-500/50 p-6 text-center shadow-2xl">
            <h3 className="font-arabic font-black text-xl text-red-300 mb-2">
              تأكيد تصفير كافة الأصوات
            </h3>
            <p className="font-arabic text-xs text-slate-200 mb-4 leading-relaxed">
              هذا الإجراء سيمسح جميع أصوات الحضور وسيعيد النتائج إلى الصفر تماماً. لا يمكن التراجع عن هذا الإجراء!
            </p>
            <p className="font-arabic text-xs text-red-300 mb-2 font-bold">
              لتأكيد الحذف، اكتب كلمة <span className="underline">RESET</span> أدناه:
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET"
              className="w-full text-center py-2 px-3 rounded-xl bg-black/40 border border-red-400 text-white font-mono text-base mb-5"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-arabic font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                disabled={resetConfirmText !== 'RESET'}
                onClick={() => {
                  emitAdmin('admin:resetAll');
                  setShowResetConfirm(false);
                  setResetConfirmText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-arabic font-black text-xs shadow-lg disabled:opacity-30"
              >
                تأكيد التصفير النهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

