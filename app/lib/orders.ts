import { ObjectId } from "mongodb";
import { cleanText, isPakistanPhone, normalizePhone, quantityIsValid, roundMoney } from "./domain";
import { getDb, nextSequence } from "./db";

export type CheckoutInput = { items: { productId: string; quantity: number }[]; promoCode?: string; customer: { name: string; phone: string; email?: string }; address: { house: string; street: string; areaId: string; city: string; landmark?: string; notes?: string }; deliveryDate: string; deliverySlotId: string; paymentMethod: "cod" | "bank_raast"; idempotencyKey: string };

export class CheckoutError extends Error { constructor(message: string, public status = 400) { super(message); } }

export async function calculateCheckout(input: CheckoutInput) {
  if (!input.items?.length || input.items.length > 50) throw new CheckoutError("Your cart is empty or too large.");
  if (cleanText(input.customer?.name, 80).length < 2) throw new CheckoutError("Enter a valid full name.");
  if (!isPakistanPhone(input.customer?.phone || "")) throw new CheckoutError("Enter a valid Pakistan mobile number.");
  if (cleanText(input.address?.house, 100).length < 2 || cleanText(input.address?.street, 160).length < 3) throw new CheckoutError("Enter a complete delivery address.");
  const date = new Date(`${input.deliveryDate}T12:00:00`); const today = new Date(); today.setHours(0,0,0,0);
  if (!Number.isFinite(date.getTime()) || date < today) throw new CheckoutError("Choose a valid delivery date.");
  const db = await getDb();
  const ids = input.items.map(i => new ObjectId(i.productId));
  const [products, area, slot, settings] = await Promise.all([
    db.collection("products").find({ _id: { $in: ids }, archived: { $ne: true } }).toArray(),
    ObjectId.isValid(input.address.areaId) ? db.collection("delivery_areas").findOne({ _id: new ObjectId(input.address.areaId), active: true }) : null,
    ObjectId.isValid(input.deliverySlotId) ? db.collection("delivery_slots").findOne({ _id: new ObjectId(input.deliverySlotId), active: true }) : null,
    db.collection<any>("settings").findOne({ _id: "payment" }),
  ]);
  if (!area) throw new CheckoutError("This delivery area is unavailable.");
  if (!slot || (slot.days?.length && !slot.days.includes(date.getDay()))) throw new CheckoutError("This delivery slot is unavailable for the selected date.");
  if (slot.maxOrders) { const used = await db.collection("orders").countDocuments({ deliveryDate: input.deliveryDate, deliverySlotId: slot._id.toString(), orderStatus: { $nin: ["cancelled"] } }); if (used >= slot.maxOrders) throw new CheckoutError("This delivery slot is full. Choose another slot."); }
  if (input.paymentMethod === "cod" && settings?.codEnabled === false) throw new CheckoutError("Cash on delivery is currently unavailable.");
  if (input.paymentMethod === "bank_raast" && settings?.bankRaastEnabled === false) throw new CheckoutError("Bank / Raast payment is currently unavailable.");
  if (!settings && input.paymentMethod === "bank_raast") throw new CheckoutError("Bank / Raast payment has not been configured yet.", 503);
  if (input.paymentMethod === "cod" && settings?.codMaxAmount && settings.codMaxAmount > 0) { /* checked after total */ }
  const byId = new Map(products.map(p => [p._id.toString(), p]));
  const orderItems = input.items.map(line => { const p = byId.get(line.productId); if (!p || !p.available || p.stock <= 0) throw new CheckoutError("A product in your cart is no longer available."); const min = Number(p.minQuantity ?? 1), max = Math.min(Number(p.maxQuantity ?? 99), Number(p.stock)), inc = Number(p.quantityIncrement ?? 1); if (!quantityIsValid(Number(line.quantity), min, max, inc)) throw new CheckoutError(`${p.name}: choose a valid quantity.`); const unitPrice = Number(p.price); return { productId: p._id.toString(), productName: p.name, productSlug: p.slug, productImage: p.images?.[0] || p.image || "", quantity: Number(line.quantity), unit: p.unit || "KG", unitPrice, totalPrice: roundMoney(unitPrice * Number(line.quantity)) }; });
  const subtotal = roundMoney(orderItems.reduce((s, i) => s + i.totalPrice, 0));
  if (area.minimumOrder && subtotal < area.minimumOrder) throw new CheckoutError(`Minimum order for ${area.name} is Rs. ${area.minimumOrder.toLocaleString("en-PK")}.`);
  let discount = 0; let promo: any = null;
  if (input.promoCode) { const now = new Date(); promo = await db.collection("promos").findOne({ code: input.promoCode.trim().toUpperCase(), active: true, $and: [{ $or: [{ startDate: null }, { startDate: { $lte: now } }] }, { $or: [{ endDate: null }, { endDate: { $gte: now } }] }] }); if (!promo || (promo.usageLimit && promo.used >= promo.usageLimit) || subtotal < (promo.minimumOrder || 0)) throw new CheckoutError("This promo code is invalid or not applicable."); discount = promo.type === "fixed" ? promo.amount : subtotal * promo.amount / 100; if (promo.maximumDiscount) discount = Math.min(discount, promo.maximumDiscount); discount = roundMoney(Math.min(discount, subtotal)); }
  const deliveryFee = subtotal >= (area.freeDeliveryThreshold || Infinity) ? 0 : Number(area.deliveryFee || 0);
  const total = roundMoney(subtotal - discount + deliveryFee);
  if (input.paymentMethod === "cod" && settings?.codMaxAmount && total > settings.codMaxAmount) throw new CheckoutError(`Cash on delivery is available up to Rs. ${settings.codMaxAmount.toLocaleString("en-PK")}.`);
  return { db, area, slot, promo, orderItems, subtotal, discount, deliveryFee, total };
}

async function reduceInventory(db: any, items: any[]) { const reduced: any[] = []; for (const item of items) { const result = await db.collection("products").updateOne({ _id: new ObjectId(item.productId), available: true, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } }); if (!result.modifiedCount) { for (const prior of reduced) await db.collection("products").updateOne({ _id: new ObjectId(prior.productId) }, { $inc: { stock: prior.quantity } }); throw new CheckoutError(`${item.productName} just went out of stock.`, 409); } reduced.push(item); } }

export async function createOrder(input: CheckoutInput): Promise<any> {
  const calculated = await calculateCheckout(input); const { db, area, slot, promo, orderItems, subtotal, discount, deliveryFee, total } = calculated;
  const existing = await db.collection("orders").findOne({ idempotencyKey: input.idempotencyKey }); if (existing) return existing;
  // Reserve inventory for both methods at order placement. The inventoryReduced
  // flag makes later admin verification idempotent and prevents overselling.
  await reduceInventory(db, orderItems);
  const [orderSeq, invoiceSeq] = await Promise.all([nextSequence("order"), nextSequence("invoice")]); const now = new Date();
  const isCod=input.paymentMethod === "cod";
  const order = { orderNumber: `FR-${orderSeq}`, invoiceNumber: `INV-${invoiceSeq}`, customerName: cleanText(input.customer.name, 80), phone: normalizePhone(input.customer.phone), email: cleanText(input.customer.email, 120) || null, address: { house: cleanText(input.address.house,100), street: cleanText(input.address.street,160), area: area.name, city: cleanText(input.address.city,60), landmark: cleanText(input.address.landmark,100) }, areaId: area._id.toString(), deliveryDate: input.deliveryDate, deliverySlot: slot.name, deliverySlotId: slot._id.toString(), deliveryNotes: cleanText(input.address.notes,300), items: orderItems, subtotal, discount, promoCode: promo?.code || null, deliveryFee, total, currency: "PKR", paymentMethod: input.paymentMethod, paymentStatus: isCod ? "unpaid" : "verification_pending", orderStatus: isCod ? "confirmed" : "awaiting_payment", transactionReference: null, paymentProofUrl: null, paymentSubmittedAt: null, paymentDate: null, rejectionReason: null, inventoryReduced: true, idempotencyKey: input.idempotencyKey, timeline: [{ status: "placed", label: "Order placed", at: now }, ...(isCod ? [{ status: "cod", label: "Cash on delivery selected", at: now },{ status: "confirmed", label: "Order confirmed", at: now }] : [{status:"awaiting_payment",label:"Waiting for Bank / Raast payment",at:now}])], createdAt: now, updatedAt: now };
  try { const result = await db.collection("orders").insertOne(order); if (promo) await db.collection("promos").updateOne({ _id: promo._id }, { $inc: { used: 1 } }); return { ...order, _id: result.insertedId }; } catch (error: any) { if (error?.code === 11000) return db.collection("orders").findOne({ idempotencyKey: input.idempotencyKey }); for (const item of orderItems) await db.collection("products").updateOne({ _id: new ObjectId(item.productId) }, { $inc: { stock: item.quantity } }); throw error; }
}
