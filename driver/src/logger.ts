const COLORS = ['\u001b[36m', '\u001b[35m', '\u001b[33m', '\u001b[32m', '\u001b[34m'];
const DIM = '\u001b[2m';
const RED = '\u001b[31m';
const RESET = '\u001b[0m';

export class DriverLogger {
  private readonly colorByName = new Map<string, string>();

  agent(name: string, message: string): void {
    console.log(`${this.colorFor(name)}${message}${RESET}`);
  }

  info(message: string): void {
    console.log(`${DIM}${message}${RESET}`);
  }

  warn(message: string): void {
    console.warn(`${RED}${message}${RESET}`);
  }

  private colorFor(name: string): string {
    const existing = this.colorByName.get(name);
    if (existing) return existing;
    const color = COLORS[this.colorByName.size % COLORS.length] ?? '';
    this.colorByName.set(name, color);
    return color;
  }
}
