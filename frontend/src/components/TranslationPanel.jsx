/**
 * TranslationPanel.jsx
 * Language dropdown + translated transcript display.
 * Calls the /api/translate endpoint for each new transcript line.
 */
import { useState, useEffect, useRef } from 'react';

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
];

/* Tailwind needs full class strings — no dynamic interpolation */
const SIZE_CLASS = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};
const FONT_CLASS = {
  sans: 'font-sans',
  dyslexia: 'font-dyslexia',
};

export default function TranslationPanel({
  transcript = [],
  fontSize = 'base',
  fontFamily = 'sans',
  language = 'hi',
  onLanguageChange,
  translations = {},
  onTranslationsChange,
}) {
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const prevLanguageRef = useRef(language);
  const abortRef = useRef(null);

  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      prevLanguageRef.current = language;
      onTranslationsChange({});
      if (language === 'en') return;
    }

    if (language === 'en') return;
    if (transcript.length === 0) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const translateAll = async () => {
      setLoading(true);
      const results = {};

      for (const entry of transcript) {
        if (controller.signal.aborted) return;
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: entry.text, targetLang: language }),
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            results[entry.id] = data.translatedText;
          } else {
            results[entry.id] = entry.text;
          }
        } catch (err) {
          if (err.name === 'AbortError') return;
          results[entry.id] = entry.text;
        }
      }

      if (!controller.signal.aborted) {
        onTranslationsChange(results);
        setLoading(false);
      }
    };

    translateAll();

    return () => {
      controller.abort();
    };
  }, [transcript, language, onTranslationsChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [translations]);

  const fmtTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleExport = () => {
    const lang = LANGUAGES.find((l) => l.code === language)?.name || language;
    const lines = transcript.map((t) => {
      const translated = language === 'en' ? t.text : translations[t.id] || t.text;
      return `[${fmtTime(t.timestamp)}] ${translated}`;
    });
    const blob = new Blob([`Language: ${lang}\n\n${lines.join('\n')}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-${language}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sizeClass = SIZE_CLASS[fontSize] || 'text-base';
  const fontClass = FONT_CLASS[fontFamily] || 'font-sans';

  return (
    <div className="glass-panel flex flex-col h-full animate-slide-up">
      <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <h3 className="font-bold flex items-center gap-2">🌐 Translation</h3>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="select-field text-sm py-1.5 w-auto min-w-[130px]"
            aria-label="Select translation language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
          <button onClick={handleExport} className="btn-icon text-sm" title="Export translation" disabled={transcript.length === 0}>
            📥
          </button>
        </div>
      </div>

      {loading && (
        <div className="px-4 pt-2">
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full animate-pulse-soft w-2/3" />
          </div>
        </div>
      )}

      {/* Translated text */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[150px] max-h-[50vh]">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <span className="text-3xl">🌐</span>
            <p className="text-sm">Translations will appear here…</p>
          </div>
        ) : (
          transcript.map((entry, idx) => {
            const translated = language === 'en' ? entry.text : translations[entry.id];
            const isLast = idx === transcript.length - 1;
            return (
              <div
                key={entry.id}
                className={`flex gap-3 py-2 px-3 rounded-lg transition-all duration-300 ${
                  isLast ? 'transcript-active' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap pt-1 select-none">
                  {fmtTime(entry.timestamp)}
                </span>
                <p className={`${sizeClass} ${fontClass} leading-relaxed flex-1`}>
                  {translated || (
                    <span className="text-slate-400 italic animate-pulse-soft">Translating…</span>
                  )}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
