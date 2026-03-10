/**
 * SessionControls.jsx
 * Lecture control panel: Start / Pause / Resume / End buttons,
 * mic status, lecture status badge, student count, session timer.
 */
import { useState, useEffect } from 'react';

export default function SessionControls({
  lectureStatus,   // 'idle' | 'running' | 'paused' | 'ended'
  sessionInfo,     // { sessionId, startTime, ... }
  studentCount,
  micStatus,       // 'active' | 'muted' | 'error' | 'off'
  speechStatus,    // 'listening' | 'stopped' | 'error'
  onStart,
  onPause,
  onResume,
  onEnd,
}) {
  const [elapsed, setElapsed] = useState('00:00:00');

  // Live timer
  useEffect(() => {
    if (lectureStatus !== 'running' && lectureStatus !== 'paused') {
      if (lectureStatus === 'idle') setElapsed('00:00:00');
      return;
    }
    const start = sessionInfo?.startTime ? new Date(sessionInfo.startTime) : new Date();
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - start.getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [lectureStatus, sessionInfo?.startTime]);

  /* Status badge helper */
  const statusBadge = () => {
    const map = {
      idle:    { cls: 'badge-info',    icon: '⏸️', label: 'Idle' },
      running: { cls: 'badge-success', icon: '🔴', label: 'Live' },
      paused:  { cls: 'badge-warning', icon: '⏸️', label: 'Paused' },
      ended:   { cls: 'badge-danger',  icon: '⏹️', label: 'Ended' },
    };
    const s = map[lectureStatus] || map.idle;
    return (
      <span className={`${s.cls} text-sm`}>
        <span className={lectureStatus === 'running' ? 'animate-pulse-soft' : ''}>{s.icon}</span>
        {s.label}
      </span>
    );
  };

  const micBadge = () => {
    if (micStatus === 'active')
      return <span className="badge-success text-xs"><span className="animate-pulse-soft">🎙️</span> Mic Active</span>;
    if (micStatus === 'error')
      return <span className="badge-danger text-xs">🎙️ Mic Error</span>;
    return <span className="badge-warning text-xs">🎙️ Mic Off</span>;
  };

  return (
    <div className="glass-panel p-5 animate-fade-in">
      {/* Session header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🎛️ Lecture Controls
        </h2>
        {statusBadge()}
      </div>

      {/* Session Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Session ID</p>
          <p className="text-sm font-bold font-mono mt-1 text-brand-600 dark:text-brand-400">
            {sessionInfo?.sessionId || '—'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Duration</p>
          <p className="text-sm font-bold font-mono mt-1">{elapsed}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Students</p>
          <p className="text-sm font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            👥 {studentCount ?? 0}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Microphone</p>
          <div className="mt-1">{micBadge()}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {lectureStatus === 'idle' || lectureStatus === 'ended' ? (
          <button onClick={onStart} className="btn-success flex-1 min-w-[120px]">
            ▶️ Start Lecture
          </button>
        ) : lectureStatus === 'running' ? (
          <>
            <button onClick={onPause} className="btn-secondary flex-1 min-w-[100px]">
              ⏸️ Pause
            </button>
            <button onClick={onEnd} className="btn-danger flex-1 min-w-[100px]">
              ⏹️ End Lecture
            </button>
          </>
        ) : lectureStatus === 'paused' ? (
          <>
            <button onClick={onResume} className="btn-primary flex-1 min-w-[100px]">
              ▶️ Resume
            </button>
            <button onClick={onEnd} className="btn-danger flex-1 min-w-[100px]">
              ⏹️ End Lecture
            </button>
          </>
        ) : null}
      </div>

      {/* Speech recognition status */}
      {lectureStatus === 'running' && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className={`w-2 h-2 rounded-full ${speechStatus === 'listening' ? 'bg-emerald-500 animate-pulse-soft' : 'bg-slate-400'}`} />
          Speech Recognition: {speechStatus === 'listening' ? 'Listening…' : speechStatus === 'error' ? 'Error — retrying…' : 'Stopped'}
        </div>
      )}
    </div>
  );
}
