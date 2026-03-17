import { useEffect, useRef, useState, useCallback } from 'react';
import { CliParser, CLI_MODES } from '@core/cli/CliParser.js';
import { CliHistory } from '@core/cli/CliHistory.js';
import { executeCommand } from '@core/cli/CliCommands.js';

function buildWelcomeBanner(hostname) {
  return [
    `+${'─'.repeat(46)}+`,
    `│  ${hostname.padEnd(44)}│`,
    `│  Cisco IOS CLI Simulator                    │`,
    `+${'─'.repeat(46)}+`,
    '',
    '  Quick Reference:',
    '  ─────────────────────────────────────────',
    '  enable                 Enter privileged mode',
    '  configure terminal     Enter config mode',
    '  show ip interface brief Show interface IPs',
    '  show ip route          Show routing table',
    '  show arp               Show ARP table',
    '  ping <ip>              Send ICMP ping',
    '  exit                   Exit current mode',
    '  ?                      Show available commands',
    '  ─────────────────────────────────────────',
    '',
  ];
}

export default function CliTerminal({ device, networkStack, simulationEngine, onClose }) {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const parserRef = useRef(null);
  const historyRef = useRef(new CliHistory());
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const autoStepRef = useRef(null);

  const autoStepEvents = useCallback(() => {
    if (!simulationEngine) return;
    if (autoStepRef.current) clearInterval(autoStepRef.current);
    let stepsRemaining = 60;
    const interval = setInterval(() => {
      const state = simulationEngine.getState();
      if (state.eventsQueued === 0 || stepsRemaining <= 0) {
        clearInterval(interval);
        autoStepRef.current = null;
        return;
      }
      simulationEngine.stepForward();
      stepsRemaining--;
    }, 150);
    autoStepRef.current = interval;
  }, [simulationEngine]);

  useEffect(() => {
    return () => {
      if (autoStepRef.current) clearInterval(autoStepRef.current);
    };
  }, []);

  useEffect(() => {
    if (!device) return;
    const hostname = device.hostname || device.label || 'Device';
    const parser = new CliParser(hostname);
    parserRef.current = parser;

    setLines(buildWelcomeBanner(hostname));
    setInput('');
  }, [device?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [lines]);

  if (!device) return null;

  const parser = parserRef.current;
  if (!parser) return null;

  const prompt = parser.getPrompt();

  const handleSubmit = (e) => {
    e.preventDefault();
    const line = input;
    historyRef.current.push(line);

    const promptLine = `${prompt} ${line}`;
    const result = executeCommand(line, parser, device, networkStack, simulationEngine);

    setLines(prev => [...prev, promptLine, ...result.output]);
    setInput('');

    // Auto-step simulation events after ping so packets actually move
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith('ping ') && simulationEngine) {
      autoStepEvents();
    }

    if (result.exit && onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setInput(historyRef.current.up());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setInput(historyRef.current.down());
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completions = parser.complete(input);
      if (completions.length === 1) {
        setInput(completions[0] + ' ');
      } else if (completions.length > 1) {
        setLines(prev => [...prev, `${prompt} ${input}`, ...completions.map(c => `  ${c}`)]);
      }
    }
  };

  return (
    <div className="cli-terminal">
      <div className="cli-header">
        <span>CLI: {device.hostname}</span>
        {onClose && <button className="cli-close" onClick={onClose}>&times;</button>}
      </div>
      <div className="cli-output" ref={scrollRef}>
        {lines.map((line, i) => (
          <div key={i} className="cli-line">{line}</div>
        ))}
      </div>
      <form className="cli-input-row" onSubmit={handleSubmit}>
        <span className="cli-prompt">{prompt}</span>
        <input
          ref={inputRef}
          className="cli-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
