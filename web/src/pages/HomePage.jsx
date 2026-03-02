import { Link } from 'react-router-dom';

const SCENARIOS = [
  {
    badge: 'Ping Lab',
    title: 'Basic Ping Lab',
    description: 'Configure IPs on two PCs connected through a switch and verify connectivity with ping.',
    outcome: 'Goal: successful ICMP echo request/reply exchange',
    to: '/simulation',
    action: 'Open Simulation',
  },
  {
    badge: 'Routing Lab',
    title: 'Static Routing Lab',
    description: 'Set up static routes on a router to enable communication between two subnets.',
    outcome: 'Goal: ping across subnets through a configured router',
    to: '/simulation',
    action: 'Open Simulation',
  },
  {
    badge: 'Debug Lab',
    title: 'Network Troubleshooting',
    description: 'Diagnose why packets are being dropped using CLI tools: show arp, show ip route, show interfaces.',
    outcome: 'Goal: identify and fix misconfigured interfaces or routes',
    to: '/playground',
    action: 'Open Playground',
  },
];

const VALUE_ITEMS = [
  {
    title: 'Step-by-Step Packet Tracing',
    description: 'Watch every ARP request, ICMP echo, and MAC table update as packets traverse the network hop by hop.',
  },
  {
    title: 'Cisco-Like CLI',
    description: 'Configure routers and switches with familiar IOS commands: ip address, ip route, show arp, and more.',
  },
  {
    title: 'Visual Learning',
    description: 'See packet envelopes animate along links, interface status dots on devices, and layer-by-layer packet inspection.',
  },
];

export default function HomePage() {
  return (
    <section className="page page-home">
      <div className="home-hero-layout">
        <div className="hero-card home-hero-main">
          <p className="hero-badge">Network Packet Simulator</p>
          <h1>Build topologies, configure devices, trace packets step by step</h1>
          <p className="home-hero-copy">
            A simplified Cisco Packet Tracer for learning networking fundamentals. Build network topologies, assign IP addresses, configure static routes, and trace individual ARP and ICMP packets through the network.
          </p>
          <div className="hero-actions">
            <Link to="/playground" className="btn-primary">Start Building</Link>
            <Link to="/simulation" className="btn-secondary">Open Simulation</Link>
          </div>
          <div className="home-pill-row">
            <span className="home-pill">ARP Resolution</span>
            <span className="home-pill">ICMP Ping</span>
            <span className="home-pill">Static Routing</span>
            <span className="home-pill">CLI Configuration</span>
          </div>
        </div>
        <aside className="home-hero-panel">
          <h3>Workflow</h3>
          <ol className="home-flow-list">
            <li><strong>1. Build</strong><span>Create nodes and links in the Playground editor.</span></li>
            <li><strong>2. Configure</strong><span>Assign IP addresses, subnet masks, and static routes via CLI or config dialog.</span></li>
            <li><strong>3. Simulate</strong><span>Send pings and step through each packet hop-by-hop.</span></li>
          </ol>
          <div className="home-mini-kpis">
            <article><strong>L2/L3</strong><span>ARP + IP</span></article>
            <article><strong>CLI</strong><span>25+ Commands</span></article>
            <article><strong>Step</strong><span>Packet Trace</span></article>
            <article><strong>JSON</strong><span>Import/Export</span></article>
          </div>
          <Link to="/playground" className="btn-secondary home-panel-cta">Open Playground</Link>
        </aside>
      </div>

      <section className="home-section">
        <header className="home-section-header">
          <h2>Ready-to-Run Scenarios</h2>
          <p>Start from focused labs with clear networking goals.</p>
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
          <h2>Key Features</h2>
          <p>Tools for understanding how networks really work.</p>
        </header>
        <div className="home-grid">
          {VALUE_ITEMS.map((item) => (
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
