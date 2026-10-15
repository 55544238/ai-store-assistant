
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";

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
    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("id, name, category, price, status")
          .eq("store_id", STORE_ID)
          .order("created_at", { ascending: false });

        if (productError) throw productError;

        const rows = (productData ?? []) as Product[];

        if (rows.length === 0) {
          setProducts([]);
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

          if (stock === 0) {
            status = "Out of stock";
          } else if (product.status?.toLowerCase() !== "active") {
            status = "Inactive";
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

        setProducts(displayProducts);
      } catch (err) {
        console.error("Load products error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = [
    "All categories",
    ...Array.from(new Set(products.map((product) => product.category))),
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      
<header className="border-b border-slate-200 bg-white">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
    <div>
      <Link
        href="/"
        className="mb-3 inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold">Products</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage your products, prices, and inventory.
      </p>
    </div>

    <Link
      href="/products/new"
      className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
    >
      + Add Product
    </Link>
  </div>
</header>



      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 sm:w-80"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-red-600"
                    >
                      Could not load products: {error}
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      {products.length === 0
                        ? "No products yet. Add your first product."
                        : "No products match your search."}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">No photo</span>
                            )}
                          </div>

                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-slate-400">Product</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {product.category}
                      </td>

                      <td className="px-6 py-5 text-sm font-medium">
                        {product.price}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={
                            product.stock === 0
                              ? "text-sm font-medium text-red-600"
                              : product.stock < 5
                                ? "text-sm font-medium text-orange-600"
                                : "text-sm font-medium text-slate-700"
                          }
                        >
                          {product.stock} units
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={
                            product.status === "Active"
                              ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                              : product.status === "Out of stock"
                                ? "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          }
                        >
                          {product.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <button
                          type="button"
                          className="text-sm font-medium text-slate-600 hover:text-black"
                          onClick={() => {
                            window.location.href = `/products/edit?id=${product.id}`;
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
              AI
            </div>

            <div>
              <h2 className="font-semibold">
                Your AI will use these products
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Every product you add here becomes part of your store catalog.
                The AI assistant will use the catalog to answer customer
                questions about prices, sizes, colors, and stock.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}