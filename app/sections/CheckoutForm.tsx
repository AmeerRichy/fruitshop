"use client";

import React, { useMemo, useRef, useState } from "react";
import { useCart } from "@/app/context/CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CheckoutForm() {
  const router = useRouter();
  const { cart, total, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<"checkout" | "whatsapp" | "success">(
    "checkout"
  );

  const [popupBlocked, setPopupBlocked] = useState(false);
  const [finalWhatsappUrl, setFinalWhatsappUrl] = useState("");
  const [finalOrderMessage, setFinalOrderMessage] = useState("");

  const waOpenLockRef = useRef(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const RAW_WHATSAPP_NUMBER = "03114051542";

  const getWhatsappPhone = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "");

    if (digits.startsWith("0")) return `92${digits.slice(1)}`;
    if (digits.startsWith("92")) return digits;

    return digits;
  };

  const WHATSAPP_NUMBER = getWhatsappPhone(RAW_WHATSAPP_NUMBER);
  const DISPLAY_WHATSAPP_NUMBER = RAW_WHATSAPP_NUMBER;

  const whatsappMessage = useMemo(() => {
    const itemsText = cart
      .map((item, index) => {
        const unit = Number(item.price).toFixed(2);
        const line = Number(item.price * item.quantity).toFixed(2);

        return `${index + 1}. ${item.name}
Qty: ${item.quantity}
Price: Rs. ${unit}
Line Total: Rs. ${line}`;
      })
      .join("\n\n");

    return `New Order Request - Elegance Essentials

Customer Details
Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email}
Address: ${form.address}

Order Items
${itemsText}

Order Total: Rs. ${Number(total).toFixed(2)}

Please confirm availability and delivery time.`;
  }, [cart, form, total]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const normalizePhoneDigits = (phone: string) =>
    (phone || "").replace(/\D/g, "");

  const isValidPhone = (phone: string) => {
    const digits = normalizePhoneDigits(phone);

    if (!digits) return false;
    if (digits.startsWith("03") && digits.length === 11) return true;
    if (digits.startsWith("92") && digits.length === 12) return true;

    return digits.length >= 10 && digits.length <= 13;
  };

  const validateCheckout = () => {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!form.email.trim()) return "Please enter your email.";
    if (!isValidEmail(form.email)) return "Please enter a valid email address.";
    if (!form.phone.trim()) return "Please enter your phone number.";

    if (!isValidPhone(form.phone)) {
      return "Please enter a valid phone number. Example: 03XXXXXXXXX or +92XXXXXXXXXX.";
    }

    if (!form.address.trim()) return "Please enter your delivery address.";
    if (cart.length === 0) return "Your cart is empty.";

    return null;
  };

  const getWhatsAppUrl = () => {
    const encoded = encodeURIComponent(whatsappMessage);

    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    return isMobile
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
      : `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;
  };

  const openWhatsAppAndFinish = () => {
    if (waOpenLockRef.current) return;

    waOpenLockRef.current = true;
    setPopupBlocked(false);

    const url = getWhatsAppUrl();

    setFinalWhatsappUrl(url);
    setFinalOrderMessage(whatsappMessage);

    const opened = window.open(url, "_blank", "noopener,noreferrer");

    if (!opened) {
      setPopupBlocked(true);
    }

    clearCart();
    setStep("success");

    setTimeout(() => {
      waOpenLockRef.current = false;
    }, 1500);
  };

  const copyMessage = async (message?: string) => {
    try {
      await navigator.clipboard.writeText(message || whatsappMessage);
      alert("Order message copied.");
    } catch (err) {
      console.error(err);
      alert("Copy failed. Please select and copy manually.");
    }
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(DISPLAY_WHATSAPP_NUMBER);
      alert("WhatsApp number copied.");
    } catch (err) {
      console.error(err);
      alert("Copy failed. Please select and copy manually.");
    }
  };

  const goToWhatsAppStep = async () => {
    const err = validateCheckout();

    if (err) {
      alert(err);
      return;
    }

    setLoading(true);

    try {
      setStep("whatsapp");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const StepBadge = ({
    number,
    label,
    active,
    done,
  }: {
    number: string;
    label: string;
    active?: boolean;
    done?: boolean;
  }) => {
    return (
      <div className="flex items-center gap-2">
        <div
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition",
            active || done
              ? "bg-[#DB005B] text-white shadow-[0_8px_22px_rgba(219,0,91,0.24)]"
              : "bg-white text-gray-400 border border-pink-100",
          ].join(" ")}
        >
          {done ? "✓" : number}
        </div>

        <span
          className={[
            "hidden sm:block text-xs font-bold tracking-wide",
            active || done ? "text-black" : "text-gray-400",
          ].join(" ")}
        >
          {label}
        </span>
      </div>
    );
  };

  if (step === "success") {
    return (
      <section className="checkoutLuxury min-h-[70vh] bg-[#FCF8F8] px-4 py-12 sm:px-6 sm:py-16">
        <style jsx global>{`
          .checkoutLuxury {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
              "SF Pro Text", "Inter", "Segoe UI", sans-serif;
          }
        `}</style>

        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-pink-100 bg-white p-6 text-center shadow-[0_24px_70px_rgba(219,0,91,0.08)] sm:p-10">
            <div className="absolute -top-28 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#DB005B]/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FDE8EF] text-4xl font-black text-[#DB005B] shadow-[0_18px_35px_rgba(219,0,91,0.12)]">
                ✓
              </div>

              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.25em] text-[#DB005B]">
                Order request received
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl">
                Thank you for your order
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
                Your order details are ready for WhatsApp confirmation. Our team
                will confirm availability and delivery details shortly.
              </p>

              {popupBlocked && (
                <div className="mt-7 rounded-2xl border border-pink-100 bg-[#FDF4F5] p-4 text-left">
                  <p className="text-sm font-bold text-black">
                    WhatsApp did not open automatically.
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Tap the button below to send your order request manually.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={finalWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-full border border-[#DB005B] bg-[#DB005B] px-6 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#DB005B] sm:w-auto"
                    >
                      Send on WhatsApp
                    </a>

                    <button
                      onClick={() => copyMessage(finalOrderMessage)}
                      className="w-full rounded-full border border-pink-200 bg-white px-6 py-3 text-sm font-bold text-[#DB005B] transition hover:bg-[#FDF4F5] sm:w-auto"
                    >
                      Copy Order Message
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => router.push("/category?cat=all")}
                  className="w-full rounded-full border border-[#DB005B] bg-[#DB005B] px-10 py-4 text-base font-bold text-white transition hover:bg-white hover:text-[#DB005B] active:scale-[0.98] sm:w-auto"
                >
                  Continue Shopping
                </button>

                <button
                  onClick={() => router.push("/")}
                  className="w-full rounded-full border border-pink-200 bg-white px-10 py-4 text-base font-bold text-gray-700 transition hover:bg-[#FDF4F5] active:scale-[0.98] sm:w-auto"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (step === "whatsapp") {
    return (
      <section className="checkoutLuxury bg-[#FCF8F8] px-4 py-10 sm:px-6 sm:py-16">
        <style jsx global>{`
          .checkoutLuxury {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
              "SF Pro Text", "Inter", "Segoe UI", sans-serif;
          }
        `}</style>

        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-center gap-3 rounded-full border border-pink-100 bg-white px-4 py-3 shadow-sm sm:mx-auto sm:w-fit sm:px-6">
            <StepBadge number="1" label="Details" done />
            <div className="h-px w-8 bg-pink-100 sm:w-12" />
            <StepBadge number="2" label="Review" active />
            <div className="h-px w-8 bg-pink-100 sm:w-12" />
            <StepBadge number="3" label="Confirm" />
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-pink-100 bg-white shadow-[0_24px_70px_rgba(219,0,91,0.08)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#18020B] via-[#3A061B] to-[#DB005B] px-5 py-8 text-white sm:px-8 sm:py-10">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-[#DB005B]/30 blur-3xl" />

              <div className="relative text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-pink-100">
                  Final review
                </p>

                <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                  Review your order message
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-pink-50 sm:text-base">
                  Please check your details before sending. We’ll open WhatsApp
                  with your order message ready.
                </p>

                <div className="mx-auto mt-6 w-fit rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-md">
                  <p className="text-xs font-semibold text-pink-100">
                    Order Total
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    Rs. {Number(total).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <div className="mx-auto max-w-4xl rounded-3xl border border-pink-100 bg-[#FDF4F5] p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-black text-black">
                      Message Preview
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      This is the exact message that will be sent on WhatsApp.
                    </p>
                  </div>

                  <button
                    onClick={() => copyMessage()}
                    className="w-full rounded-full border border-pink-200 bg-white px-5 py-3 text-sm font-bold text-[#DB005B] transition hover:bg-[#FDF4F5] active:scale-[0.98] sm:w-auto"
                  >
                    Copy Message
                  </button>
                </div>

                <pre className="mt-5 max-h-[430px] overflow-auto whitespace-pre-wrap rounded-2xl border border-pink-100 bg-white p-4 font-sans text-sm leading-relaxed text-black sm:p-5">
                  {whatsappMessage}
                </pre>
              </div>

              <div className="mx-auto mt-6 flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <button
                  onClick={openWhatsAppAndFinish}
                  className="w-full rounded-full border border-[#DB005B] bg-[#DB005B] px-8 py-4 text-base font-black text-white shadow-[0_16px_32px_rgba(219,0,91,0.18)] transition hover:bg-white hover:text-[#DB005B] active:scale-[0.98] sm:w-auto"
                >
                  Send Order on WhatsApp
                </button>

                <button
                  onClick={() => {
                    setStep("checkout");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full rounded-full border border-pink-200 bg-white px-8 py-4 text-base font-bold text-gray-700 transition hover:bg-[#FDF4F5] active:scale-[0.98] sm:w-auto"
                >
                  Edit Details
                </button>
              </div>

              <p className="mx-auto mt-4 max-w-xl text-center text-xs leading-relaxed text-gray-500">
                Just tap send inside WhatsApp to confirm your order with our
                team.
              </p>
            </div>

            <div className="border-t border-pink-100 px-5 py-5 text-center text-xs text-gray-500 sm:px-8">
              © {new Date().getFullYear()} Elegance Essentials. Secure checkout
              experience.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkoutLuxury bg-[#FCF8F8] px-4 py-10 sm:px-6 sm:py-16">
      <style jsx global>{`
        .checkoutLuxury {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "SF Pro Text", "Inter", "Segoe UI", sans-serif;
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {cart.length === 0 ? (
          <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-pink-100 bg-white p-6 text-center shadow-[0_24px_70px_rgba(219,0,91,0.08)] sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FDE8EF] text-3xl">
              🛒
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-black">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-gray-600">
              Add your favorite essentials first, then come back to complete
              your order.
            </p>

            <button
              onClick={() => router.push("/category?cat=all")}
              className="mt-7 rounded-full border border-[#DB005B] bg-[#DB005B] px-10 py-4 text-base font-bold text-white transition hover:bg-white hover:text-[#DB005B] active:scale-[0.98]"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-center gap-3 rounded-full border border-pink-100 bg-white px-4 py-3 shadow-sm sm:mx-auto sm:w-fit sm:px-6">
              <StepBadge number="1" label="Details" active />
              <div className="h-px w-8 bg-pink-100 sm:w-12" />
              <StepBadge number="2" label="Review" />
              <div className="h-px w-8 bg-pink-100 sm:w-12" />
              <StepBadge number="3" label="Confirm" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="lg:order-2 lg:col-span-5">
                <div className="overflow-hidden rounded-[2rem] border border-pink-100 bg-white shadow-[0_24px_70px_rgba(219,0,91,0.08)] lg:sticky lg:top-28">
                  <div className="bg-gradient-to-br from-[#18020B] via-[#3A061B] to-[#DB005B] p-6 text-white sm:p-8">
                    <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-pink-100">
                      Your bag
                    </p>

                    <div className="mt-3 flex items-end justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">
                          Order Summary
                        </h2>

                        <p className="mt-1 text-sm text-pink-50">
                          {cart.length} item{cart.length > 1 ? "s" : ""} ready
                          to checkout
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-pink-100">Total</p>
                        <p className="text-2xl font-black">
                          Rs. {Number(total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="max-h-[380px] space-y-4 overflow-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center gap-4 rounded-2xl border border-pink-100 bg-[#FCF8F8] p-3"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-pink-100 bg-white">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-black leading-tight text-black">
                              {item.name}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-gray-500">
                              Qty {item.quantity} × Rs.{" "}
                              {Number(item.price).toFixed(2)}
                            </p>
                          </div>

                          <div className="text-right text-sm font-black text-black">
                            Rs.{" "}
                            {Number(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-pink-100 pt-5">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-bold text-black">
                          Rs. {Number(total).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-3 flex justify-between text-sm text-gray-600">
                        <span>Delivery</span>
                        <span className="font-black text-[#DB005B]">Free</span>
                      </div>

                      <div className="mt-5 flex justify-between text-xl font-black text-black">
                        <span>Total</span>
                        <span className="text-[#DB005B]">
                          Rs. {Number(total).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 text-xs font-bold text-gray-600">
                      <div className="rounded-2xl border border-pink-100 bg-[#FDF4F5] p-3 text-center">
                        Authentic
                      </div>

                      <div className="rounded-2xl border border-pink-100 bg-[#FDF4F5] p-3 text-center">
                        Fast
                      </div>

                      <div className="rounded-2xl border border-pink-100 bg-[#FDF4F5] p-3 text-center">
                        Easy Help
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:order-1 lg:col-span-7">
                <div className="overflow-hidden rounded-[2rem] border border-pink-100 bg-white shadow-[0_24px_70px_rgba(219,0,91,0.08)]">
                  <div className="border-b border-pink-100 p-5 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#DB005B]">
                          Checkout
                        </p>

                        <h2 className="mt-2 text-3xl font-black tracking-tight text-black sm:text-4xl">
                          Delivery Details
                        </h2>

                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
                          Add your contact and delivery information. We’ll
                          prepare your order message for WhatsApp confirmation.
                        </p>
                      </div>

                      <button
                        onClick={() => router.push("/category?cat=all")}
                        className="hidden rounded-full border border-pink-200 bg-[#FDF4F5] px-5 py-3 text-sm font-bold text-[#DB005B] transition hover:bg-white sm:inline-flex"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>

                  <div className="p-5 sm:p-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-black">
                          Full Name
                        </span>

                        <input
                          type="text"
                          name="name"
                          placeholder="Enter your name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          className="w-full rounded-2xl border border-pink-100 bg-[#FDF4F5] px-4 py-4 text-black outline-none transition placeholder:text-gray-400 focus:border-[#DB005B]/40 focus:bg-white focus:ring-4 focus:ring-[#DB005B]/10"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-black">
                          Phone Number
                        </span>

                        <input
                          type="tel"
                          name="phone"
                          placeholder="03XXXXXXXXX"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          inputMode="tel"
                          className="w-full rounded-2xl border border-pink-100 bg-[#FDF4F5] px-4 py-4 text-black outline-none transition placeholder:text-gray-400 focus:border-[#DB005B]/40 focus:bg-white focus:ring-4 focus:ring-[#DB005B]/10"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-bold text-black">
                        Email Address
                      </span>

                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-2xl border border-pink-100 bg-[#FDF4F5] px-4 py-4 text-black outline-none transition placeholder:text-gray-400 focus:border-[#DB005B]/40 focus:bg-white focus:ring-4 focus:ring-[#DB005B]/10"
                      />
                    </label>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-bold text-black">
                        Delivery Address
                      </span>

                      <textarea
                        name="address"
                        placeholder="House no, street, area, city"
                        value={form.address}
                        onChange={handleChange}
                        required
                        className="min-h-[130px] w-full resize-none rounded-2xl border border-pink-100 bg-[#FDF4F5] px-4 py-4 text-black outline-none transition placeholder:text-gray-400 focus:border-[#DB005B]/40 focus:bg-white focus:ring-4 focus:ring-[#DB005B]/10"
                      />
                    </label>

                    <div className="mt-6 rounded-3xl border border-pink-100 bg-[#FCF8F8] p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-black">
                            Almost done
                          </p>

                          <p className="mt-1 text-sm leading-relaxed text-gray-600">
                            Next screen lets you review everything before
                            sending your order request.
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3 text-left sm:text-right">
                          <p className="text-xs font-bold text-gray-500">
                            Payable Total
                          </p>

                          <p className="text-xl font-black text-[#DB005B]">
                            Rs. {Number(total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={goToWhatsAppStep}
                      disabled={loading}
                      className="mt-6 w-full rounded-full border border-[#DB005B] bg-[#DB005B] py-4 text-lg font-black text-white shadow-[0_16px_32px_rgba(219,0,91,0.18)] transition hover:bg-white hover:text-[#DB005B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Please wait..." : "Review Order"}
                    </button>

                    <button
                      onClick={() => router.push("/category?cat=all")}
                      className="mt-3 w-full rounded-full border border-pink-200 bg-white py-4 text-base font-bold text-[#DB005B] transition hover:bg-[#FDF4F5] sm:hidden"
                    >
                      Continue Shopping
                    </button>

                    <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
                      Your details are only used to confirm and deliver your
                      order.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-12 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Elegance Essentials. Secure checkout
          experience.
        </div>
      </div>
    </section>
  );
}
