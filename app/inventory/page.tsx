
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string | null;
  price: number | string | null;
  status: string | null;
};

type Variant = {
  product_id: string;
  stock_quantity: number | null;
  price_override: number | string | null;
};

type ProductImage = {
  product_id: string;
  image_url: string;
  sort_order: number | null;
};

type DisplayProduct = {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: string;
  image_url: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error("Please sign in to view your products.");
        }

        const { data: membership, error: membershipError } =
          await supabase
            .from("store_members")
            .select("store_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (membershipError) throw membershipError;

        if (!membership) {
          throw new Error(
            "Your account does not have a store membership."
          );
        }

        const { data: productData, error: productError } =
          await supabase
            .from("products")
            .select("id, name, category, price, status")
            .eq("store_id", membership.store_id)
            .order("created_at", { ascending: false });

        if (productError) throw productError;

        const rows = (productData ?? []) as Product[];

        if (rows.length === 0) {
          if (!cancelled) setProducts([]);
          return;
        }

        const productIds = rows.map((product) => product.id);

        const [
          { data: variantData, error: variantError },
          { data: imageData, error: imageError },
        ] = await Promise.all([
          supabase
            .from("product_variants")
            .select("product_id, stock_quantity, price_override")
            .in("product_id", productIds),

          supabase
            .from("product_images")
            .select("product_id, image_url, sort_order")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true }),
        ]);

        if (variantError) throw variantError;
        if (imageError) throw imageError;

        const variants = (variantData ?? []) as Variant[];
        const images = (imageData ?? []) as ProductImage[];

        const displayProducts: DisplayProduct[] = rows.map((product) => {
          const productVariants = variants.filter(
            (variant) => variant.product_id === product.id
          );

          const stock = productVariants.reduce(
            (total, variant) =>
              total + Number(variant.stock_quantity ?? 0),
            0
          );

          const variantPrice = productVariants.find(
            (variant) => variant.price_override !== null
          )?.price_override;

          const price = variantPrice ?? product.price;
          const numericPrice = Number(price ?? 0);

          let status = "Active";

          if (product.status?.toLowerCase() !== "active") {
            status = "Inactive";
          } else if (stock === 0) {
            status = "Out of stock";
          }

          const productImage = images.find(
            (image) => image.product_id === product.id
          );

          return {
            id: product.id,
            name: product.name,
            category: product.category || "Uncategorized",
            price: numericPrice.toLocaleString(),
            stock,
            status,
            image_url: productImage?.image_url ?? null,
          };
        });

        if (!cancelled) setProducts(displayProducts);
      } catch (err: unknown) {
        console.error("Load products error:", err);

        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred.";

        if (!cancelled) setError(errorMessage);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    "All categories",
    ...Array.from(
      new Set(products.map((product) => product.category))
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "All categories" ||
      product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const activeCount = products.filter(
    (product) => product.status === "Active"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              Products
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage your products, prices, and inventory.
            </p>
          </div>

          <Link
            href="/products/new"
            className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            <span className="mr-2 text-lg">+</span>
            Add Product
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111111]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total products
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {loading ? "—" : products.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111111]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Active products
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">
              {loading ? "—" : activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111111]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing products
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {loading ? "—" : filteredProducts.length}
            </p>
          </div>
        </div>

        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-[#111111] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#111111] dark:text-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111111]"
              >
                <div className="aspect-[4/3] animate-pulse bg-slate-100 dark:bg-white/5" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                  <div className="h-8 w-full animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/5">
            <p className="font-semibold text-red-700 dark:text-red-400">
              Could not load products
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-[#111111]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-white/5">
              📦
            </div>
            <h2 className="mt-5 text-lg font-semibold">
              {products.length === 0
                ? "Your catalog is waiting"
                : "No matching products"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {products.length === 0
                ? "Add your first product to start building your store catalog."
                : "Try another product name or choose a different category."}
            </p>
            {products.length === 0 && (
              <Link
                href="/products/new"
                className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
              >
                + Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#111111] dark:hover:border-white/20"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-[#1b1b1b]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <span className="text-4xl">📦</span>
                      <span className="mt-2 text-xs font-medium">
                        No product photo
                      </span>
                    </div>
                  )}

                  <span
                    className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${
                      product.status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400"
                        : product.status === "Out of stock"
                          ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400"
                          : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {product.category}
                  </p>

                  <h2 className="mt-2 min-h-12 text-base font-semibold leading-6 text-slate-900 dark:text-white">
                    {product.name}
                  </h2>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/10">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Price
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {product.price}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Available stock
                      </p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          product.stock === 0
                            ? "text-red-600 dark:text-red-400"
                            : product.stock < 5
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {product.stock} units
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/products/edit?id=${product.id}`}
                    className="mt-5 flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-black dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    Edit product →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#111111]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 dark:bg-white/10 dark:text-white">
              AI
            </div>

            <div>
              <h2 className="font-semibold">
                Your AI will use these products
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Every product you add here becomes part of your store
                catalog. The AI assistant will use the catalog to
                answer customer questions about prices, sizes, colors,
                and stock.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
