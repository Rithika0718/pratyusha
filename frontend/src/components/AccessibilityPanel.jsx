/**
 * AccessibilityPanel.jsx
 * Controls for text size, dark mode, high contrast, font family,
 * and accessibility-mode selector (Text / Translation / Audio / Sign).
 */
const MODES = [
  { id: 'text',        label: 'Text Captions',  icon: '📝', desc: 'Live text captions' },
  { id: 'translation', label: 'Translation',     icon: '🌐', desc: 'Multi-language support' },
  { id: 'audio',       label: 'Audio',           icon: '🔊', desc: 'Text-to-speech narration' },
  { id: 'sign',        label: 'Sign Language',   icon: '🤟', desc: 'Visual sign support' },
];

const FONT_SIZES = [
  { id: 'sm',  label: 'S' },
  { id: 'base',label: 'M' },
  { id: 'lg',  label: 'L' },
  { id: 'xl',  label: 'XL' },
  { id: '2xl', label: 'XXL' },
];

export default function AccessibilityPanel({ settings, onSettingsChange }) {
  const { mode, fontSize, highContrast, fontFamily } = settings;

  const set = (key, value) => onSettingsChange({ ...settings, [key]: value });

  return (
    <div className="glass-panel p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-bold flex items-center gap-2">
        ♿ Accessibility
      </h2>

      {/* Mode selector */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Learning Mode
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => set('mode', m.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                mode === m.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 shadow-md scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="text-xl">{m.icon}</span>
              <span className="text-xs font-semibold">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Text size */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Text Size
        </p>
        <div className="flex gap-1">
          {FONT_SIZES.map((f) => (
            <button
              key={f.id}
              onClick={() => set('fontSize', f.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                fontSize === f.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font family */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Font
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => set('fontFamily', 'sans')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              fontFamily === 'sans'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => set('fontFamily', 'dyslexia')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 font-dyslexia ${
              fontFamily === 'dyslexia'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Dyslexia
          </button>
        </div>
      </div>

      {/* High contrast */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">High Contrast</span>
        <button
          onClick={() => set('highContrast', !highContrast)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            highContrast ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
          role="switch"
          aria-checked={highContrast}
          aria-label="Toggle high contrast"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
              highContrast ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}
