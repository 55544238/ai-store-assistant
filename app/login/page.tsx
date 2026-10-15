"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Shoes");
  const [price, setPrice] = useState("");

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");

  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to add a product.");
      setSaving(false);
      return;
    }

    if (!name.trim()) {
      setError("Please enter a product name.");
      setSaving(false);
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      setSaving(false);
      return;
    }

    if (stock === "" || Number(stock) < 0) {
      setError("Please enter a valid stock quantity.");
      setSaving(false);
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from("store_members")
      .select("store_id, role")
      .eq("store_id", STORE_ID)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      setError(membershipError.message);
      setSaving(false);
      return;
    }

    if (!membership) {
      setError("Your account is not connected to this store.");
      setSaving(false);
      return;
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        store_id: STORE_ID,
        name: name.trim(),
        description: description.trim() || null,
        category,
        price: Number(price),
        status: available ? "active" : "inactive",
      })
      .select()
      .single();

    if (productError || !product) {
      setError(productError?.message || "Could not create product.");
      setSaving(false);
      return;
    }

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        size: size.trim() || null,
        color: color.trim() || null,
        sku: sku.trim() || null,
        stock_quantity: Number(stock),
        status: available ? "active" : "inactive",
      });

    if (variantError) {
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      setError(
        "Product could not be saved because the stock variant failed: " +
          variantError.message
      );
      setSaving(false);
      return;
    }

    setMessage("Product added successfully!");

    setTimeout(() => {
      window.location.href = "/products";
    }, 800);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-black"
        >
          ← Back to Products
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-2xl">
              🛍️
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-950">
                Add New Product
              </h1>

              <p className="mt-1 text-base text-slate-700">
                Add a product and tell your AI assistant exactly what is
                available.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={saveProduct}>

          <section className="mb-6 rounded-2xl border border-slate-300 bg-white p-7 shadow-sm">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
                📦
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Basic Information
                </h2>

                <p className="text-sm text-slate-600">
                  Tell customers about this product.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-6">

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">
                  Product Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Nike Air Max"
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 placeholder:text-slate-500 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">
                  Description
                </label>

                <textarea
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the product, material, style, features, etc."
                  className="w-full resize-none rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 placeholder:text-slate-500 outline-none focus:border-black"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none focus:border-black"
                  >
                    <option>Shoes</option>
                    <option>Clothing</option>
                    <option>Accessories</option>
                    <option>Bags</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">
                    Price
                  </label>

                  <div className="flex">
                    <span className="flex items-center rounded-l-xl border-2 border-r-0 border-slate-300 bg-slate-100 px-4 text-sm font-bold text-slate-800">
                      USD
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="45.00"
                      className="w-full rounded-r-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 placeholder:text-slate-500 outline-none focus:border-black"
                    />
                  </div>
                </div>

              </div>

            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-slate-300 bg-white p-7 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
                👟
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Sizes, Colors & Stock
                </h2>

                <p className="text-sm text-slate-600">
                  Tell the AI which version of this product is available.
                </p>
              </div>

            </div>

            <div className="mt-6 rounded-xl border-2 border-slate-200 bg-slate-50 p-5">

              <div className="grid gap-5 md:grid-cols-4">

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">
                    Size
                  </label>

                  <input
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                    placeholder="42"
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">
                    Color
                  </label>

                  <input
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    placeholder="Black"
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">
                    SKU
                  </label>

                  <input
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    placeholder="SHOE-BLK-42"
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900">
                    Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    placeholder="10"
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500"
                  />
                </div>

              </div>

            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-slate-300 bg-white p-7 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
                ✅
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Product Status
                </h2>

                <p className="text-sm text-slate-600">
                  Control whether customers can see this product.
                </p>
              </div>

            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-100 p-5">

              <div>
                <p className="font-bold text-slate-950">
                  Available for sale
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  The AI assistant can recommend this product to customers.
                </p>
              </div>

              <input
                type="checkbox"
                checked={available}
                onChange={(event) => setAvailable(event.target.checked)}
                className="h-5 w-5 accent-black"
              />

            </div>

          </section>

          <div className="flex justify-end gap-3 pb-10">

            <Link
              href="/products"
              className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "💾 Add Product"}
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}