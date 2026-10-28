
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";

type Variant = {
  size: string | null;
  color: string | null;
  stock_quantity: number | null;
};

type Product = {
  id: string;
  name: string;
  status: string;
  product_variants: Variant[];
};

type InventoryRow = {
  key: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  stock: number | null;
  status: string;
};

const navigation = [
  { label: "Overview", href: "/", icon: "⌂" },
  { label: "Products", href: "/products", icon: "▦" },
  { label: "Inventory", href: "/inventory", icon: "▤" },
  { label: "Messages", href: "/messages", icon: "◷" },
  { label: "AI Assistant", href: "/chat", icon: "✳" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    async function loadInventory() {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, name, status, product_variants(size, color, stock_quantity)"
          )
          .eq("store_id", STORE_ID)
          .order("name");

        if (error) throw error;

        setProducts(
          ((data ?? []) as Product[]).map((product) => ({
            ...product,
            product_variants: product.product_variants ?? [],
          }))
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  const rows = useMemo<InventoryRow[]>(
    () =>
      products.flatMap((product) => {
        const variants = product.product_variants;

        if (variants.length === 0) {
          return [
            {
              key: product.id,
              productId: product.id,
              name: product.name,
              size: "—",
              color: "—",
              stock: null,
              status: product.status,
            },
          ];
        }

        return variants.map((variant, index) => ({
          key: `${product.id}-${index}`,
          productId: product.id,
          name: product.name,
          size: variant.size || "—",
          color: variant.color || "—",
          stock: variant.stock_quantity,
          status: product.status,
        }));
      }),
    [products]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.size.toLowerCase().includes(query) ||
        row.color.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "low" && row.stock !== null && row.stock > 0 && row.stock <= 5) ||
        (filter === "out" && row.stock === 0) ||
        (filter === "unknown" && row.stock === null);

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  const lowStock = rows.filter(
    (row) => row.stock !== null && row.stock > 0 && row.stock <= 5
  ).length;

  const outOfStock = rows.filter((row) => row.stock === 0).length;

  const totalStock = rows.reduce(
    (total, row) => total + (row.stock ?? 0),
    0
  );

  const knownStockRows = rows.filter((row) => row.stock !== null).length;
  const unknownStock = rows.length - knownStockRows;

  function stockLabel(stock: number | null) {
    if (stock === null) return "Not recorded";
    if (stock === 0) return "Out of stock";
    if (stock <= 5) return "Low stock";
    return "In stock";
  }

  function stockStyle(stock: number | null) {
    if (stock === null) return "bg-gray-100 text-gray-600";
    if (stock === 0) return "bg-red-50 text-red-700";
    if (stock <= 5) return "bg-amber-50 text-amber-700";
    return "bg-emerald-50 text-emerald-700";
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      {mobileNav && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileNav ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-sm">
            A
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-tight text-slate-900">
              AI Store Assistant
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Store workspace
            </span>
          </span>
        </Link>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const active = item.href === "/inventory";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNav(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-lg ${
                    active ? "bg-white text-indigo-600" : "text-slate-400"
                  }`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              ✳
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Your AI sales assistant
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Help customers find products faster.
            </p>
            <Link
              href="/chat"
              className="mt-3 inline-flex text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Open assistant →
            </Link>
          </div>
          <p className="px-2 pt-4 text-[10px] text-slate-400">
            AI Store Assistant
          </p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              ☰
            </button>
            <div>
              <p className="text-xs text-slate-400">Workspace / Inventory</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                Inventory management
              </p>
            </div>
          </div>

          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:px-4 sm:text-sm"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">Add product</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 sm:py-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                STORE OPERATIONS
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">
                Inventory
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Track stock levels, spot low inventory, and keep your catalog ready for every sale.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 sm:self-auto"
            >
              View all products <span>→</span>
            </Link>
          </div>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Products</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">▦</span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{products.length}</p>
              <p className="mt-1 text-xs text-slate-400">Products in this store</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Units in stock</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">▤</span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{totalStock}</p>
              <p className="mt-1 text-xs text-slate-400">Sum of recorded quantities</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Low stock</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">!</span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{lowStock}</p>
              <p className="mt-1 text-xs text-slate-400">Variants with 1–5 units</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Out of stock</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg text-red-600">↘</span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{outOfStock}</p>
              <p className="mt-1 text-xs text-slate-400">Variants with zero units</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Stock overview</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {filteredRows.length} {filteredRows.length === 1 ? "variant" : "variants"} displayed
                    {unknownStock > 0 ? ` · ${unknownStock} without recorded stock` : ""}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  Edit products →
                </Link>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product, size, or color..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  aria-label="Filter inventory"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="all">All stock statuses</option>
                  <option value="low">Low stock</option>
                  <option value="out">Out of stock</option>
                  <option value="unknown">Stock not recorded</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-50" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-50" />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="font-semibold text-red-700">Could not load inventory</p>
                <p className="mt-2 break-words text-sm text-slate-500">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Try again
                </button>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">⌕</span>
                <h3 className="mt-4 font-semibold text-slate-800">
                  {rows.length === 0 ? "No inventory yet" : "No matching products"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {rows.length === 0
                    ? "Add a product to start tracking your stock."
                    : "Try a different search or stock filter."}
                </p>
                {rows.length === 0 && (
                  <Link
                    href="/products/new"
                    className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Add your first product
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-5 py-4">Size</th>
                      <th className="px-5 py-4">Color</th>
                      <th className="px-5 py-4">Quantity</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => (
                      <tr key={row.key} className="transition hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-indigo-50 text-lg text-indigo-600">
                              ▦
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{row.name}</p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                Product inventory
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{row.size}</td>
                        <td className="px-5 py-4 text-slate-500">{row.color}</td>
                        <td className="px-5 py-4">
                          <span className="font-semibold tabular-nums text-slate-800">
                            {row.stock === null ? "—" : row.stock}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${stockStyle(row.stock)}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {stockLabel(row.stock)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/products/edit?id=${encodeURIComponent(row.productId)}`}
                            className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && filteredRows.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span>
                  Showing {filteredRows.length} of {rows.length} inventory variants
                </span>
                <span>Stock values reflect the latest saved quantities.</span>
              </div>
            )}
          </section>

          <footer className="flex flex-col gap-2 py-6 text-xs text-slate-400 sm:flex-row sm:justify-between">
            <span>AI Store Assistant · Inventory</span>
            <span>Keep your catalog accurate and ready to sell.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
