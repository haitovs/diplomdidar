import { useState, useEffect } from 'react';

export default function DeviceConfigDialog({ device, networkStack, onClose, onApply }) {
  const [formState, setFormState] = useState({});

  useEffect(() => {
    if (!device) return;
    const iface = device.interfaces?.[0];
    setFormState({
      ipAddress: iface?.ipAddress || '',
      subnetMask: iface?.subnetMask || '',
      defaultGateway: device.defaultGateway || '',
    });
  }, [device?.id]);

  if (!device) return null;

  const iface = device.interfaces?.[0];
  if (!iface) return null;

  const handleApply = () => {
    if (networkStack) {
      networkStack.setInterfaceIp(device.id, iface.name, formState.ipAddress, formState.subnetMask);
      networkStack.setDefaultGateway(device.id, formState.defaultGateway);
    }
    onApply?.();
  };

  return (
    <div className="device-config">
      <div className="device-config-header">
        <h3>Configure {device.hostname}</h3>
        {onClose && <button className="cli-close" onClick={onClose}>&times;</button>}
      </div>
      <div className="device-config-body">
        <div className="config-field">
          <label>Interface</label>
          <input type="text" value={iface.name} readOnly />
        </div>
        <div className="config-field">
          <label>MAC Address</label>
          <input type="text" value={iface.mac} readOnly />
        </div>
        <div className="config-field">
          <label>IP Address</label>
          <input
            type="text"
            value={formState.ipAddress}
            onChange={e => setFormState(s => ({ ...s, ipAddress: e.target.value }))}
            placeholder="192.168.1.10"
          />
        </div>
        <div className="config-field">
          <label>Subnet Mask</label>
          <input
            type="text"
            value={formState.subnetMask}
            onChange={e => setFormState(s => ({ ...s, subnetMask: e.target.value }))}
            placeholder="255.255.255.0"
          />
        </div>
        <div className="config-field">
          <label>Default Gateway</label>
          <input
            type="text"
            value={formState.defaultGateway}
            onChange={e => setFormState(s => ({ ...s, defaultGateway: e.target.value }))}
            placeholder="192.168.1.1"
          />
        </div>
      </div>
      <div className="device-config-footer">
        <button className="btn-primary" onClick={handleApply}>Apply</button>
        {onClose && <button className="btn-secondary" onClick={onClose}>Cancel</button>}
      </div>
    </div>
  );
}
