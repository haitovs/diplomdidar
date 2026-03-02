/**
 * CLI Parser
 * Mode tracking, prompt generation, token parsing for simplified IOS CLI.
 */

export const CLI_MODES = {
  USER: 'user',
  PRIVILEGED: 'privileged',
  GLOBAL_CONFIG: 'global-config',
  INTERFACE_CONFIG: 'interface-config',
};

export class CliParser {
  constructor(hostname = 'Router') {
    this.hostname = hostname;
    this.mode = CLI_MODES.USER;
    this.currentInterface = null;
  }

  /**
   * Get the current prompt string.
   */
  getPrompt() {
    switch (this.mode) {
      case CLI_MODES.USER:
        return `${this.hostname}>`;
      case CLI_MODES.PRIVILEGED:
        return `${this.hostname}#`;
      case CLI_MODES.GLOBAL_CONFIG:
        return `${this.hostname}(config)#`;
      case CLI_MODES.INTERFACE_CONFIG:
        return `${this.hostname}(config-if)#`;
      default:
        return `${this.hostname}>`;
    }
  }

  /**
   * Parse a command line into tokens.
   */
  parseTokens(line) {
    return line.trim().split(/\s+/).filter(t => t.length > 0);
  }

  /**
   * Set mode.
   */
  setMode(mode) {
    this.mode = mode;
  }

  /**
   * Set hostname.
   */
  setHostname(hostname) {
    this.hostname = hostname;
  }

  /**
   * Get available commands for current mode (for ? help).
   */
  getAvailableCommands() {
    switch (this.mode) {
      case CLI_MODES.USER:
        return [
          { cmd: 'enable', desc: 'Enter privileged EXEC mode' },
          { cmd: 'ping', desc: 'Send ICMP echo request' },
          { cmd: 'exit', desc: 'Exit CLI' },
        ];
      case CLI_MODES.PRIVILEGED:
        return [
          { cmd: 'configure terminal', desc: 'Enter configuration mode' },
          { cmd: 'show ip interface brief', desc: 'Show interface IP summary' },
          { cmd: 'show ip route', desc: 'Show routing table' },
          { cmd: 'show arp', desc: 'Show ARP table' },
          { cmd: 'show mac address-table', desc: 'Show MAC address table' },
          { cmd: 'show running-config', desc: 'Show current configuration' },
          { cmd: 'show interfaces', desc: 'Show interface details' },
          { cmd: 'ping', desc: 'Send ICMP echo request' },
          { cmd: 'disable', desc: 'Return to user mode' },
          { cmd: 'exit', desc: 'Exit CLI' },
        ];
      case CLI_MODES.GLOBAL_CONFIG:
        return [
          { cmd: 'hostname', desc: 'Set device hostname' },
          { cmd: 'interface', desc: 'Enter interface configuration' },
          { cmd: 'ip route', desc: 'Add a static route' },
          { cmd: 'no ip route', desc: 'Remove a static route' },
          { cmd: 'exit', desc: 'Return to privileged mode' },
          { cmd: 'end', desc: 'Return to privileged mode' },
        ];
      case CLI_MODES.INTERFACE_CONFIG:
        return [
          { cmd: 'ip address', desc: 'Set IP address and mask' },
          { cmd: 'no ip address', desc: 'Remove IP address' },
          { cmd: 'shutdown', desc: 'Disable interface' },
          { cmd: 'no shutdown', desc: 'Enable interface' },
          { cmd: 'exit', desc: 'Return to global config' },
          { cmd: 'end', desc: 'Return to privileged mode' },
        ];
      default:
        return [];
    }
  }

  /**
   * Tab completion: return matching commands.
   */
  complete(partial) {
    const commands = this.getAvailableCommands();
    const lower = partial.toLowerCase();
    return commands
      .filter(c => c.cmd.toLowerCase().startsWith(lower))
      .map(c => c.cmd);
  }
}
