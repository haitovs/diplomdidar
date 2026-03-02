export default function EventList({ events = [], currentStep }) {
  const typeColors = {
    'ARP REQ': '#fbbf24',
    'ARP REP': '#fbbf24',
    'ICMP REQ': '#3b82f6',
    'ICMP REP': '#22c55e',
    'TTL EXP': '#ef4444',
    'UNREACH': '#ef4444',
    'DROP': '#ef4444',
    'DELIVER': '#22c55e',
    'error': '#ef4444',
  };

  const recent = events.slice(-100);

  return (
    <div className="event-list">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Source</th>
            <th>Dest</th>
            <th>Type</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((evt, i) => {
            const isCurrent = evt.step === currentStep;
            const color = typeColors[evt.type] || '#94a3b8';
            return (
              <tr
                key={i}
                className={isCurrent ? 'event-row current' : 'event-row'}
                style={{ borderLeftColor: color }}
              >
                <td>{evt.step}</td>
                <td>{evt.source || '-'}</td>
                <td>{evt.destination || '-'}</td>
                <td style={{ color }}>{evt.type}</td>
                <td className="event-info">{evt.info}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {recent.length === 0 && (
        <div className="event-list-empty">No events yet. Send a ping to start.</div>
      )}
    </div>
  );
}
