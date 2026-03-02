/**
 * CLI Commands
 * ~25 IOS command implementations.
 */

import { CLI_MODES } from './CliParser.js';
import { isRouterType, isSwitchType } from '../network/InterfaceManager.js';

/**
 * Execute a CLI command.
 * Returns { output: string[], modeChange?: string, interfaceChange?: string }
 */
export function executeCommand(line, parser, device, networkStack, simulationEngine) {
  const tokens = parser.parseTokens(line);
  if (tokens.length === 0) return { output: [] };

  // Handle '?' help
  if (line.trim() === '?') {
    return handleHelp(parser);
  }

  const cmd = tokens[0].toLowerCase();

  switch (parser.mode) {
    case CLI_MODES.USER:
      return executeUserMode(cmd, tokens, parser, device, networkStack, simulationEngine);
    case CLI_MODES.PRIVILEGED:
      return executePrivilegedMode(cmd, tokens, parser, device, networkStack, simulationEngine);
    case CLI_MODES.GLOBAL_CONFIG:
      return executeGlobalConfig(cmd, tokens, parser, device, networkStack, simulationEngine);
    case CLI_MODES.INTERFACE_CONFIG:
      return executeInterfaceConfig(cmd, tokens, parser, device, networkStack, simulationEngine);
    default:
      return { output: ['% Unknown mode'] };
  }
}

function handleHelp(parser) {
  const commands = parser.getAvailableCommands();
  const output = commands.map(c => `  ${c.cmd.padEnd(28)} ${c.desc}`);
  return { output };
}

// ---- User Mode ----
function executeUserMode(cmd, tokens, parser, device, networkStack, engine) {
  switch (cmd) {
    case 'enable':
      parser.setMode(CLI_MODES.PRIVILEGED);
      return { output: [], modeChange: CLI_MODES.PRIVILEGED };

    case 'ping':
      return handlePing(tokens, device, engine);

    case 'exit':
      return { output: ['% CLI session closed'], exit: true };

    default:
      return { output: [`% Unknown command: "${tokens.join(' ')}". Type ? for help.`] };
  }
}

// ---- Privileged Mode ----
function executePrivilegedMode(cmd, tokens, parser, device, networkStack, engine) {
  const fullCmd = tokens.join(' ').toLowerCase();

  if (cmd === 'configure' && tokens[1]?.toLowerCase() === 'terminal') {
    parser.setMode(CLI_MODES.GLOBAL_CONFIG);
    return { output: ['Enter configuration commands, one per line. End with "end".'], modeChange: CLI_MODES.GLOBAL_CONFIG };
  }

  if (cmd === 'show') {
    return handleShow(tokens.slice(1), device, networkStack);
  }

  if (cmd === 'ping') {
    return handlePing(tokens, device, engine);
  }

  if (cmd === 'disable') {
    parser.setMode(CLI_MODES.USER);
    return { output: [], modeChange: CLI_MODES.USER };
  }

  if (cmd === 'exit') {
    return { output: ['% CLI session closed'], exit: true };
  }

  return { output: [`% Unknown command: "${tokens.join(' ')}". Type ? for help.`] };
}

// ---- Global Config Mode ----
function executeGlobalConfig(cmd, tokens, parser, device, networkStack, engine) {
  if (cmd === 'hostname' && tokens.length >= 2) {
    const newHostname = tokens[1];
    networkStack.setHostname(device.id, newHostname);
    parser.setHostname(newHostname);
    return { output: [] };
  }

  if (cmd === 'interface' && tokens.length >= 2) {
    const ifaceName = resolveInterfaceName(tokens.slice(1).join(' '), device);
    if (!ifaceName) {
      return { output: [`% Invalid interface: ${tokens.slice(1).join(' ')}`] };
    }
    parser.setMode(CLI_MODES.INTERFACE_CONFIG);
    parser.currentInterface = ifaceName;
    return { output: [], modeChange: CLI_MODES.INTERFACE_CONFIG, interfaceChange: ifaceName };
  }

  if (cmd === 'ip' && tokens[1]?.toLowerCase() === 'route') {
    // ip route <network> <mask> <next-hop>
    if (tokens.length < 5) {
      return { output: ['% Usage: ip route <network> <mask> <next-hop>'] };
    }
    if (!isRouterType(device.type)) {
      return { output: ['% Static routes only available on routers'] };
    }
    const network = tokens[2];
    const mask = tokens[3];
    const nextHop = tokens[4];
    networkStack.addStaticRoute(device.id, network, mask, nextHop);
    return { output: [] };
  }

  if (cmd === 'no' && tokens[1]?.toLowerCase() === 'ip' && tokens[2]?.toLowerCase() === 'route') {
    if (tokens.length < 6) {
      return { output: ['% Usage: no ip route <network> <mask> <next-hop>'] };
    }
    networkStack.removeStaticRoute(device.id, tokens[3], tokens[4], tokens[5]);
    return { output: [] };
  }

  if (cmd === 'exit') {
    parser.setMode(CLI_MODES.PRIVILEGED);
    return { output: [], modeChange: CLI_MODES.PRIVILEGED };
  }

  if (cmd === 'end') {
    parser.setMode(CLI_MODES.PRIVILEGED);
    return { output: [], modeChange: CLI_MODES.PRIVILEGED };
  }

  return { output: [`% Unknown command: "${tokens.join(' ')}"`] };
}

// ---- Interface Config Mode ----
function executeInterfaceConfig(cmd, tokens, parser, device, networkStack, engine) {
  const ifaceName = parser.currentInterface;
  const iface = device.interfaces.find(i => i.name === ifaceName);

  if (!iface) {
    return { output: [`% Interface ${ifaceName} not found`] };
  }

  if (cmd === 'ip' && tokens[1]?.toLowerCase() === 'address') {
    if (tokens.length < 4) {
      return { output: ['% Usage: ip address <ip> <mask>'] };
    }
    const ip = tokens[2];
    const mask = tokens[3];
    networkStack.setInterfaceIp(device.id, ifaceName, ip, mask);
    return { output: [] };
  }

  if (cmd === 'no' && tokens[1]?.toLowerCase() === 'ip' && tokens[2]?.toLowerCase() === 'address') {
    networkStack.setInterfaceIp(device.id, ifaceName, '', '');
    return { output: [] };
  }

  if (cmd === 'shutdown') {
    networkStack.setInterfaceStatus(device.id, ifaceName, 'down');
    return { output: [`%LINK-5-CHANGED: Interface ${ifaceName}, changed state to administratively down`] };
  }

  if (cmd === 'no' && tokens[1]?.toLowerCase() === 'shutdown') {
    networkStack.setInterfaceStatus(device.id, ifaceName, 'up');
    return { output: [`%LINK-3-UPDOWN: Interface ${ifaceName}, changed state to up`] };
  }

  if (cmd === 'exit') {
    parser.setMode(CLI_MODES.GLOBAL_CONFIG);
    parser.currentInterface = null;
    return { output: [], modeChange: CLI_MODES.GLOBAL_CONFIG };
  }

  if (cmd === 'end') {
    parser.setMode(CLI_MODES.PRIVILEGED);
    parser.currentInterface = null;
    return { output: [], modeChange: CLI_MODES.PRIVILEGED };
  }

  return { output: [`% Unknown command: "${tokens.join(' ')}"`] };
}

// ---- Show commands ----
function handleShow(tokens, device, networkStack) {
  const subcmd = tokens.map(t => t.toLowerCase()).join(' ');

  if (subcmd.startsWith('ip interface brief')) {
    return showIpInterfaceBrief(device);
  }
  if (subcmd.startsWith('ip route')) {
    return showIpRoute(device, networkStack);
  }
  if (subcmd === 'arp') {
    return showArp(device, networkStack);
  }
  if (subcmd.startsWith('mac address-table') || subcmd.startsWith('mac-address-table')) {
    return showMacTable(device, networkStack);
  }
  if (subcmd.startsWith('running-config') || subcmd === 'run') {
    return showRunningConfig(device, networkStack);
  }
  if (subcmd === 'interfaces') {
    return showInterfaces(device);
  }

  return { output: [`% Unknown show command: "${tokens.join(' ')}"`] };
}

function showIpInterfaceBrief(device) {
  const header = 'Interface'.padEnd(25) + 'IP-Address'.padEnd(18) + 'Status'.padEnd(12) + 'Protocol';
  const sep = '-'.repeat(65);
  const lines = [header, sep];

  for (const iface of device.interfaces) {
    const ip = iface.ipAddress || 'unassigned';
    const status = iface.status === 'down' ? 'admin down' : 'up';
    const protocol = iface.connectedLinkId && iface.status !== 'down' ? 'up' : 'down';
    lines.push(
      iface.name.padEnd(25) + ip.padEnd(18) + status.padEnd(12) + protocol
    );
  }

  return { output: lines };
}

function showIpRoute(device, networkStack) {
  if (!isRouterType(device.type)) {
    return { output: ['% Routing table not available on this device type'] };
  }

  const rt = networkStack.getRoutingTable(device.id);
  if (!rt) return { output: ['% No routing table'] };

  const routes = rt.getEntries();
  if (routes.length === 0) {
    return { output: ['% No routes in routing table'] };
  }

  const lines = [`Routing table for ${device.hostname}:`, ''];
  for (const route of routes) {
    const typeCode = route.type === 'connected' ? 'C' : 'S';
    const network = `${route.network}/${route.maskBits}`;
    const via = route.nextHop ? `via ${route.nextHop}` : `directly connected`;
    const iface = route.iface ? `, ${route.iface}` : '';
    lines.push(`${typeCode}    ${network.padEnd(22)} ${via}${iface}`);
  }

  return { output: lines };
}

function showArp(device, networkStack) {
  const arpTable = networkStack.getArpTable(device.id);
  const entries = arpTable.getEntries();

  if (entries.length === 0) {
    return { output: ['% ARP table is empty'] };
  }

  const header = 'Protocol'.padEnd(10) + 'Address'.padEnd(18) + 'Hardware Addr'.padEnd(20) + 'Interface';
  const lines = [header];
  for (const entry of entries) {
    lines.push(
      'Internet'.padEnd(10) + entry.ip.padEnd(18) + entry.mac.padEnd(20) + (entry.iface || '')
    );
  }

  return { output: lines };
}

function showMacTable(device, networkStack) {
  if (!isSwitchType(device.type)) {
    return { output: ['% MAC address table only available on switches'] };
  }

  const macTable = networkStack.getMacTable(device.id);
  const entries = macTable.getEntries();

  if (entries.length === 0) {
    return { output: ['% MAC address table is empty'] };
  }

  const header = 'Mac Address'.padEnd(20) + 'Type'.padEnd(10) + 'Ports';
  const sep = '-'.repeat(45);
  const lines = [header, sep];
  for (const entry of entries) {
    lines.push(
      entry.mac.padEnd(20) + 'DYNAMIC'.padEnd(10) + entry.port
    );
  }

  return { output: lines };
}

function showRunningConfig(device, networkStack) {
  const lines = [
    '!',
    `hostname ${device.hostname}`,
    '!',
  ];

  for (const iface of device.interfaces) {
    lines.push(`interface ${iface.name}`);
    if (iface.ipAddress && iface.subnetMask) {
      lines.push(` ip address ${iface.ipAddress} ${iface.subnetMask}`);
    }
    if (iface.status === 'down') {
      lines.push(' shutdown');
    } else {
      lines.push(' no shutdown');
    }
    lines.push('!');
  }

  if (isRouterType(device.type)) {
    const rt = networkStack.getRoutingTable(device.id);
    if (rt) {
      const routes = rt.getEntries().filter(r => r.type === 'static');
      for (const route of routes) {
        lines.push(`ip route ${route.network} ${route.mask} ${route.nextHop}`);
      }
    }
  }

  if (device.defaultGateway) {
    lines.push(`ip default-gateway ${device.defaultGateway}`);
  }

  lines.push('!', 'end');
  return { output: lines };
}

function showInterfaces(device) {
  const lines = [];
  for (const iface of device.interfaces) {
    const status = iface.status === 'down' ? 'administratively down' : 'up';
    lines.push(`${iface.name} is ${status}`);
    lines.push(`  Hardware is ${iface.type}, address is ${iface.mac}`);
    if (iface.ipAddress) {
      lines.push(`  Internet address is ${iface.ipAddress}/${maskToCidr(iface.subnetMask)}`);
    }
    lines.push(`  Speed ${iface.speed} Mbps`);
    lines.push('');
  }
  return { output: lines };
}

// ---- Ping ----
function handlePing(tokens, device, engine) {
  if (tokens.length < 2) {
    return { output: ['% Usage: ping <ip-address>'] };
  }
  const destIp = tokens[1];
  const output = [`Pinging ${destIp} from ${device.hostname}...`, ''];

  if (engine) {
    engine.ping(device.id, destIp, 4);
    output.push('Ping initiated. Watch event list for results.');
  } else {
    output.push('% Simulation engine not available');
  }

  return { output };
}

// ---- Helpers ----
function resolveInterfaceName(input, device) {
  const lower = input.toLowerCase().replace(/\s+/g, '');

  for (const iface of device.interfaces) {
    if (iface.name.toLowerCase().replace(/\s+/g, '') === lower) return iface.name;
    if (iface.shortName.toLowerCase().replace(/\s+/g, '') === lower) return iface.name;
  }

  // Try partial match
  const abbrevMap = {
    'gi': 'GigabitEthernet',
    'gig': 'GigabitEthernet',
    'fa': 'FastEthernet',
    'wlan': 'Wireless',
  };

  for (const [abbr, full] of Object.entries(abbrevMap)) {
    if (lower.startsWith(abbr)) {
      const suffix = lower.slice(abbr.length);
      const fullName = full + suffix;
      const match = device.interfaces.find(i =>
        i.name.toLowerCase().replace(/\s+/g, '') === fullName.toLowerCase()
      );
      if (match) return match.name;
    }
  }

  return null;
}

function maskToCidr(mask) {
  if (!mask) return '0';
  const parts = mask.split('.').map(Number);
  let bits = 0;
  for (const p of parts) {
    let n = p;
    while (n) { bits += n & 1; n >>= 1; }
  }
  return String(bits);
}
