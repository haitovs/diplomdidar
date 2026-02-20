import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="page page-home">
      <div className="hero-card">
        <p className="hero-badge">Diploma Showcase Workflow</p>
        <h1>Network Simulator for Practical Networking Training</h1>
        <p>
          Build topologies, run deterministic traffic and failure scenarios, then review measurable outcomes.
        </p>
        <div className="hero-actions">
          <Link to="/playground" className="btn-primary">Open Playground</Link>
          <Link to="/simulation" className="btn-secondary">Open Simulation</Link>
        </div>
      </div>

      <div className="workflow-grid">
        <Link to="/playground" className="workflow-card">
          <h2>1. Build</h2>
          <p>Drag-and-drop editor for devices, links, and topology properties.</p>
        </Link>
        <Link to="/simulation" className="workflow-card">
          <h2>2. Run</h2>
          <p>Deterministic traffic engine with pattern changes and failure injection.</p>
        </Link>
        <Link to="/analytics" className="workflow-card">
          <h2>3. Analyze</h2>
          <p>Review saved reports with KPI summaries and objective status.</p>
        </Link>
      </div>
    </section>
  );
}
