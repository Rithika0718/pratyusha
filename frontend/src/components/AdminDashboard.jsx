/**
 * AdminDashboard.jsx
 * Teacher interface: lecture controls, live speech-to-text, transcript,
 * student monitoring, and notification panel.
 *
 * Speech recognition uses the Web Speech API directly — NO getUserMedia
 * (getUserMedia can steal the mic from SpeechRecognition in Chrome).
 * Includes a manual text input as fallback.
 */
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import SessionControls from './SessionControls';
import TranscriptPanel from './TranscriptPanel';

const SOCKET_URL = 'http://localhost:3001';

export default function AdminDashboard() {
  /* ---- State ---- */
  const [lectureStatus, setLectureStatus] = useState('idle');
  const [transcript, setTranscript] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [micStatus, setMicStatus] = useState('off');
  const [speechStatus, setSpeechStatus] = useState('stopped');
  const [notifications, setNotifications] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [manualText, setManualText] = useState('');
  const [resultCount, setResultCount] = useState(0); // debug counter

  /* ---- Refs ---- */
  const socketRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  /* ---- Socket.io connection ---- */
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Admin] Socket connected');
      setSocketConnected(true);
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('session-info', (data) => setSessionInfo(data));
    socket.on('lecture-status', (data) => setLectureStatus(data.status));
    socket.on('student-count', (count) => setStudentCount(count));
    socket.on('transcript-cleared', () => setTranscript([]));
    socket.on('transcript-history', (history) => setTranscript(history));
    socket.on('student-notification', (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
    });

    return () => { socket.disconnect(); };
  }, []);

  /* ---- Cleanup recognition on unmount ---- */
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  /* ==================================================================
   *  Helper: add a transcript entry (used by both speech and manual input)
   * ================================================================== */
  const addTranscriptEntry = (text) => {
    if (!text.trim()) return;
    const timestamp = new Date().toISOString();
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: text.trim(),
      timestamp,
    };
    console.log('[Transcript] ➕ New entry:', text.trim());
    setTranscript((prev) => [...prev, entry]);
    // Broadcast to students via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit('transcript-update', { text: text.trim(), timestamp });
    }
  };

  /* ==================================================================
   *  SPEECH RECOGNITION
   *  - NO getUserMedia (it steals the mic from SpeechRecognition)
   *  - Uses standard Web Speech API pattern
   *  - Creates fresh instances on restart
   * ================================================================== */
  const startListening = () => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }

    // Create new SpeechRecognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[Speech] ✅ Recognition STARTED — speak now!');
      setMicStatus('active');
      setSpeechStatus('listening');
    };

    recognition.onresult = (event) => {
      setResultCount((c) => c + 1);
      let finalText = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimStr += transcript;
        }
      }

      // Always show interim text so user knows mic is working
      setInterimText(interimStr || '');

      if (interimStr) {
        console.log('[Speech] 🔄 Hearing:', interimStr);
      }

      if (finalText.trim()) {
        console.log('[Speech] ✅ FINAL:', finalText.trim());
        addTranscriptEntry(finalText);
        setInterimText('');
      }
    };

    recognition.onerror = (event) => {
      console.warn('[Speech] ⚠️ Error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicStatus('error');
        setSpeechStatus('error');
        isListeningRef.current = false;
        alert('Microphone access denied. Please click the lock icon in the address bar and allow microphone access.');
        return;
      }
      // no-speech is normal — just means silence, let onend restart
    };

    recognition.onend = () => {
      console.log('[Speech] 🔁 Recognition ended. Should restart:', isListeningRef.current);
      if (isListeningRef.current) {
        // Restart with fresh instance after short delay
        setSpeechStatus('restarting');
        setTimeout(() => {
          if (isListeningRef.current) {
            console.log('[Speech] 🔄 Restarting...');
            startListening(); // recursive call creates fresh instance
          }
        }, 500);
      } else {
        setMicStatus('off');
        setSpeechStatus('stopped');
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;
    isListeningRef.current = true;

    try {
      recognition.start();
      console.log('[Speech] 🎙️ start() called — waiting for audio...');
    } catch (err) {
      console.error('[Speech] ❌ Failed to start:', err);
      setMicStatus('error');
      setSpeechStatus('error');
    }
  };

  const stopListening = () => {
    console.log('[Speech] ⏹️ Stopping...');
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null; // prevent auto-restart
        recognitionRef.current.abort();
      } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }
    setMicStatus('off');
    setSpeechStatus('stopped');
    setInterimText('');
  };

  /* ---- Manual text input handler ---- */
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualText.trim() && lectureStatus === 'running') {
      addTranscriptEntry(manualText);
      setManualText('');
    }
  };

  /* ---- Lecture controls ---- */
  const handleStart = () => {
    socketRef.current?.emit('start-lecture', { title: 'Live Lecture' });
    setLectureStatus('running');
    setTranscript([]);
    setNotifications([]);
    setResultCount(0);
    startListening();
  };

  const handlePause = () => {
    socketRef.current?.emit('pause-lecture');
    setLectureStatus('paused');
    stopListening();
  };

  const handleResume = () => {
    socketRef.current?.emit('resume-lecture');
    setLectureStatus('running');
    startListening();
  };

  const handleEnd = () => {
    socketRef.current?.emit('end-lecture');
    setLectureStatus('ended');
    stopListening();
  };

  const handleClear = () => {
    setTranscript([]);
    socketRef.current?.emit('clear-transcript');
  };

  const activeId = transcript.length > 0 ? transcript[transcript.length - 1].id : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page title */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-extrabold">🛡️ Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage lectures, monitor students, and broadcast accessible content.
        </p>
      </div>

      {/* Lecture Controls */}
      <SessionControls
        lectureStatus={lectureStatus}
        sessionInfo={sessionInfo}
        studentCount={studentCount}
        micStatus={micStatus}
        speechStatus={speechStatus}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onEnd={handleEnd}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript — takes 2/3 */}
        <div className="lg:col-span-2 min-h-[400px]">
          <TranscriptPanel
            transcript={transcript}
            isAdmin={true}
            onClear={handleClear}
            activeId={activeId}
          />

          {/* Interim text — shows words as you speak them */}
          {interimText && (
            <div className="mt-2 px-4 py-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 animate-pulse-soft">
              <span className="font-semibold mr-2">🎤 Hearing:</span>
              <span className="italic text-base">{interimText}</span>
            </div>
          )}

          {/* Manual text input — always available during lecture */}
          {lectureStatus === 'running' && (
            <form onSubmit={handleManualSubmit} className="mt-2 flex gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type text manually (fallback if mic doesn't work)…"
                className="input-field text-sm flex-1"
              />
              <button
                type="submit"
                className="btn-primary text-sm whitespace-nowrap"
                disabled={!manualText.trim()}
              >
                ➕ Add
              </button>
            </form>
          )}

          {/* Helpful hint */}
          {lectureStatus === 'running' && transcript.length === 0 && !interimText && (
            <div className="mt-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
              💡 Speak clearly into your microphone. If speech doesn't appear, try the manual text input above, or check if another tab is using your mic.
            </div>
          )}
        </div>

        {/* Right sidebar — monitoring */}
        <div className="space-y-6">
          <div className="glass-panel p-5 animate-slide-up">
            <h3 className="font-bold flex items-center gap-2 mb-4">📊 System Monitor</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Connected Students</span>
                <span className="badge-success">{studentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Transcript Lines</span>
                <span className="badge-info">{transcript.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Speech Engine</span>
                <span className={
                  speechStatus === 'listening' ? 'badge-success' :
                  speechStatus === 'restarting' ? 'badge-warning' :
                  speechStatus === 'error' ? 'badge-danger' : 'badge-warning'
                }>
                  {speechStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Speech Events</span>
                <span className="badge-info">{resultCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Socket</span>
                <span className={socketConnected ? 'badge-success' : 'badge-danger'}>
                  {socketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Student notifications */}
          <div className="glass-panel p-5 animate-slide-up">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              🔔 Student Messages
              {notifications.length > 0 && (
                <span className="ml-auto badge-danger text-xs">{notifications.length}</span>
              )}
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No messages yet. Student questions and feedback will appear here.
                </p>
              ) : (
                notifications.map((n, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 animate-slide-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">{n.type === 'question' ? '❓' : '💬'}</span>
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{n.studentName}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
