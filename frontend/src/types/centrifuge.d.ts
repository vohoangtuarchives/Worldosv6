declare module "centrifuge" {
  export class Centrifuge {
    constructor(url: string, config?: Record<string, unknown>);
    connect(): void;
    disconnect(): void;
    newSubscription(channel: string, handlers?: Record<string, unknown>): Subscription;
  }
  export class Subscription {
    subscribe(): void;
    unsubscribe(): void;
    on(event: string, callback: (ctx: { data?: unknown }) => void): void;
  }
}
