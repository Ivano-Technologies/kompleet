declare module '@mono.co/connect.js' {
  interface MonoConnectOptions {
    key: string;
    scope?: 'auth' | 'payments';
    customer?: { id: string } | { name: string; email: string };
    reference?: string;
    onSuccess: (data: { code: string }) => void;
    onClose?: () => void;
    onLoad?: () => void;
    onEvent?: (eventName: string, data: Record<string, unknown>) => void;
  }

  class Connect {
    constructor(options: MonoConnectOptions);
    setup(config?: Record<string, unknown>): void;
    open(): void;
    close(): void;
    reauthorise(accountId: string): void;
  }

  export default Connect;
}
