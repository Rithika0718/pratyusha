/**
 * SignLanguageViewer.jsx
 * Detects sign-language keywords in the transcript and displays
 * animated visual sign cards for each matched keyword.
 */
import { useState, useEffect, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Sign language keyword data with hand descriptions and SVG icons    */
/* ------------------------------------------------------------------ */
const SIGN_DATA = {
  hello: {
    emoji: '👋',
    label: 'Hello',
    color: 'from-amber-400 to-orange-500',
    description: 'Open hand waving near the forehead',
    gesture: 'Wave open palm outward from forehead',
  },
  teacher: {
    emoji: '👩‍🏫',
    label: 'Teacher',
    color: 'from-blue-400 to-indigo-500',
    description: 'Flat hands at temples, then palms out',
    gesture: 'Both hands at temples move outward',
  },
  student: {
    emoji: '🧑‍🎓',
    label: 'Student',
    color: 'from-green-400 to-emerald-500',
    description: 'Fingers gather knowledge from palm to forehead',
    gesture: 'Flat hand lifts from open palm to forehead',
  },
  learn: {
    emoji: '📖',
    label: 'Learn',
    color: 'from-purple-400 to-violet-500',
    description: 'Pick up knowledge from a book to the mind',
    gesture: 'Fingers pick from open palm to forehead',
  },
  question: {
    emoji: '❓',
    label: 'Question',
    color: 'from-rose-400 to-pink-500',
    description: 'Index finger draws a question mark in the air',
    gesture: 'Draw "?" shape with index finger',
  },
  answer: {
    emoji: '💡',
    label: 'Answer',
    color: 'from-yellow-400 to-amber-500',
    description: 'Both index fingers point forward from the chin',
    gesture: 'Index fingers point forward from chin',
  },
  'thank you': {
    emoji: '🙏',
    label: 'Thank You',
    color: 'from-teal-400 to-cyan-500',
    description: 'Flat hand touches chin and moves outward',
    gesture: 'Flat hand from chin forward and down',
  },
};

const KEYWORDS = Object.keys(SIGN_DATA);

export default function SignLanguageViewer({ transcript = [] }) {
  const [detectedSigns, setDetectedSigns] = useState([]);

  /* Scan the latest transcript entries for keywords */
  useEffect(() => {
    if (transcript.length === 0) return;

    // Check last 5 entries
    const recentText = transcript
      .slice(-5)
      .map((t) => t.text)
      .join(' ')
      .toLowerCase();

    const found = KEYWORDS.filter((kw) => recentText.includes(kw));

    if (found.length > 0) {
      setDetectedSigns((prev) => {
        const newSigns = found
          .filter((kw) => !prev.some((p) => p.keyword === kw && Date.now() - p.time < 10000))
          .map((kw) => ({ keyword: kw, time: Date.now(), id: `${kw}-${Date.now()}` }));
        return [...prev, ...newSigns].slice(-20); // keep last 20
      });
    }
  }, [transcript]);

  /* Remove old signs (older than 30s) */
  useEffect(() => {
    const interval = setInterval(() => {
      setDetectedSigns((prev) => prev.filter((s) => Date.now() - s.time < 30000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* Unique currently-active keywords */
  const activeKeywords = useMemo(() => {
    const seen = new Set();
    return detectedSigns
      .filter((s) => {
        if (seen.has(s.keyword)) return false;
        seen.add(s.keyword);
        return true;
      })
      .reverse()
      .slice(0, 6);
  }, [detectedSigns]);

  return (
    <div className="glass-panel p-5 animate-slide-up">
      <h3 className="font-bold flex items-center gap-2 mb-4">🤟 Sign Language</h3>

      {activeKeywords.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <div className="text-5xl mb-3 animate-bounce-soft">🤟</div>
          <p className="text-sm">Sign language visuals will appear here when keywords are detected in the transcript.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {KEYWORDS.map((kw) => (
              <span key={kw} className="badge-info text-[10px]">{kw}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {activeKeywords.map((sign) => {
            const data = SIGN_DATA[sign.keyword];
            return (
              <div
                key={sign.id}
                className="animate-slide-up group"
              >
                <div
                  className={`rounded-2xl p-4 text-center text-white bg-gradient-to-br ${data.color}
                    shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default`}
                >
                  {/* Animated emoji */}
                  <div className="text-4xl sm:text-5xl mb-2 group-hover:animate-bounce-soft">
                    {data.emoji}
                  </div>
                  {/* Keyword label */}
                  <p className="font-bold text-sm sm:text-base">{data.label}</p>
                  {/* Gesture description */}
                  <p className="text-[10px] sm:text-xs opacity-90 mt-1 leading-snug">
                    {data.gesture}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reference grid */}
      {activeKeywords.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Supported Signs
          </p>
          <div className="flex flex-wrap gap-1.5">
            {KEYWORDS.map((kw) => (
              <span
                key={kw}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  activeKeywords.some((s) => s.keyword === kw)
                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 ring-1 ring-brand-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
