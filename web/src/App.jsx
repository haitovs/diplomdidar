import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
