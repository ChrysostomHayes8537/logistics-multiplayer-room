import assert from "node:assert/strict";
import { applyEvent, type RoomState } from "./domain.js";

const initial: RoomState = {shipmentId: "S-42", events: [], status: "active"};
const next = applyEvent(initial, {shipmentId: "S-42", kind: "exception", occurredAt: "2025-01-02T03:04:05.000Z", note: "damaged pallet"});
assert.equal(next.status, "exception");
assert.equal(next.events.length, 1);
console.log("exception event moves a room into exception status");
