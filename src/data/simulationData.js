export const topologyPresets = {
  campusWeekday: {
    nodes: [
      { id: 'core-a', label: 'Alpha Spine', type: 'core', campus: 'North', load: 0.6, position: { x: 0.48, y: 0.28 } },
      { id: 'core-b', label: 'Beta Mesh', type: 'core', campus: 'Innovation', load: 0.55, position: { x: 0.72, y: 0.5 } },
      { id: 'core-c', label: 'Gamma Hub', type: 'core', campus: 'South', load: 0.57, position: { x: 0.28, y: 0.6 } },
      { id: 'edge-a1', label: 'Lab A1', type: 'edge', campus: 'North', load: 0.64, position: { x: 0.18, y: 0.2 } },
      { id: 'edge-a2', label: 'Hall A2', type: 'edge', campus: 'North', load: 0.42, position: { x: 0.38, y: 0.14 } },
      { id: 'edge-b1', label: 'XR Lab B1', type: 'edge', campus: 'Innovation', load: 0.78, position: { x: 0.8, y: 0.28 } },
      { id: 'edge-b2', label: 'Studio B2', type: 'edge', campus: 'Innovation', load: 0.5, position: { x: 0.88, y: 0.58 } },
      { id: 'edge-c1', label: 'Lecture C1', type: 'edge', campus: 'South', load: 0.46, position: { x: 0.2, y: 0.74 } },
      { id: 'edge-c2', label: 'Studio C2', type: 'edge', campus: 'South', load: 0.58, position: { x: 0.42, y: 0.84 } },
    ],
    links: [
      { source: 'core-a', target: 'core-b', latency: 3, type: 'fiber' },
      { source: 'core-b', target: 'core-c', latency: 3.6, type: 'fiber' },
      { source: 'core-c', target: 'core-a', latency: 3.2, type: 'fiber' },
      { source: 'core-a', target: 'edge-a1', latency: 1, type: 'access' },
      { source: 'core-a', target: 'edge-a2', latency: 1.2, type: 'access' },
      { source: 'core-b', target: 'edge-b1', latency: 0.8, type: 'access' },
      { source: 'core-b', target: 'edge-b2', latency: 1.1, type: 'access' },
      { source: 'core-c', target: 'edge-c1', latency: 1.2, type: 'access' },
      { source: 'core-c', target: 'edge-c2', latency: 1.1, type: 'access' },
    ],
  },
  examCrunch: {
    nodes: [
      { id: 'core-a', label: 'Exam Spine', type: 'core', campus: 'North', load: 0.72, position: { x: 0.45, y: 0.28 } },
      { id: 'core-b', label: 'Proctor Hub', type: 'core', campus: 'Innovation', load: 0.81, position: { x: 0.65, y: 0.45 } },
      { id: 'edge-ex1', label: 'Proctor Pods', type: 'edge', campus: 'North', load: 0.86, position: { x: 0.18, y: 0.32 } },
      { id: 'edge-ex2', label: 'Secure Browsers', type: 'edge', campus: 'South', load: 0.9, position: { x: 0.82, y: 0.32 } },
      { id: 'edge-ex3', label: 'XR Jury', type: 'edge', campus: 'Innovation', load: 0.79, position: { x: 0.48, y: 0.12 } },
      { id: 'edge-ex4', label: 'VR Stage', type: 'edge', campus: 'Innovation', load: 0.7, position: { x: 0.54, y: 0.68 } },
    ],
    links: [
      { source: 'core-a', target: 'core-b', latency: 2.4, type: 'fiber' },
      { source: 'core-a', target: 'edge-ex1', latency: 0.8, type: 'access' },
      { source: 'core-a', target: 'edge-ex3', latency: 0.9, type: 'access' },
      { source: 'core-b', target: 'edge-ex2', latency: 1.1, type: 'access' },
      { source: 'core-b', target: 'edge-ex4', latency: 1, type: 'access' },
      { source: 'edge-ex3', target: 'edge-ex4', latency: 1.6, type: 'mesh' },
    ],
  },
  maintenanceNight: {
    nodes: [
      { id: 'core-alpha', label: 'Core Alpha', type: 'core', campus: 'North', load: 0.42, position: { x: 0.35, y: 0.3 } },
      { id: 'core-beta', label: 'Core Beta', type: 'core', campus: 'South', load: 0.4, position: { x: 0.58, y: 0.5 } },
      { id: 'ops-ring', label: 'Ops Ring', type: 'edge', campus: 'Ops', load: 0.35, position: { x: 0.5, y: 0.75 } },
      { id: 'dorm-mesh', label: 'Dorm Mesh', type: 'edge', campus: 'Dorm', load: 0.33, position: { x: 0.18, y: 0.62 } },
      { id: 'backup', label: 'Backup Spine', type: 'core', campus: 'Backup', load: 0.38, position: { x: 0.78, y: 0.2 } },
    ],
    links: [
      { source: 'core-alpha', target: 'core-beta', latency: 3, type: 'fiber', control: { x: 0.45, y: 0.42 } },
      { source: 'core-beta', target: 'backup', latency: 3.4, type: 'fiber' },
      { source: 'backup', target: 'core-alpha', latency: 3.8, type: 'fiber' },
      { source: 'core-alpha', target: 'dorm-mesh', latency: 1.4, type: 'access' },
      { source: 'core-beta', target: 'ops-ring', latency: 1.1, type: 'access' },
      { source: 'ops-ring', target: 'dorm-mesh', latency: 1.6, type: 'mesh' },
    ],
  },
  schoolOpenDay: {
    nodes: [
      { id: 'core-stem', label: 'STEM Backbone', type: 'core', campus: 'STEM', load: 0.7, position: { x: 0.5, y: 0.24 } },
      { id: 'core-hall', label: 'Auditorium Hub', type: 'core', campus: 'Hall', load: 0.6, position: { x: 0.27, y: 0.5 } },
      { id: 'core-makers', label: 'Makerspace Bus', type: 'core', campus: 'Makers', load: 0.66, position: { x: 0.72, y: 0.52 } },
      { id: 'node-drone', label: 'Drone Dome', type: 'edge', campus: 'Field', load: 0.82, position: { x: 0.16, y: 0.24 } },
      { id: 'node-parents', label: 'Parents Wi-Fi', type: 'edge', campus: 'Lobby', load: 0.56, position: { x: 0.2, y: 0.72 } },
      { id: 'node-robots', label: 'Robotics Lab', type: 'edge', campus: 'Lab', load: 0.74, position: { x: 0.72, y: 0.18 } },
      { id: 'node-stage', label: 'STEM Theater', type: 'edge', campus: 'Hall', load: 0.5, position: { x: 0.84, y: 0.64 } },
    ],
    links: [
      { source: 'core-stem', target: 'core-hall', latency: 2.8, type: 'fiber' },
      { source: 'core-stem', target: 'core-makers', latency: 2.6, type: 'fiber' },
      { source: 'core-hall', target: 'core-makers', latency: 2.9, type: 'fiber' },
      { source: 'core-hall', target: 'node-drone', latency: 0.9, type: 'access' },
      { source: 'core-hall', target: 'node-parents', latency: 1.1, type: 'access' },
      { source: 'core-makers', target: 'node-robots', latency: 0.8, type: 'access' },
      { source: 'core-makers', target: 'node-stage', latency: 0.9, type: 'access' },
      { source: 'node-robots', target: 'node-drone', latency: 1.7, type: 'mesh' },
    ],
  },
  officeSprint: {
    nodes: [
      { id: 'core-hq', label: 'HQ Spine', type: 'core', campus: 'HQ', load: 0.75, position: { x: 0.48, y: 0.25 } },
      { id: 'core-dr', label: 'DR Core', type: 'core', campus: 'DR', load: 0.62, position: { x: 0.75, y: 0.5 } },
      { id: 'node-soc', label: 'Security SOC', type: 'edge', campus: 'HQ', load: 0.81, position: { x: 0.22, y: 0.2 } },
      { id: 'node-war', label: 'War Room', type: 'edge', campus: 'HQ', load: 0.78, position: { x: 0.2, y: 0.55 } },
      { id: 'node-design', label: 'Design Pod', type: 'edge', campus: 'Satellite', load: 0.6, position: { x: 0.74, y: 0.18 } },
      { id: 'node-finance', label: 'Finance Floor', type: 'edge', campus: 'HQ', load: 0.58, position: { x: 0.62, y: 0.72 } },
      { id: 'node-innovation', label: 'Innovation Lab', type: 'edge', campus: 'Satellite', load: 0.66, position: { x: 0.9, y: 0.32 } },
    ],
    links: [
      { source: 'core-hq', target: 'core-dr', latency: 2.5, type: 'fiber' },
      { source: 'core-hq', target: 'node-soc', latency: 0.8, type: 'access' },
      { source: 'core-hq', target: 'node-war', latency: 1, type: 'access' },
      { source: 'core-hq', target: 'node-design', latency: 1.3, type: 'access' },
      { source: 'core-dr', target: 'node-finance', latency: 1.1, type: 'access' },
      { source: 'core-dr', target: 'node-innovation', latency: 1, type: 'access' },
      { source: 'node-soc', target: 'node-war', latency: 0.8, type: 'mesh' },
    ],
  },
  marketWeekend: {
    nodes: [
      { id: 'core-hub', label: 'Retail Hub', type: 'core', campus: 'Mall', load: 0.7, position: { x: 0.5, y: 0.28 } },
      { id: 'core-warehouse', label: 'Warehouse Core', type: 'core', campus: 'Warehouse', load: 0.65, position: { x: 0.36, y: 0.58 } },
      { id: 'core-control', label: 'Control Tower', type: 'core', campus: 'Ops', load: 0.62, position: { x: 0.74, y: 0.54 } },
      { id: 'node-checkout', label: 'Checkout Cluster', type: 'edge', campus: 'Mall', load: 0.84, position: { x: 0.22, y: 0.35 } },
      { id: 'node-ar', label: 'AR Mirrors', type: 'edge', campus: 'Mall', load: 0.76, position: { x: 0.78, y: 0.22 } },
      { id: 'node-inventory', label: 'Inventory IoT', type: 'edge', campus: 'Warehouse', load: 0.69, position: { x: 0.24, y: 0.78 } },
      { id: 'node-parking', label: 'Parking Sensors', type: 'edge', campus: 'Parking', load: 0.52, position: { x: 0.8, y: 0.78 } },
    ],
    links: [
      { source: 'core-hub', target: 'core-warehouse', latency: 3, type: 'fiber' },
      { source: 'core-hub', target: 'core-control', latency: 2.8, type: 'fiber' },
      { source: 'core-warehouse', target: 'core-control', latency: 3.1, type: 'fiber' },
      { source: 'core-hub', target: 'node-checkout', latency: 0.9, type: 'access' },
      { source: 'core-hub', target: 'node-ar', latency: 1, type: 'access' },
      { source: 'core-warehouse', target: 'node-inventory', latency: 0.8, type: 'access' },
      { source: 'core-control', target: 'node-parking', latency: 0.9, type: 'access' },
      { source: 'node-ar', target: 'node-checkout', latency: 1.2, type: 'mesh' },
    ],
  },
};

export const scenarios = {
  default: {
    title: 'Weekday Peak',
    description: 'Typical Tuesday load across three campuses.',
    tags: ['8h schedule', 'Mixed labs', 'AI tutoring'],
    multipliers: { load: 1, ai: 0.8, energy: 1 },
    profile: 'campus',
    hero: { campuses: 3, rooms: 28, tickets: 124 },
    topology: 'campusWeekday',
  },
  exam: {
    title: 'Exam Crunch',
    description: 'Finals week with doubled proctoring streams.',
    tags: ['HD proctoring', 'XR defenses', 'Guests 2.3x'],
    multipliers: { load: 1.3, ai: 1.5, energy: 1.2 },
    profile: 'campus',
    hero: { campuses: 3, rooms: 30, tickets: 188 },
    topology: 'examCrunch',
  },
  maintenance: {
    title: 'Nightly Maintenance',
    description: 'Loads shift to redundant links while patching firmware.',
    tags: ['Rolling reboot', 'QoS strict', 'Guests paused'],
    multipliers: { load: 0.6, ai: 0.4, energy: 0.5 },
    profile: 'campus',
    hero: { campuses: 3, rooms: 18, tickets: 54 },
    topology: 'maintenanceNight',
  },
  school: {
    title: 'STEM Open Day',
    description: 'Parents tour specialty labs, student demos everywhere.',
    tags: ['Parents Wi-Fi', 'Drone demos', 'Guided tours'],
    multipliers: { load: 1.15, ai: 0.9, energy: 1.05 },
    profile: 'school',
    hero: { campuses: 2, rooms: 18, tickets: 96 },
    topology: 'schoolOpenDay',
  },
  office: {
    title: 'Office Sprint',
    description: 'Quarter-end crunch with video war rooms and SOC drills.',
    tags: ['Hybrid staff', 'SaaS surge', 'Security drills'],
    multipliers: { load: 1.25, ai: 1.1, energy: 1.1 },
    profile: 'office',
    hero: { campuses: 1, rooms: 34, tickets: 142 },
    topology: 'officeSprint',
  },
  market: {
    title: 'Weekend Market',
    description: 'Retail footfall spike with AR mirrors and checkout beacons.',
    tags: ['POS burst', 'AR promos', 'Inventory drones'],
    multipliers: { load: 1.35, ai: 0.7, energy: 1.2 },
    profile: 'market',
    hero: { campuses: 4, rooms: 26, tickets: 110 },
    topology: 'marketWeekend',
  },
};

export const scenarioOrder = ['default', 'exam', 'maintenance', 'school', 'office', 'market'];

export const schedules = {
  default: [
    {
      room: 'Lecture C1',
      color: '#6c7cff',
      slots: [
        { start: 8, duration: 1.5, label: 'Distributed Systems' },
        { start: 11, duration: 1.25, label: 'Ethical AI' },
        { start: 15, duration: 1.5, label: '5G Lab' },
      ],
    },
    {
      room: 'XR Lab B2',
      color: '#4ee1c1',
      slots: [
        { start: 9, duration: 2, label: 'VR Studio' },
        { start: 13, duration: 1, label: 'Haptics Demo' },
        { start: 16, duration: 1.2, label: 'Dev Sprint' },
      ],
    },
    {
      room: 'Lab A1',
      color: '#fcb045',
      slots: [
        { start: 8.5, duration: 1, label: 'Security' },
        { start: 10.5, duration: 1.5, label: 'Networks' },
        { start: 14, duration: 1, label: 'Capstone' },
      ],
    },
  ],
  exam: [
    {
      room: 'Hall A2',
      color: '#fcb045',
      slots: [
        { start: 8, duration: 2, label: 'Distributed Systems Exam' },
        { start: 12, duration: 1.5, label: 'AI Ethics Oral' },
      ],
    },
    {
      room: 'XR Defense Room',
      color: '#6c7cff',
      slots: [
        { start: 9.5, duration: 1.2, label: 'XR Defense' },
        { start: 14, duration: 1.2, label: 'Capstone Jury' },
        { start: 16, duration: 1, label: 'Makeup Exam' },
      ],
    },
    {
      room: 'Proctor Lab',
      color: '#4ee1c1',
      slots: [
        { start: 10, duration: 2, label: 'Secure Browser' },
        { start: 13, duration: 1.5, label: 'Oral Prep' },
      ],
    },
  ],
  maintenance: [
    {
      room: 'Backup Lab',
      color: '#6c7cff',
      slots: [
        { start: 8, duration: 1, label: 'Failover Test' },
        { start: 11, duration: 1, label: 'Patch Review' },
      ],
    },
    {
      room: 'Ops War Room',
      color: '#4ee1c1',
      slots: [
        { start: 9, duration: 1, label: 'Firmware Push' },
        { start: 15, duration: 1.2, label: 'QA Signoff' },
      ],
    },
    {
      room: 'Dorm Access',
      color: '#fcb045',
      slots: [
        { start: 10, duration: 0.8, label: 'AP Swap' },
        { start: 13.5, duration: 1, label: 'Power Cycle' },
      ],
    },
  ],
  school: [
    {
      room: 'Makerspace',
      color: '#f472b6',
      slots: [
        { start: 9, duration: 1, label: 'Robotics Demo' },
        { start: 11.5, duration: 1, label: '3D Printing' },
        { start: 14.5, duration: 1, label: 'Parents Tour' },
      ],
    },
    {
      room: 'Drone Dome',
      color: '#38bdf8',
      slots: [
        { start: 10, duration: 1.2, label: 'Flight Class' },
        { start: 13, duration: 1, label: 'Showcase' },
        { start: 15.3, duration: 0.9, label: 'Student Finals' },
      ],
    },
    {
      room: 'STEM Theater',
      color: '#a78bfa',
      slots: [
        { start: 8.5, duration: 1, label: 'Opening Keynote' },
        { start: 12, duration: 1.3, label: 'Panel Talk' },
        { start: 16, duration: 0.8, label: 'Awards' },
      ],
    },
  ],
  office: [
    {
      room: 'War Room',
      color: '#fcb045',
      slots: [
        { start: 8, duration: 2, label: 'QBR Dry Run' },
        { start: 13.5, duration: 1.5, label: 'Incident Drill' },
      ],
    },
    {
      room: 'Townhall Stage',
      color: '#6c7cff',
      slots: [
        { start: 10, duration: 1, label: 'All-hands' },
        { start: 15, duration: 1, label: 'Partner Sync' },
      ],
    },
    {
      room: 'Security SOC',
      color: '#34d399',
      slots: [
        { start: 9, duration: 1.5, label: 'Threat Hunt' },
        { start: 12.5, duration: 1, label: 'Patch Review' },
        { start: 16, duration: 0.8, label: 'Handoff' },
      ],
    },
  ],
  market: [
    {
      room: 'Checkout Cluster',
      color: '#fcd34d',
      slots: [
        { start: 9, duration: 1.5, label: 'Brunch Rush' },
        { start: 12.5, duration: 2, label: 'Lunchtime' },
        { start: 16.5, duration: 1.2, label: 'Evening Deals' },
      ],
    },
    {
      room: 'AR Mirror Zone',
      color: '#a78bfa',
      slots: [
        { start: 10, duration: 1, label: 'Promo Cycle' },
        { start: 13, duration: 1.5, label: 'Styling Show' },
        { start: 17, duration: 1, label: 'Loyalty Rush' },
      ],
    },
    {
      room: 'Inventory Bay',
      color: '#4ee1c1',
      slots: [
        { start: 8.5, duration: 1.2, label: 'Drone Count' },
        { start: 11.8, duration: 1, label: 'Restock' },
        { start: 15, duration: 1.2, label: 'Fulfillment' },
      ],
    },
  ],
};

export const aiInsightLibrary = {
  campus: [
    'North campus core remains within latency budget despite AR sessions.',
    'XR Lab B2 hitting 92% load — consider offloading final renders to render farm.',
    'Guest Wi-Fi spike predicted at 14:40 due to robotics showcase.',
    'Fiber ring Beta↔Gamma stable. Suggest scheduling firmware patch tonight.',
  ],
  school: [
    'Drone Dome telemetry remains synchronized with auditorium streaming.',
    'Parents Wi-Fi isolated from student VLANs; captive portal OK.',
    'Robotics Lab cooling within range — keep doors open during awards.',
    'Guided tours cause predictable roaming; prefetch AR assets.',
  ],
  office: [
    'War Room VC saturates 410 Mbps but SD-WAN paths still green.',
    'SOC packet captures add 6% load; rotate storage if drill extends.',
    'Hybrid workers entering HQ triggered guest isolation policy as designed.',
    'Design Pod GPU renders pinned; consider bursting to cloud node.',
  ],
  market: [
    'Checkout cluster jitter rising as loyalty beacons broadcast flash deals.',
    'Warehouse robots synced; inventory delta under 2% after lunch rush.',
    'AR mirrors compress feed before uplink, keeping shoppers latency <35 ms.',
    'Parking sensors detect 18-minute dwell spike; push notification ready.',
  ],
};

export const reliabilityLibrary = {
  campus: [
    {
      title: 'Fiber splice inspection',
      detail: 'Thermal drift detected on Beta ↔ Gamma span. Rerouted 18% traffic via Alpha.',
      status: 'observing',
    },
    {
      title: 'AI assistant cache warm',
      detail: 'Inference cache hydrated every 5 min with top 20 intents to demo low latency.',
      status: 'info',
    },
    {
      title: 'Power shelf redundancy',
      detail: 'South campus UPS swapped. Battery discharge test scheduled 22:00.',
      status: 'scheduled',
    },
  ],
  school: [
    {
      title: 'Auditorium fiber loop',
      detail: 'Temporary 6dB loss observed after automated light show rehearsal.',
      status: 'observing',
    },
    {
      title: 'Drone pad geofence',
      detail: 'Geo-beacons recalibrated every 15 min to keep parents area safe.',
      status: 'info',
    },
    {
      title: 'Charging cart rotation',
      detail: 'Makerspace battery carts swapped every 2 hrs to avoid demo downtime.',
      status: 'scheduled',
    },
  ],
  office: [
    {
      title: 'SD-WAN tunnel burst',
      detail: 'Finance VPN pre-provisioned to accommodate QBR attachments.',
      status: 'info',
    },
    {
      title: 'Failover rehearsal',
      detail: 'Live traffic will swing to DR Core for 8 minutes at 17:00.',
      status: 'scheduled',
    },
    {
      title: 'SOC sensor noise',
      detail: 'Packet brokers dropping debug captures to keep queue depth <70%.',
      status: 'alert',
    },
  ],
  market: [
    {
      title: 'Checkout beacon sync',
      detail: 'BLE beacons in zone B recalibrated to reduce interference from pop-up kiosks.',
      status: 'info',
    },
    {
      title: 'Cold-chain monitoring',
      detail: 'Warehouse core replicates telemetry to mall control every 3 minutes.',
      status: 'observing',
    },
    {
      title: 'POS firmware freeze',
      detail: 'Patch window deferred until after loyalty marathon on Sunday night.',
      status: 'scheduled',
    },
  ],
};

export const simulationPlaybooks = [
  {
    id: 'school-open-day',
    title: 'School · Open Day',
    scenario: 'school',
    aiLoad: 0.68,
    overrides: { concurrent: 22, labs: 5, guest: 'spike', threshold: 82 },
    instruments: { jitter: 12, sensors: 4, powerMode: 'balanced', failover: false, lockdown: true },
    blurb: 'Parents on campus, robotics demos everywhere — guest Wi-Fi needs extra love.',
  },
  {
    id: 'office-war-room',
    title: 'Office · War Room Sprint',
    scenario: 'office',
    aiLoad: 0.74,
    overrides: { concurrent: 18, labs: 4, guest: 'moderate', threshold: 78 },
    instruments: { jitter: 18, sensors: 3, powerMode: 'turbo', failover: true, lockdown: false },
    blurb: 'Quarter-end review with SOC drills — enables failover rehearsal and turbo compute.',
  },
  {
    id: 'market-weekend',
    title: 'Market · Weekend Surge',
    scenario: 'market',
    aiLoad: 0.55,
    overrides: { concurrent: 16, labs: 2, guest: 'spike', threshold: 70 },
    instruments: { jitter: 9, sensors: 5, powerMode: 'balanced', failover: false, lockdown: false },
    blurb: 'Retail loyalty marathon: AR mirrors, drones, and checkout beacons all at once.',
  },
  {
    id: 'campus-maint-window',
    title: 'Campus · Maintenance Window',
    scenario: 'maintenance',
    aiLoad: 0.32,
    overrides: { concurrent: 9, labs: 2, guest: 'low', threshold: 65 },
    instruments: { jitter: 6, sensors: 2, powerMode: 'eco', failover: true, lockdown: true },
    blurb: 'Scripts a safe maintenance run with eco power mode and dual failover paths.',
  },
];
