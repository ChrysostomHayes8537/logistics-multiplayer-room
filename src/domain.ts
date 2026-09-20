import { z } from "zod";

export const shipmentEvent = z.object({
  shipmentId: z.string().min(1),
  kind: z.enum(["picked_up", "in_transit", "delivered", "exception"]),
  occurredAt: z.string().datetime(),
  note: z.string().min(1).optional()
});
export const proofFile = z.object({name: z.string().min(1), contentType: z.string().min(1)});
export type ShipmentEvent = z.infer<typeof shipmentEvent>;
export type RoomState = {shipmentId: string; events: ShipmentEvent[]; proof?: z.infer<typeof proofFile>; status: "active" | "exception" | "delivered"};

export function applyEvent(state: RoomState, event: ShipmentEvent): RoomState {
  const status = event.kind === "exception" ? "exception" : event.kind === "delivered" ? "delivered" : state.status;
  return {...state, events: [...state.events, event], status};
}
