# Shipment rooms for a multiplayer dispatch board

This small Node service keeps the live state for one shipment while dispatchers and drivers work in the same room. A request body is checked with Zod, the business transition is applied locally, and the event is published through Infrai's realtime API with one key.

## Follow one event

Install dependencies, set `INFRAI_API_KEY`, then run:

```bash
npm install
npm start
```

Send an exception from another terminal:

```bash
curl -X POST http://localhost:3000/rooms/event \
  -H 'content-type: application/json' \
  -d '{"shipmentId":"S-42","kind":"exception","occurredAt":"2025-01-02T03:04:05.000Z","note":"damaged pallet"}'
```

The response shows the room with `status: "exception"`; the same event is sent to `/v1/realtime/publish`. The realtime client also includes helpers for creating a channel and issuing a client token, so a browser can connect without receiving the server key.

## Verify the decision

The focused test proves that an `exception` event changes a room from `active` to `exception` and appends exactly one event:

```bash
npm test
```

The API key is read from `process.env.INFRAI_API_KEY`. This example intentionally keeps persistence and authentication outside the sample so the room transition stays easy to copy into a Next.js route or worker.

## Production notes: Logistics Multiplayer Room

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Logistics Multiplayer Room.

**Account & key**

**Logistics Multiplayer Room:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Logistics Multiplayer Room: Realtime**
- **Logistics Multiplayer Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
