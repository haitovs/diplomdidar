import { useState } from 'react';

const TYPE_COLORS = {
  router: '#6366f1',
  coreRouter: '#8b5cf6',
  switch: '#22c55e',
  firewall: '#ef4444',
  server: '#3b82f6',
  accessPoint: '#14b8a6',
  iot: '#f59e0b',
  pc: '#64748b',
  cloud: '#0ea5e9',
  internet: '#06b6d4',
  lab: '#f97316',
};

export default function DeviceListOverlay({ nodes, selectedDeviceId, onSelectDevice, networkStack }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!nodes || nodes.length === 0) return null;

  return (
    <div className={`device-list-overlay${collapsed ? ' collapsed' : ''}`}>
      <div className="device-list-header" onClick={() => setCollapsed(c => !c)}>
        <span>Devices ({nodes.length})</span>
        <span className="device-list-toggle">{collapsed ? '+' : '\u2212'}</span>
      </div>
      {!collapsed && (
        <div className="device-list-body">
          {nodes.map(node => {
            const live = networkStack?.getNode(node.id);
            const ip = live?.interfaces?.find(i => i.ipAddress)?.ipAddress;
            const color = TYPE_COLORS[node.type] || '#64748b';
            const isActive = selectedDeviceId === node.id;
            return (
              <div
                key={node.id}
                className={`device-list-item${isActive ? ' active' : ''}`}
                onClick={() => onSelectDevice(node)}
              >
                <span className="device-list-dot" style={{ background: color }} />
                <span className="device-list-name">{live?.hostname || node.hostname || node.label}</span>
                <span className="device-list-ip">{ip || ''}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
