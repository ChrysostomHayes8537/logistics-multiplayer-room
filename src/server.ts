import { createServer } from "node:http";
import { shipmentEvent, applyEvent, type RoomState } from "./domain.js";
import { InfraiRealtime } from "./infrai_client.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before starting the service");
const realtime = new InfraiRealtime(key);
const rooms = new Map<string, RoomState>();

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/rooms/event") { res.writeHead(404).end(); return; }
  let raw = ""; for await (const chunk of req) raw += chunk;
  try {
    const input = shipmentEvent.parse(JSON.parse(raw));
    const room = rooms.get(input.shipmentId) ?? {shipmentId: input.shipmentId, events: [], status: "active"};
    const next = applyEvent(room, input); rooms.set(input.shipmentId, next);
    await realtime.publish(`shipment-${input.shipmentId}`, "shipment.event", input, input.shipmentId);
    res.writeHead(200, {"Content-Type": "application/json"}).end(JSON.stringify(next));
  } catch (error) { res.writeHead(400, {"Content-Type": "application/json"}).end(JSON.stringify({error: error instanceof Error ? error.message : "Invalid request"})); }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("room service listening"));
