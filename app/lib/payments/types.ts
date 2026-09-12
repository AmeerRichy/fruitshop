export type PaymentOrder = { id: string; orderNumber: string; amount: number; currency: "PKR"; customerName: string; phone: string };
export type PaymentRequest = { redirectUrl: string; gatewayReference?: string };
export type PaymentVerification = { valid: boolean; paid: boolean; transactionId?: string; orderNumber?: string; amount?: number; raw: Record<string, unknown> };
export interface PaymentGateway { readonly name: string; createPayment(order: PaymentOrder, customerIp: string): Promise<PaymentRequest>; verifyPayment(payload: Record<string, string>): Promise<PaymentVerification>; handleWebhook(payload: Record<string, string>): Promise<PaymentVerification>; getPaymentStatus(transactionId: string): Promise<PaymentVerification>; }
