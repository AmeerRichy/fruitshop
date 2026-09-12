import Image from "next/image";
import Link from "next/link";
import Footer from "./components/footer";
import ProductCard from "./components/productcard";
import { getDb } from "./lib/db";
import { fallbackAreas, fallbackCategories, fallbackProducts } from "./lib/fallback-data";
import type { Product } from "./types/product";

const fallbackImage = "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=85";
const safeImage = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : fallbackImage;

export default async function HomeResilient() {
  let products: Product[] = fallbackProducts, categories: any[] = fallbackCategories, areas: any[] = fallbackAreas, demo = true;
  try {
    const db = await getDb();
    const [productDocs, categoryDocs, areaDocs] = await Promise.all([
      db.collection("products").find({ archived: { $ne: true }, available: true }).sort({ featured: -1 }).limit(8).toArray(),
      db.collection("categories").find({ active: { $ne: false } }).sort({ displayOrder: 1 }).limit(8).toArray(),
      db.collection("delivery_areas").find({ active: true }).toArray(),
    ]);
    products = productDocs.map(({ _id, ...product }: any) => ({ ...product, id: _id.toString(), images: (product.images || []).filter((image: unknown) => typeof image === "string" && image.trim()) })) as Product[];
    categories = categoryDocs.map(({ _id, ...category }: any) => ({ ...category, id: _id.toString(), image: safeImage(category.image) }));
    areas = areaDocs;
    demo = false;
  } catch {}
  return <><main>{demo && <div className="bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-900">Browsing demo produce — ordering will open when the database is connected.</div>}<section className="container-site pt-5"><div className="relative min-h-[570px] overflow-hidden rounded-[32px]"><Image src={fallbackImage} alt="Fresh seasonal fruits" fill priority className="object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-[#092f1e]/90 via-[#092f1e]/55 to-transparent"/><div className="relative z-10 flex min-h-[570px] max-w-2xl flex-col justify-center p-7 text-white sm:p-14"><span className="w-fit rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Picked fresh • Delivered with care</span><h1 className="display mt-5 text-5xl font-bold leading-tight sm:text-7xl">Fresh fruits,<br/>right to your door.</h1><p className="mt-5 text-lg text-white/80">Premium local fruit, quality checked and delivered across Lahore.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="btn bg-[#f39b36] text-[#173021]">Shop fresh fruits</Link><Link href="/track-order" className="btn border border-white/40 text-white">Track order</Link></div></div></div></section><section className="section"><div className="container-site"><span className="badge">Shop your way</span><h2 className="display mt-3 text-4xl font-bold">Fruit for every table</h2><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{categories.map(category => <Link href={`/shop?category=${category.value}`} key={String(category.id || category._id)} className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#eaf5df]"><Image src={safeImage(category.image)} alt={category.name || "Fruit category"} fill className="object-cover transition group-hover:scale-105" sizes="(max-width:768px) 50vw,25vw"/><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/><b className="absolute bottom-4 left-4 text-white">{category.name}</b></Link>)}</div></div></section><section className="section bg-[#f0f5ea]"><div className="container-site"><div className="text-center"><span className="badge">Customer favourites</span><h2 className="display mt-3 text-4xl font-bold">Featured fresh picks</h2></div><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0, 8).map(product => <ProductCard key={product.id || product.slug} product={product}/>)}</div></div></section><section className="section"><div className="container-site grid overflow-hidden rounded-[32px] bg-[#176b3a] text-white lg:grid-cols-2"><div className="p-9 sm:p-14"><span className="badge bg-white">Seasonal offer</span><h2 className="display mt-5 text-5xl font-bold">Summer mango deal</h2><p className="mt-4 text-white/75">Use FRESH10 and save on qualifying baskets.</p><Link href="/shop?search=mango" className="btn mt-7 bg-[#f39b36] text-[#173021]">Shop mangoes</Link></div><div className="relative min-h-72"><Image src="https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=85" alt="Fresh mangoes" fill className="object-cover"/></div></div></section><section className="section bg-[#eaf5df]"><div className="container-site text-center"><h2 className="display text-4xl font-bold">Delivery across Lahore</h2><div className="mt-7 flex flex-wrap justify-center gap-3">{areas.map(area => <span className="rounded-full bg-white px-5 py-3 text-sm font-bold" key={String(area._id || area.id)}>{area.name}</span>)}</div></div></section></main><Footer/></>;
}
