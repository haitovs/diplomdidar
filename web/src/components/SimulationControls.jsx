export default function SimulationControls({
  mode, onModeChange,
  onStep, onReset,
  speed, onSpeedChange,
  onSendPing,
  onEditTopology,
  eventsQueued,
  activeTool, onToolChange,
}) {
  return (
    <div className="toolbar toolbar-comfort">
      <div className="toolbar-group">
        <div className="mode-toggle">
          <button
            className={mode === 'realtime' ? 'active' : ''}
            onClick={() => onModeChange('realtime')}
          >
            Realtime
          </button>
          <button
            className={mode === 'simulation' ? 'active' : ''}
            onClick={() => onModeChange('simulation')}
          >
            Simulation
          </button>
        </div>
      </div>

      <div className="toolbar-group">
        {mode === 'simulation' && (
          <button onClick={onStep} disabled={eventsQueued === 0}>
            Step Forward
          </button>
        )}
        <button onClick={onReset}>Reset</button>
      </div>

      {mode === 'realtime' && (
        <div className="toolbar-group">
          <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginRight: 4 }}>Speed:</label>
          {[0.5, 1, 2, 5].map(s => (
            <button
              key={s}
              className={speed === s ? 'active' : ''}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      )}

      <div className="toolbar-group">
        <button
          className={`tool-btn${activeTool === 'select' ? ' active' : ''}`}
          onClick={() => onToolChange('select')}
          title="Select tool"
        >
          Select
        </button>
        <button
          className={`tool-btn${activeTool === 'pdu' ? ' active' : ''}`}
          onClick={() => onToolChange('pdu')}
          title="Simple PDU: click source, then destination to ping"
        >
          Simple PDU
        </button>
        <button
          className={`tool-btn${activeTool === 'ip' ? ' active' : ''}`}
          onClick={() => onToolChange('ip')}
          title="Assign IP: click a device to configure its IP"
        >
          Assign IP
        </button>
      </div>

      <div className="toolbar-group">
        <button className="btn-primary" onClick={onSendPing}>Send Ping</button>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <button onClick={onEditTopology}>Edit Topology</button>
      </div>
    </div>
  );
}
