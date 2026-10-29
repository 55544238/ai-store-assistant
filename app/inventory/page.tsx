
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../components/dashboard-layout";
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
  product_variants: Variant[] | null;
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

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      setLoading(true);
      setError("");

      try {
        const { data, error: queryError } = await supabase
          .from("products")
          .select(
            "id, name, status, product_variants(size, color, stock_quantity)"
          )
          .eq("store_id", STORE_ID)
          .order("name");

        if (queryError) {
          throw queryError;
        }

        if (!cancelled) {
          setProducts(
            ((data ?? []) as Product[]).map((product) => ({
              ...product,
              product_variants: product.product_variants ?? [],
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "An unexpected error occurred."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<InventoryRow[]>(
    () =>
      products.flatMap((product) => {
        const variants = product.product_variants ?? [];

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
          stock: variant.stock_quantity ?? null,
          status: product.status,
        }));
      }),
    [products]
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.size.toLowerCase().includes(term) ||
        row.color.toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" ||
        (filter === "in_stock" &&
          row.stock !== null &&
          row.stock > 0) ||
        (filter === "out_of_stock" && row.stock === 0) ||
        (filter === "unknown" && row.stock === null);

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  const totalProducts = products.length;
  const inStock = rows.filter(
    (row) => row.stock !== null && row.stock > 0
  ).length;
  const outOfStock = rows.filter((row) => row.stock === 0).length;
  const unknownStock = rows.filter((row) => row.stock === null).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Inventory
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor product variants and stock levels.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Manage products
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="font-semibold">Could not load inventory</p>
            <p className="mt-1 break-words">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-md border border-red-300 px-3 py-1.5 font-medium transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Products</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {loading ? "—" : totalProducts}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Variants in stock</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {loading ? "—" : inStock}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Out of stock</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {loading ? "—" : outOfStock}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Stock not recorded</p>
            <p className="mt-2 text-3xl font-bold text-gray-700">
              {loading ? "—" : unknownStock}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, size, or color..."
              aria-label="Search inventory"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter inventory by stock"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            >
              <option value="all">All stock</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="unknown">Stock not recorded</option>
            </select>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading inventory...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Inventory could not be displayed until the error above is fixed.
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-900">
                No inventory items found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try another search or filter, or add products to your catalog.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">Size</th>
                    <th className="px-5 py-3 font-semibold">Color</th>
                    <th className="px-5 py-3 font-semibold">Stock</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => (
                    <tr
                      key={row.key}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {row.name}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{row.size}</td>
                      <td className="px-5 py-4 text-gray-600">{row.color}</td>
                      <td className="px-5 py-4">
                        {row.stock === null ? (
                          <span className="text-gray-500">Not recorded</span>
                        ) : (
                          <span
                            className={
                              row.stock > 0
                                ? "font-medium text-green-700"
                                : "font-medium text-red-600"
                            }
                          >
                            {row.stock}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            row.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/products/${row.productId}`}
                          className="font-medium text-blue-700 underline-offset-4 transition hover:text-blue-900 hover:underline"
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

          {!loading && !error && (
            <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
              Showing {filteredRows.length} of {rows.length} inventory items
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
