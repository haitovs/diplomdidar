import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTheme } from './lib/useTheme.js';
import { useLang } from './lib/useLang.js';
import HomePage from './pages/HomePage.jsx';
import PlaygroundPage from './pages/PlaygroundPage.jsx';
import SimulationPage from './pages/SimulationPage.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/playground', label: 'Playground' },
  { to: '/simulation', label: 'Simulation' },
];

function AppNav() {
  const location = useLocation();
  const [theme, toggleTheme] = useTheme();
  const { label: langLabel, cycleLang } = useLang();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-logo">Network Packet Simulator</Link>
        <nav className="app-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`app-nav-link${location.pathname === item.to ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="header-action-btn"
            onClick={cycleLang}
            title="Change language"
            aria-label="Change language"
          >
            {langLabel}
          </button>
          <button
            className="header-action-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '\u2600' : '\u263E'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <AppNav />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
