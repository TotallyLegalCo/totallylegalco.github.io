export type TerminalHandler = (argument: string) => void;

export class CommandRegistry {
  private readonly handlers = new Map<string, TerminalHandler>();

  register(name: string, handler: TerminalHandler): this {
    this.handlers.set(name.toLocaleLowerCase('pt-BR'), handler);
    return this;
  }

  execute(name: string, argument: string): boolean {
    const handler = this.handlers.get(name.toLocaleLowerCase('pt-BR'));
    if (!handler) return false;
    handler(argument);
    return true;
  }

  names(): string[] {
    return [...this.handlers.keys()];
  }
}
