/**
 * App.jsx
 * Root component with React Router for Admin and Student dashboards.
 */
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

/* ------------------------------------------------------------------ */
/*  Navigation Header                                                  */
/* ------------------------------------------------------------------ */
function Header({ darkMode, setDarkMode }) {
  const location = useLocation();
  const isAdmin = location.pathname === '/' || location.pathname === '/admin';

  return (
    <header className="sticky top-0 z-50 bg-gradient-brand text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="graduation cap">🎓</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-none">
                Inclusive Classroom AI
              </h1>
              <p className="text-[10px] sm:text-xs text-brand-200 font-medium tracking-wide">
                Real-Time Accessible Learning
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isAdmin
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">🛡️ </span>Admin
            </Link>
            <Link
              to="/student"
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                !isAdmin
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">📚 </span>Student
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="ml-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  App Root                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <BrowserRouter>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="bg-mesh min-h-[calc(100vh-4rem)]">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}
