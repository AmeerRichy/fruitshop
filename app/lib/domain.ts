export const DB_NAME = process.env.MONGODB_DB || "elegance_essentials";
export const ORDER_STATUSES = ["awaiting_payment", "payment_submitted", "confirmed", "packing", "out_for_delivery", "delivered", "cancelled", "refunded"] as const;
export const PAYMENT_STATUSES = ["unpaid", "verification_pending", "paid", "rejected", "refunded"] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export const money = (value: number) => `Rs. ${Math.round(value).toLocaleString("en-PK")}`;
export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "").replace(/^0092/, "+92").replace(/^0/, "+92");
export const isPakistanPhone = (phone: string) => /^\+923\d{9}$/.test(normalizePhone(phone));
export const cleanText = (value: unknown, max = 300) => String(value ?? "").trim().replace(/[<>]/g, "").slice(0, max);
export const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const isValidId = (id: string) => /^[a-f\d]{24}$/i.test(id);
export function quantityIsValid(quantity: number, min: number, max: number, increment: number) { if (!Number.isFinite(quantity) || quantity < min || quantity > max || increment <= 0) return false; const steps = (quantity - min) / increment; return Math.abs(steps - Math.round(steps)) < 0.000001; }
export function publicOrder(order: Record<string, any>) { const { _id, internalNotes, paymentGatewayResponse, ...safe } = order; void internalNotes; void paymentGatewayResponse; return { ...safe, id: _id?.toString?.() || safe.id }; }
