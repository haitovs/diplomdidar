import { Link } from 'react-router-dom';

const KPI_ITEMS = [
  {
    title: 'Throughput Tracking',
    description: 'Compute Mbps from routed demand and per-link capacity instead of random values.',
  },
  {
    title: 'Latency and Loss',
    description: 'Observe deterministic latency, jitter, and packet-loss changes under congestion and failures.',
  },
  {
    title: 'Failure Recovery',
    description: 'Inject node/link failures, recover the network, and compare metric impact in reports.',
  },
];

const SCENARIOS = [
  {
    title: 'Classroom Congestion',
    description: 'Validate that peak-hour classroom traffic stays under latency and utilization limits.',
    to: '/simulation',
    action: 'Run Scenario',
  },
  {
    title: 'Core Link Failure',
    description: 'Check resilience when a core path drops and traffic reroutes through remaining links.',
    to: '/simulation',
    action: 'Test Failure',
  },
  {
    title: 'Topology Lab Build',
    description: 'Create custom network layouts and tune device/link parameters for assignments.',
    to: '/playground',
    action: 'Open Builder',
  },
];

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
          <Link to="/analytics" className="btn-secondary">Open Analytics</Link>
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

      <h2 className="home-section-title">What This Simulator Validates</h2>
      <div className="home-grid">
        {KPI_ITEMS.map((item) => (
          <article key={item.title} className="home-card">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>

      <h2 className="home-section-title">Recommended Practical Scenarios</h2>
      <div className="home-grid">
        {SCENARIOS.map((scenario) => (
          <article key={scenario.title} className="home-card">
            <h3>{scenario.title}</h3>
            <p>{scenario.description}</p>
            <div className="hero-actions">
              <Link to={scenario.to} className="btn-secondary">{scenario.action}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
