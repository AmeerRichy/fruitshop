"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { useState } from "react";

import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";
import { money } from "../lib/domain";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80";

const ALLOWED_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "res.cloudinary.com",
  "placehold.co",
  "pbs.twimg.com",
]);

function getSafeImageUrl(value?: string | null) {
  if (!value || typeof value !== "string") {
    return FALLBACK_IMAGE;
  }

  const image = value.trim();

  if (!image) {
    return FALLBACK_IMAGE;
  }

  // Allow local images from /public
  if (image.startsWith("/")) {
    return image;
  }

  try {
    const url = new URL(image);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return FALLBACK_IMAGE;
    }

    // Reject Google redirect/search URLs.
    if (
      url.hostname === "google.com" ||
      url.hostname === "www.google.com" ||
      url.hostname.endsWith(".google.com")
    ) {
      return FALLBACK_IMAGE;
    }

    // Only allow domains configured in next.config.js
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
      return FALLBACK_IMAGE;
    }

    return image;
  } catch {
    return FALLBACK_IMAGE;
  }
}

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  const min = Number(product.minQuantity || 1);
  const inc = Number(product.quantityIncrement || 1);

  const [q, setQ] = useState(min);
  const { addToCart } = useCart();

  const rawImage =
    product.images?.[0] ||
    product.image ||
    FALLBACK_IMAGE;

  const image = getSafeImageUrl(rawImage);

  const out = !product.available || product.stock <= 0;

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          (1 - product.price / product.compareAtPrice) * 100
        )
      : 0;

  return (
    <article className="card group overflow-hidden">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-[#edf4e9]"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />

        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[#f39b36] px-3 py-1 text-xs font-black">
            -{discount}%
          </span>
        )}

        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
            out
              ? "bg-stone-800 text-white"
              : "bg-white/90 text-[#176b3a]"
          }`}
        >
          {out ? "Out of stock" : "Fresh"}
        </span>
      </Link>

      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#176b3a]">
          {product.category}
        </p>

        <Link href={`/product/${product.slug}`}>
          <h3 className="mt-1 text-lg font-extrabold">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 min-h-10 text-sm text-[#68766d]">
          {product.shortDescription || product.description}
        </p>

        <div className="mt-3 flex items-end gap-2">
          <strong className="price text-xl text-[#176b3a]">
            {money(product.price)}
          </strong>

          <span className="mb-1 text-xs text-[#68766d]">
            / {product.unit || "KG"}
          </span>

          {product.compareAtPrice && (
            <del className="mb-1 ml-auto text-xs text-stone-400">
              {money(product.compareAtPrice)}
            </del>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <div className="flex min-h-11 items-center rounded-full border border-[#d7e1d5]">
            <button
              type="button"
              className="h-11 w-10"
              aria-label="Decrease quantity"
              onClick={() =>
                setQ(
                  Math.max(
                    min,
                    Number((q - inc).toFixed(2))
                  )
                )
              }
            >
              −
            </button>

            <span className="min-w-9 text-center text-sm font-extrabold">
              {q}
            </span>

            <button
              type="button"
              className="h-11 w-10"
              aria-label="Increase quantity"
              onClick={() =>
                setQ(
                  Math.min(
                    product.maxQuantity || 99,
                    Number((q + inc).toFixed(2))
                  )
                )
              }
            >
              +
            </button>
          </div>

          <button
            type="button"
            disabled={out}
            onClick={() =>
              addToCart({
                productId:
                  product.id ||
                  product._id ||
                  "",
                name: product.name,
                slug: product.slug,
                image,
                price: product.price,
                quantity: q,
                unit: product.unit || "KG",
                minQuantity: min,
                maxQuantity:
                  product.maxQuantity || 99,
                quantityIncrement: inc,
              })
            }
            className="btn btn-primary min-w-0 flex-1 px-3 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <ShoppingBasket size={18} />
            <span className="hidden xl:inline">
              Add to cart
            </span>
            <span className="xl:hidden">Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}