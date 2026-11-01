
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number | null;
  price_override: number | null;
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  status: string | null;
  product_variants: Variant[] | null;
};

export default function InventoryPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load inventory belonging to the signed-in user's store.
  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error("Please log in again to view your inventory.");
        }

        const { data: membership, error: membershipError } = await supabase
          .from("store_members")
          .select("store_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipError) throw membershipError;

        if (!membership?.store_id) {
          throw new Error("No store is connected to this account.");
        }

        const { data, error: queryError } = await supabase
          .from("products")
          .select(
            "id, name, category, status, product_variants(id, size, color, stock_quantity, price_override)"
          )
          .eq("store_id", membership.store_id)
          .order("name");

        if (queryError) throw queryError;

        if (!cancelled) {
          setProducts((data ?? []) as Product[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load inventory."
          );
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  const variants = products.flatMap((product) =>
    (product.product_variants ?? []).map((variant) => ({
      ...variant,
      productName: product.name,
      category: product.category,
    }))
  );

  const totalUnits = variants.reduce(
    (sum, variant) => sum + Math.max(0, variant.stock_quantity ?? 0),
    0
  );

  const inStock = variants.filter(
    (variant) => (variant.stock_quantity ?? 0) > 3
  ).length;

  const lowStock = variants.filter((variant) => {
    const quantity = variant.stock_quantity ?? 0;
    return quantity > 0 && quantity <= 3;
  }).length;

  const outOfStock = variants.filter(
    (variant) => (variant.stock_quantity ?? 0) <= 0
  ).length;

  const stockCards = [
    {
      label: "Total Units",
      value: totalUnits,
      icon: "📦",
      color: "bg-blue-50",
      iconBg: "bg-blue-100",
      text: "text-blue-700",
      description: "Physical units in stock",
    },
    {
      label: "In Stock",
      value: inStock,
      icon: "✅",
      color: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      text: "text-emerald-700",
      description: "Variants with 4+ units",
    },
    {
      label: "Low Stock",
      value: lowStock,
      icon: "⚠️",
      color: "bg-amber-50",
      iconBg: "bg-amber-100",
      text: "text-amber-700",
      description: "Variants with 1–3 units",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: "🚫",
      color: "bg-rose-50",
      iconBg: "bg-rose-100",
      text: "text-rose-700",
      description: "Variants with zero units",
    },
  ];

  const maxProductStock = Math.max(
    1,
    ...products.map((product) =>
      (product.product_variants ?? []).reduce(
        (sum, variant) => sum + Math.max(0, variant.stock_quantity ?? 0),
        0
      )
    )
  );

  const inStockPercent =
    variants.length > 0 ? (inStock / variants.length) * 100 : 0;

  const lowStockPercent =
    variants.length > 0 ? (lowStock / variants.length) * 100 : 0;

  const outOfStockPercent =
    variants.length > 0 ? (outOfStock / variants.length) * 100 : 0;

  const inStockAngle = (inStockPercent / 100) * 360;
  const lowStockAngle = (lowStockPercent / 100) * 360;

  const stockGradient =
    variants.length === 0
      ? "#e2e8f0"
      : `conic-gradient(#10b981 0deg ${inStockAngle}deg, #f59e0b ${inStockAngle}deg ${inStockAngle + lowStockAngle}deg, #f43f5e ${inStockAngle + lowStockAngle}deg 360deg)`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <button
              onClick={() => router.push("/")}
              className="mb-3 cursor-pointer text-sm text-slate-500 hover:text-slate-900"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Inventory Overview
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor your fashion products, stock levels and restocking needs.
            </p>
          </div>

          <button
            onClick={() => router.push("/products")}
            className="cursor-pointer rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Manage Products →
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            Loading your real inventory...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-6">
            <h2 className="font-semibold text-rose-700">
              Could not load inventory
            </h2>

            <p className="mt-2 break-words text-sm text-slate-600">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stockCards.map((card) => (
                <article
                  key={card.label}
                  className={`rounded-2xl border border-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.color}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-medium ${card.text}`}>
                        {card.label}
                      </p>

                      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {card.value.toLocaleString()}
                      </p>
                    </div>

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${card.iconBg}`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {card.description}
                  </p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-5">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div>
                  <h2 className="text-lg font-bold">Stock Distribution</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    How your product variants are stocked.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6 py-7 sm:flex-row sm:justify-center">
                  <div
                    className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full"
                    style={{ background: stockGradient }}
                    role="img"
                    aria-label={`Stock distribution: ${inStock} in stock, ${lowStock} low stock, ${outOfStock} out of stock`}
                  >
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-3xl font-bold">
                        {variants.length}
                      </span>

                      <span className="text-xs text-slate-500">
                        Variants
                      </span>
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    {[
                      {
                        label: "In stock",
                        count: inStock,
                        percent: inStockPercent,
                        color: "bg-emerald-500",
                        dot: "bg-emerald-500",
                      },
                      {
                        label: "Low stock",
                        count: lowStock,
                        percent: lowStockPercent,
                        color: "bg-amber-500",
                        dot: "bg-amber-500",
                      },
                      {
                        label: "Out of stock",
                        count: outOfStock,
                        percent: outOfStockPercent,
                        color: "bg-rose-500",
                        dot: "bg-rose-500",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-2 text-slate-600">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
                            />
                            {item.label}
                          </span>

                          <span className="font-semibold">
                            {item.count} ({item.percent.toFixed(0)}%)
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {variants.length === 0 && (
                  <p className="text-center text-sm text-slate-500">
                    Add product variants with stock quantities to see your
                    distribution.
                  </p>
                )}
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
                <div className="mb-6">
                  <h2 className="text-lg font-bold">Stock by Product</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Compare available units across your catalogue.
                  </p>
                </div>

                {products.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-8 text-center">
                    <p className="font-medium">No products found</p>

                    <p className="mt-2 text-sm text-slate-500">
                      Your product stock chart will appear when products are
                      available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {products
                      .map((product) => ({
                        ...product,
                        total: (product.product_variants ?? []).reduce(
                          (sum, variant) =>
                            sum +
                            Math.max(0, variant.stock_quantity ?? 0),
                          0
                        ),
                      }))
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 8)
                      .map((product) => (
                        <div key={product.id}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span
                              className="max-w-[75%] truncate text-sm font-medium text-slate-700"
                              title={product.name}
                            >
                              {product.name}
                            </span>

                            <span className="text-sm font-bold text-slate-900">
                              {product.total} units
                            </span>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                              style={{
                                width: `${(product.total / maxProductStock) * 100}%`,
                                minWidth: product.total > 0 ? "4px" : "0",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {products.length > 8 && (
                  <p className="mt-5 text-xs text-slate-400">
                    Showing the 8 products with the highest stock quantities.
                  </p>
                )}
              </article>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-bold">Inventory Details</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Stock by size and color for each product variant.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {products.length} products
                </span>
              </div>

              {products.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl">📦</div>

                  <h3 className="mt-3 font-semibold">No products found</h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Add products to your store to start tracking inventory.
                  </p>

                  <button
                    onClick={() => router.push("/products")}
                    className="mt-5 cursor-pointer rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    View Products
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Product</th>
                        <th className="px-5 py-4 font-semibold">Category</th>
                        <th className="px-5 py-4 font-semibold">Size</th>
                        <th className="px-5 py-4 font-semibold">Color</th>
                        <th className="px-5 py-4 font-semibold">Quantity</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {products.map((product) => {
                        const productVariants =
                          product.product_variants ?? [];

                        if (productVariants.length === 0) {
                          return (
                            <tr key={product.id}>
                              <td className="px-5 py-4 font-medium">
                                {product.name}
                              </td>

                              <td className="px-5 py-4">
                                {product.category ?? "—"}
                              </td>

                              <td className="px-5 py-4">—</td>
                              <td className="px-5 py-4">—</td>

                              <td className="px-5 py-4 text-slate-400">
                                Not configured
                              </td>

                              <td className="px-5 py-4">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  No variants
                                </span>
                              </td>
                            </tr>
                          );
                        }

                        return productVariants.map((variant) => {
                          const quantity = variant.stock_quantity ?? 0;

                          const status =
                            quantity <= 0
                              ? "Out of stock"
                              : quantity <= 3
                                ? "Low stock"
                                : "In stock";

                          const statusStyle =
                            quantity <= 0
                              ? "bg-rose-100 text-rose-700"
                              : quantity <= 3
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700";

                          return (
                            <tr
                              key={variant.id}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-5 py-4 font-medium">
                                {product.name}
                              </td>

                              <td className="px-5 py-4 text-slate-500">
                                {product.category ?? "—"}
                              </td>

                              <td className="px-5 py-4">
                                {variant.size ?? "—"}
                              </td>

                              <td className="px-5 py-4">
                                {variant.color ?? "—"}
                              </td>

                              <td className="px-5 py-4 font-semibold">
                                {quantity}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle}`}
                                >
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                Stock statuses are calculated from each variant&apos;s
                quantity. Low stock is 1–3 units.
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
