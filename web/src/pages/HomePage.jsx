import { Link } from 'react-router-dom';

const KPI_ITEMS = [
  {
    title: 'Deterministic Evidence',
    description: 'Metrics come from topology parameters and traffic routing, not random demo numbers.',
  },
  {
    title: 'Failure Diagnostics',
    description: 'Trigger outages and recoveries, then compare latency, loss, and throughput deltas.',
  },
  {
    title: 'Reportable Outcomes',
    description: 'Export measurable run summaries suitable for practical assignments and defense materials.',
  },
];

const SCENARIOS = [
  {
    badge: 'Traffic Lab',
    title: 'Classroom Congestion Control',
    description: 'Measure congestion behavior under lecture-time demand spikes.',
    outcome: 'Target: latency < 35 ms, utilization < 82%',
    to: '/simulation',
    action: 'Run In Simulation',
  },
  {
    badge: 'Resilience Lab',
    title: 'Core Link Failure Drill',
    description: 'Test failover behavior when a critical backbone link goes down.',
    outcome: 'Target: keep packet loss under 2% after reroute',
    to: '/simulation',
    action: 'Inject Failure',
  },
  {
    badge: 'Design Lab',
    title: 'Topology Build Assignment',
    description: 'Create and tune a custom network for scenario-based coursework.',
    outcome: 'Target: stable topology with valid links and routing roles',
    to: '/playground',
    action: 'Open Playground',
  },
];

export default function HomePage() {
  return (
    <section className="page page-home">
      <div className="home-hero-layout">
        <div className="hero-card home-hero-main">
          <p className="hero-badge">Practical Networking Course Lab</p>
          <h1>Network Training Simulator</h1>
          <p className="home-hero-copy">
            Build a topology, run deterministic traffic and failure scenarios, and present measurable networking outcomes.
          </p>
          <div className="hero-actions">
            <Link to="/playground" className="btn-primary">Start Building</Link>
            <Link to="/simulation" className="btn-secondary">Open Simulation</Link>
            <Link to="/analytics" className="btn-secondary">Open Analytics</Link>
          </div>
          <div className="home-pill-row">
            <span className="home-pill">Deterministic Metrics</span>
            <span className="home-pill">Failure Injection</span>
            <span className="home-pill">Exportable Reports</span>
          </div>
        </div>
        <aside className="home-hero-panel">
          <h3>Guided Workflow</h3>
          <ol className="home-flow-list">
            <li><strong>1. Build</strong><span>Create nodes, links, and network parameters in Playground.</span></li>
            <li><strong>2. Run</strong><span>Launch scenario traffic and failures in Simulation.</span></li>
            <li><strong>3. Analyze</strong><span>Import report and verify KPI targets in Analytics.</span></li>
          </ol>
          <div className="home-mini-kpis">
            <article><strong>3</strong><span>Core Pages</span></article>
            <article><strong>1</strong><span>Unified Flow</span></article>
            <article><strong>100%</strong><span>Local Control</span></article>
            <article><strong>JSON</strong><span>Report Export</span></article>
          </div>
          <Link to="/playground" className="btn-secondary home-panel-cta">Open Practical Lab</Link>
        </aside>
      </div>

      <section className="home-section">
        <header className="home-section-header">
          <h2>Ready-to-Run Scenarios</h2>
          <p>Start from focused labs with measurable goals.</p>
        </header>
        <div className="home-scenario-grid">
          {SCENARIOS.map((scenario) => (
            <article key={scenario.title} className="home-card scenario-card">
              <span className="scenario-badge">{scenario.badge}</span>
              <h3>{scenario.title}</h3>
              <p>{scenario.description}</p>
              <p className="scenario-outcome">{scenario.outcome}</p>
              <Link to={scenario.to} className="btn-secondary scenario-launch">{scenario.action}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <header className="home-section-header">
          <h2>Diploma-Defense Value</h2>
          <p>Evidence the checker can verify quickly.</p>
        </header>
        <div className="home-grid">
          {KPI_ITEMS.map((item) => (
            <article key={item.title} className="home-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
