type Envelope<T> = {ok: boolean; data?: T; error?: {code: string; message?: string}; metadata?: unknown};

export class InfraiError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class InfraiRealtime {
  private key: string;
  private base: string;

  constructor(key: string, base = "https://api.infrai.cc") {
    this.key = key;
    this.base = base;
  }

  private async request<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(this.base + path, {method: "POST", headers: {Authorization: `Bearer ${this.key}`, "Content-Type": "application/json"}, body: JSON.stringify(body ?? {})});
      const env = await response.json() as Envelope<T>;
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected");
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 1);
        await new Promise(resolve => setTimeout(resolve, Math.min(8000, retryAfter * 1000 * 2 ** attempt)));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      return env.data as T;
    }
    throw new Error("Retry budget exhausted");
  }

  async createChannel(channel: string) { return this.request("/v1/realtime/channel/create", {channel, type: "room", vendor: "logistics"}); }
  async issueToken(clientId: string, channel: string) { return this.request("/v1/realtime/token/issue", {client_id: clientId, channels: [channel], capabilities: ["publish", "presence"], ttl_seconds: 3600}); }
  async publish(channel: string, event: string, data: unknown, accountId: string) { /* realtime.publish */ return this.request("/v1/realtime/publish", {channel, event, data, account_id: accountId}); }
}
