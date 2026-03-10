/**
 * AudioPlayer.jsx
 * Text-to-Speech controls using the browser SpeechSynthesis API.
 * Plays transcript lines as audio narration with speed/volume controls.
 *
 * Uses refs for all state accessed in callbacks to avoid stale closures.
 * Includes a Chrome workaround for the 15-second speech cutoff bug.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export default function AudioPlayer({ transcript = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [currentIdx, setCurrentIdx] = useState(0);

  /* Refs to avoid stale closures in SpeechSynthesis callbacks */
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const speedRef = useRef(1);
  const volumeRef = useRef(1);
  const currentIdxRef = useRef(0);
  const transcriptRef = useRef(transcript);
  const utteranceRef = useRef(null);

  /* Keep refs in sync with state */
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  /* Chrome workaround: SpeechSynthesis stops after ~15s of continuous speech.
     We keep it alive by calling resume() periodically while speaking. */
  const chromeKeepAliveRef = useRef(null);

  const startChromeKeepAlive = () => {
    clearInterval(chromeKeepAliveRef.current);
    chromeKeepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !isPausedRef.current) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  };

  const stopChromeKeepAlive = () => {
    clearInterval(chromeKeepAliveRef.current);
    chromeKeepAliveRef.current = null;
  };

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopChromeKeepAlive();
    };
  }, []);

  /**
   * Speak a single transcript entry at the given index, then chain to the next.
   */
  const speakAt = useCallback((idx) => {
    const items = transcriptRef.current;
    if (idx >= items.length || !isPlayingRef.current) {
      // Reached the end or stopped
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      isPausedRef.current = false;
      stopChromeKeepAlive();
      return;
    }

    window.speechSynthesis.cancel(); // clear any queued speech

    const utterance = new SpeechSynthesisUtterance(items[idx].text);
    utterance.rate = speedRef.current;
    utterance.volume = volumeRef.current;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      const nextIdx = idx + 1;
      currentIdxRef.current = nextIdx;
      setCurrentIdx(nextIdx);
      // Chain to next entry
      speakAt(nextIdx);
    };

    utterance.onerror = (e) => {
      // 'interrupted' is expected when we call cancel() — not a real error
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('[TTS] Error:', e.error);
      // Try to continue with the next entry
      const nextIdx = idx + 1;
      currentIdxRef.current = nextIdx;
      setCurrentIdx(nextIdx);
      speakAt(nextIdx);
    };

    utteranceRef.current = utterance;
    currentIdxRef.current = idx;
    setCurrentIdx(idx);
    window.speechSynthesis.speak(utterance);
    startChromeKeepAlive();
  }, []);

  /**
   * When new transcript entries arrive and we're playing, automatically
   * speak the new ones after the current utterance finishes.
   * (The chaining in speakAt already handles this since it reads transcriptRef.current)
   */
  useEffect(() => {
    if (!isPlayingRef.current || isPausedRef.current) return;
    // If synthesis isn't currently talking and there are unseen entries, start
    if (!window.speechSynthesis.speaking && currentIdxRef.current < transcript.length) {
      speakAt(currentIdxRef.current);
    }
  }, [transcript.length, speakAt]);

  /* ---- Controls ---- */

  const handlePlay = () => {
    const startIdx = currentIdxRef.current < transcript.length ? currentIdxRef.current : 0;
    isPlayingRef.current = true;
    isPausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    speakAt(startIdx);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    isPausedRef.current = true;
    setIsPaused(true);
    stopChromeKeepAlive();
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    isPausedRef.current = false;
    setIsPaused(false);
    startChromeKeepAlive();
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    isPlayingRef.current = false;
    isPausedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    currentIdxRef.current = 0;
    setCurrentIdx(0);
    stopChromeKeepAlive();
  };

  const progress = transcript.length > 0 ? Math.min(((currentIdx + 1) / transcript.length) * 100, 100) : 0;

  return (
    <div className="glass-panel p-5 animate-slide-up">
      <h3 className="font-bold flex items-center gap-2 mb-4">🔊 Audio Narration</h3>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="btn-success px-6"
            disabled={transcript.length === 0}
            aria-label="Play audio"
          >
            ▶️ Play
          </button>
        ) : isPaused ? (
          <button onClick={handleResume} className="btn-primary px-6" aria-label="Resume audio">
            ▶️ Resume
          </button>
        ) : (
          <button onClick={handlePause} className="btn-secondary px-6" aria-label="Pause audio">
            ⏸️ Pause
          </button>
        )}
        <button
          onClick={handleStop}
          className="btn-danger px-6"
          disabled={!isPlaying}
          aria-label="Stop audio"
        >
          ⏹️ Stop
        </button>
      </div>

      {/* Speed & Volume sliders */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-16">Speed</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1 accent-brand-600"
            aria-label="Playback speed"
          />
          <span className="text-xs font-mono w-10 text-right">{speed}x</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-16">Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-brand-600"
            aria-label="Volume"
          />
          <span className="text-xs font-mono w-10 text-right">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Now speaking */}
      {isPlaying && transcript[currentIdx] && (
        <div className="mt-4 p-3 bg-brand-50 dark:bg-brand-900/30 rounded-xl text-sm animate-fade-in">
          <p className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold mb-1">Now Speaking</p>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-2">
            {transcript[currentIdx].text}
          </p>
        </div>
      )}
    </div>
  );
}
