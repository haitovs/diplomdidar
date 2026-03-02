import { useState } from 'react';

export default function InterfaceList({ device, networkStack, onUpdate }) {
  const [editingIdx, setEditingIdx] = useState(-1);
  const [editValues, setEditValues] = useState({});

  if (!device || !device.interfaces) return null;

  const startEdit = (idx) => {
    const iface = device.interfaces[idx];
    setEditingIdx(idx);
    setEditValues({
      ipAddress: iface.ipAddress || '',
      subnetMask: iface.subnetMask || '',
    });
  };

  const saveEdit = (idx) => {
    const iface = device.interfaces[idx];
    if (networkStack) {
      networkStack.setInterfaceIp(device.id, iface.name, editValues.ipAddress, editValues.subnetMask);
    }
    setEditingIdx(-1);
    onUpdate?.();
  };

  const toggleStatus = (idx) => {
    const iface = device.interfaces[idx];
    const newStatus = iface.status === 'down' ? 'up' : 'down';
    if (networkStack) {
      networkStack.setInterfaceStatus(device.id, iface.name, newStatus);
    }
    onUpdate?.();
  };

  return (
    <div className="interface-list">
      <table>
        <thead>
          <tr>
            <th>Interface</th>
            <th>IP Address</th>
            <th>Mask</th>
            <th>MAC</th>
            <th>Status</th>
            <th>Link</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {device.interfaces.map((iface, idx) => (
            <tr key={iface.name} className={iface.status === 'down' ? 'iface-down' : ''}>
              <td className="iface-name">{iface.shortName}</td>
              <td>
                {editingIdx === idx ? (
                  <input
                    type="text"
                    value={editValues.ipAddress}
                    onChange={e => setEditValues(s => ({ ...s, ipAddress: e.target.value }))}
                    placeholder="10.0.0.1"
                    className="iface-input"
                  />
                ) : (
                  <span className={iface.ipAddress ? '' : 'unassigned'}>{iface.ipAddress || 'unassigned'}</span>
                )}
              </td>
              <td>
                {editingIdx === idx ? (
                  <input
                    type="text"
                    value={editValues.subnetMask}
                    onChange={e => setEditValues(s => ({ ...s, subnetMask: e.target.value }))}
                    placeholder="255.255.255.0"
                    className="iface-input"
                  />
                ) : (
                  <span className={iface.subnetMask ? '' : 'unassigned'}>{iface.subnetMask || '-'}</span>
                )}
              </td>
              <td className="iface-mac">{iface.mac}</td>
              <td>
                <button
                  className={`iface-status-btn ${iface.status}`}
                  onClick={() => toggleStatus(idx)}
                  title={iface.status === 'down' ? 'Enable interface' : 'Disable interface'}
                >
                  {iface.status}
                </button>
              </td>
              <td>{iface.connectedLinkId ? 'connected' : '-'}</td>
              <td>
                {editingIdx === idx ? (
                  <button className="iface-btn" onClick={() => saveEdit(idx)}>Save</button>
                ) : (
                  <button className="iface-btn" onClick={() => startEdit(idx)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
