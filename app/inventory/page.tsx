
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";

type Product = {
  id: string;
  name: string;
  status: string;
  product_variants: {
    size: string | null;
    color: string | null;
    stock_quantity: number | null;
  }[];
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInventory() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, status, product_variants(size, color, stock_quantity)"
        )
        .eq("store_id", STORE_ID)
        .order("name");

      if (error) {
        setError(error.message);
        setProducts([]);
      } else {
        setProducts((data ?? []) as Product[]);
      }

      setLoading(false);
    }

    loadInventory();
  }, []);

  const totalStock = products.reduce(
    (total, product) =>
      total +
      (product.product_variants ?? []).reduce(
        (sum, variant) => sum + (variant.stock_quantity ?? 0),
        0
      ),
    0
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 sm:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Back to Overview
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="mt-2 text-gray-600">
              Review your products, variants, and stock levels.
            </p>
          </div>

          <Link
            href="/products"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Manage Products
          </Link>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Products listed</p>
            <p className="mt-2 text-3xl font-bold">{products.length}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total recorded stock</p>
            <p className="mt-2 text-3xl font-bold">{totalStock}</p>
          </div>
        </section>

        <section className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          {loading ? (
            <p className="p-6">Loading inventory...</p>
          ) : error ? (
            <p className="p-6 text-red-600">
              Could not load inventory: {error}
            </p>
          ) : products.length === 0 ? (
            <p className="p-6">No products found for this store.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Color</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.flatMap((product) => {
                  const variants = product.product_variants ?? [];

                  if (variants.length === 0) {
                    return [
                      <tr key={product.id}>
                        <td className="p-4 font-medium">{product.name}</td>
                        <td className="p-4">—</td>
                        <td className="p-4">—</td>
                        <td className="p-4">Not recorded</td>
                        <td className="p-4">{product.status}</td>
                      </tr>,
                    ];
                  }

                  return variants.map((variant, index) => (
                    <tr key={`${product.id}-${index}`}>
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4">{variant.size || "—"}</td>
                      <td className="p-4">{variant.color || "—"}</td>
                      <td className="p-4">
                        {variant.stock_quantity ?? "Not recorded"}
                      </td>
                      <td className="p-4">{product.status}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
