import { useState } from 'react';

export default function PingDialog({ nodes = [], onPing, onClose }) {
  const [sourceId, setSourceId] = useState(nodes[0]?.id || '');
  const [destIp, setDestIp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sourceId && destIp) {
      onPing(sourceId, destIp);
      onClose?.();
    }
  };

  return (
    <div className="ping-dialog">
      <div className="device-config-header">
        <h3>Send Ping</h3>
        {onClose && <button className="cli-close" onClick={onClose}>&times;</button>}
      </div>
      <form className="device-config-body" onSubmit={handleSubmit}>
        <div className="config-field">
          <label>Source Device</label>
          <select value={sourceId} onChange={e => setSourceId(e.target.value)}>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.hostname || n.label}</option>
            ))}
          </select>
        </div>
        <div className="config-field">
          <label>Destination IP</label>
          <input
            type="text"
            value={destIp}
            onChange={e => setDestIp(e.target.value)}
            placeholder="192.168.1.1"
            autoFocus
          />
        </div>
        <div className="device-config-footer">
          <button className="btn-primary" type="submit">Ping</button>
          {onClose && <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}
