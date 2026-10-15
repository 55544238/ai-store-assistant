"use client";

import Link from "next/link";

const products = [
  {
    name: "Classic Sneakers",
    category: "Shoes",
    price: "$45",
    stock: 12,
    status: "Active",
  },
  {
    name: "Oversized Hoodie",
    category: "Clothing",
    price: "$35",
    stock: 7,
    status: "Active",
  },
  {
    name: "Leather Handbag",
    category: "Accessories",
    price: "$60",
    stock: 0,
    status: "Out of stock",
  },
];

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
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
            placeholder="Search products..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 sm:w-80"
          />

          <select className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none">
            <option>All categories</option>
            <option>Shoes</option>
            <option>Clothing</option>
            <option>Accessories</option>
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
                {products.map((product) => (
                  <tr
                    key={product.name}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
                          IMG
                        </div>

                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-slate-400">
                            Product
                          </p>
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
                            : "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                        }
                      >
                        {product.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <button
                        type="button"
                        className="text-sm font-medium text-slate-600 hover:text-black"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
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
                Every product you add here becomes part of your store
                catalog. The AI assistant will use the catalog to answer
                customer questions about prices, sizes, colors, and stock.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
