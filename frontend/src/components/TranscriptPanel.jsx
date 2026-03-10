/**
 * TranscriptPanel.jsx
 * Displays a live-scrolling lecture transcript with timestamps,
 * active-sentence highlighting, search, export, and clear options.
 */
import { useRef, useEffect, useState } from 'react';

/* Tailwind needs full class strings at build time — no dynamic interpolation */
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

export default function TranscriptPanel({
  transcript = [],      // [{ id, text, timestamp }]
  isAdmin = false,
  onClear,
  onExport,
  activeId,             // id of the most recent entry (highlighted)
  fontSize = 'base',    // 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  fontFamily = 'sans',  // 'sans' | 'dyslexia'
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Auto-scroll to bottom on new transcript
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length]);

  /* Format timestamp */
  const fmtTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  /* Filter by search */
  const filtered = searchQuery
    ? transcript.filter((t) => t.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : transcript;

  /* Export transcript as .txt */
  const handleExport = () => {
    if (onExport) return onExport();
    const content = transcript.map((t) => `[${fmtTime(t.timestamp)}] ${t.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* Resolved class strings */
  const sizeClass = SIZE_CLASS[fontSize] || 'text-base';
  const fontClass = FONT_CLASS[fontFamily] || 'font-sans';

  return (
    <div className="glass-panel flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <h2 className="text-lg font-bold flex items-center gap-2">
          📝 Live Transcript
          {transcript.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({transcript.length} lines)</span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen((o) => !o)}
            className="btn-icon text-sm"
            title="Search transcript"
            aria-label="Search transcript"
          >
            🔍
          </button>
          {/* Export */}
          <button
            onClick={handleExport}
            className="btn-icon text-sm"
            title="Export transcript"
            aria-label="Export transcript"
            disabled={transcript.length === 0}
          >
            📥
          </button>
          {/* Clear (admin only) */}
          {isAdmin && (
            <button
              onClick={onClear}
              className="btn-icon text-sm text-rose-500 hover:text-rose-600"
              title="Clear transcript"
              aria-label="Clear transcript"
              disabled={transcript.length === 0}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-4 pt-3 animate-slide-up">
          <input
            type="text"
            placeholder="Search transcript…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field text-sm"
            autoFocus
          />
          {searchQuery && (
            <p className="text-xs text-slate-400 mt-1">
              {filtered.length} match{filtered.length !== 1 ? 'es' : ''} found
            </p>
          )}
        </div>
      )}

      {/* Transcript body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px] max-h-[60vh]"
        role="log"
        aria-live="polite"
        aria-label="Lecture transcript"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2">
            <span className="text-4xl">🎤</span>
            <p className="text-sm">
              {transcript.length === 0
                ? 'Waiting for lecture to begin…'
                : 'No results match your search.'}
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className={`flex gap-3 py-2 px-3 rounded-lg transition-all duration-300 ${
                entry.id === activeId ? 'transcript-active' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap pt-1 select-none">
                {fmtTime(entry.timestamp)}
              </span>
              <p className={`${sizeClass} ${fontClass} leading-relaxed flex-1`}>
                {searchQuery ? highlightText(entry.text, searchQuery) : entry.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/**
 * Highlight matching search terms inside text.
 */
function highlightText(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-amber-200 dark:bg-amber-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
