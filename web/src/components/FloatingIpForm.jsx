import { useState, useEffect, useRef } from 'react';

export default function FloatingIpForm({ device, networkStack, x, y, onApply, onClose }) {
  const firstIface = device?.interfaces?.find(i => i.name) ||
    networkStack?.getNode(device.id)?.interfaces?.find(i => i.name);

  const [ip, setIp] = useState(firstIface?.ipAddress || '');
  const [mask, setMask] = useState(firstIface?.subnetMask || '255.255.255.0');
  const [gateway, setGateway] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const dev = networkStack?.getNode(device.id);
    if (dev?.defaultGateway) {
      setGateway(dev.defaultGateway);
    }
    const iface = dev?.interfaces?.find(i => i.name);
    if (iface?.ipAddress) setIp(iface.ipAddress);
    if (iface?.subnetMask) setMask(iface.subnetMask);
  }, [device.id]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ip) return;
    onApply(device.id, ip, mask, gateway);
  };

  // Position near the clicked device
  const style = {
    left: x,
    top: Math.max(y, 10),
  };

  return (
    <div className="floating-ip-form" style={style} onClick={e => e.stopPropagation()}>
      <div className="floating-ip-header">
        <span>Configure: {device.hostname || device.label}</span>
        <button className="floating-ip-close" onClick={onClose}>&times;</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="config-field">
          <label>IP Address</label>
          <input
            ref={inputRef}
            value={ip}
            onChange={e => setIp(e.target.value)}
            placeholder="192.168.1.10"
            spellCheck={false}
          />
        </div>
        <div className="config-field">
          <label>Subnet Mask</label>
          <input
            value={mask}
            onChange={e => setMask(e.target.value)}
            placeholder="255.255.255.0"
            spellCheck={false}
          />
        </div>
        <div className="config-field">
          <label>Default Gateway</label>
          <input
            value={gateway}
            onChange={e => setGateway(e.target.value)}
            placeholder="192.168.1.1"
            spellCheck={false}
          />
        </div>
        <div className="config-actions">
          <button type="submit" className="btn-apply">Apply</button>
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
