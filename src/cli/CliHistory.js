/**
 * CLI Command History
 * Up/down arrow command history navigation.
 */
export class CliHistory {
  constructor(maxSize = 50) {
    this.commands = [];
    this.maxSize = maxSize;
    this.cursor = -1;
  }

  push(command) {
    if (!command.trim()) return;
    // Don't add duplicates of last command
    if (this.commands.length > 0 && this.commands[this.commands.length - 1] === command) {
      this.cursor = -1;
      return;
    }
    this.commands.push(command);
    if (this.commands.length > this.maxSize) {
      this.commands.shift();
    }
    this.cursor = -1;
  }

  up() {
    if (this.commands.length === 0) return '';
    if (this.cursor === -1) {
      this.cursor = this.commands.length - 1;
    } else if (this.cursor > 0) {
      this.cursor--;
    }
    return this.commands[this.cursor] || '';
  }

  down() {
    if (this.cursor === -1) return '';
    if (this.cursor < this.commands.length - 1) {
      this.cursor++;
      return this.commands[this.cursor] || '';
    }
    this.cursor = -1;
    return '';
  }

  reset() {
    this.cursor = -1;
  }
}
