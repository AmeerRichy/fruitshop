export type ProductUnit = "KG" | "500g" | "250g" | "Piece" | "Dozen" | "Box" | "Pack" | "Basket";
export interface Product {
  id?: string; _id?: string; name: string; slug: string; sku: string; description: string;
  shortDescription: string; category: string; images: string[]; image?: string; price: number;
  compareAtPrice?: number; discountPrice?: number; unit: ProductUnit; minQuantity: number;
  maxQuantity: number; quantityIncrement: number; stock: number; lowStockThreshold: number;
  available: boolean; featured: boolean; freshPick: boolean; popular: boolean; seasonal: boolean;
  origin: string; grade: string; keywords: string[]; archived?: boolean; createdAt?: string; updatedAt?: string;
}
export type CartLine = Pick<Product, "name" | "slug" | "price" | "unit" | "minQuantity" | "maxQuantity" | "quantityIncrement"> & { productId: string; image: string; quantity: number };
