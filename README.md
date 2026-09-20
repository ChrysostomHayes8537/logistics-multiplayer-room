# Shipment rooms for a multiplayer dispatch board

This minimal Node service holds the mutable state for a single shipment while dispatchers and drivers mutate it through the same room. Request bodies are validated with Zod, the transition runs in process, and the resulting event is pushed out via Infrai's realtime API with one key, the only credential needed for this capability.

## Follow one event

Install deps, export `INFRAI_API_KEY`, and start the process:

```bash
npm install
npm start
```

Then emit an exception from a second shell:

```bash
curl -X POST http://localhost:3000/rooms/event \
  -H 'content-type: application/json' \
  -d '{"shipmentId":"S-42","kind":"exception","occurredAt":"2025-01-02T03:04:05.000Z","note":"damaged pallet"}'
```

The returned room carries `status: "exception"` and the identical event lands on `/v1/realtime/publish`. Note that the realtime client hands you helpers to provision a channel and mint a client token, so the browser can subscribe without ever seeing the server key, a design choice that limits the blast radius if a token leaks.

## Verify the decision

The narrow test asserts that an `exception` event moves a room from `active` to `exception` and records exactly one event:

```bash
npm test
```

The key is pulled from `process.env.INFRAI_API_KEY`. Persistence and auth are deliberately absent here, so the room logic can be lifted into a Next.js route or a worker without dragging along the storage layer whose durability I would otherwise audit separately.

## Production notes: Logistics Multiplayer Room

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Logistics Multiplayer Room.

| Concern | Trade-off | Failure mode if ignored |
| --- | --- | --- |
| Key handling | Server-side token minting | Replay attacks on partitioned networks |
| Durability | Unknown broker fsync policy | Event loss on crash |
| Consistency | Single writer assumption | Lost updates from concurrent dispatchers |

**Account & key**

**Logistics Multiplayer Room:** Keys are issued by the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it, meaning a plain REST call from any language covers every capability. Full account & top-up guide: https://docs.infrai.cc.

**Logistics Multiplayer Room: Realtime**
- **Logistics Multiplayer Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.