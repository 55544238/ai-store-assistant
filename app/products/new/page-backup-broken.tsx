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

async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();
setSaving(true);
setMessage("");
setError("");

```
try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    setError("Please log in before adding a product.");
    return;
  }

  if (!name.trim()) {
    setError("Enter a product name.");
    return;
  }

  if (price.trim() === "" || !Number.isFinite(Number(price)) || Number(price) < 0) {
    setError("Enter a valid price.");
    return;
  }

  if (stock.trim() === "" || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    setError("Enter a whole-number stock quantity of 0 or more.");
    return;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("store_id", STORE_ID)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) {
    setError("Your account is not connected to this store.");
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
    throw productError ?? new Error("Could not create the product.");
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
    const { error: rollbackError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (rollbackError) {
      throw new Error(
        `Stock could not be saved: ${variantError.message}. The product record may also need cleanup.`
      );
    }

    throw new Error(`Stock could not be saved: ${variantError.message}`);
  }

  setMessage("Product added successfully!");
  window.setTimeout(() => {
    window.location.href = "/products";
  }, 1000);
} catch (caughtError) {
  setError(
    caughtError instanceof Error
      ? caughtError.message
      : "Something went wrong while saving the product."
  );
} finally {
  setSaving(false);
}
```

}

return ( <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900"> <div className="mx-auto max-w-4xl"> <Link
       href="/products"
       className="mb-6 inline-flex text-sm font-semibold text-slate-700 hover:text-black"
     >
← Back to Products </Link>

```
    <header className="mb-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-2xl">
          🛍️
        </div>
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="mt-1 text-slate-600">
            Add your product and the stock details your AI assistant needs.
          </p>
        </div>
      </div>
    </header>

    {error && (
      <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        {error}
      </div>
    )}

    {message && (
      <div role="status" className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
        {message}
      </div>
    )}

    <form onSubmit={saveProduct}>
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold">Basic Information</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tell customers about this product.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="product-name" className="mb-2 block text-sm font-bold">
              Product Name *
            </label>
            <input
              id="product-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Classic Sneakers"
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label htmlFor="product-description" className="mb-2 block text-sm font-bold">
              Description
            </label>
            <textarea
              id="product-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the material, style, and features."
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="product-category" className="mb-2 block text-sm font-bold">
                Category
              </label>
              <select
                id="product-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option>Shoes</option>
                <option>Clothing</option>
                <option>Accessories</option>
                <option>Bags</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="product-price" className="mb-2 block text-sm font-bold">
                Price (USD) *
              </label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="45.00"
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold">Sizes, Colors & Stock</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add the first version of this product. You can later add more sizes and colors.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="product-size" className="mb-2 block text-sm font-bold">
              Size
            </label>
            <input
              id="product-size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              placeholder="e.g. 42 or M"
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label htmlFor="product-color" className="mb-2 block text-sm font-bold">
              Color
            </label>
            <input
              id="product-color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              placeholder="e.g. Black"
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label htmlFor="product-sku" className="mb-2 block text-sm font-bold">
              SKU (optional)
            </label>
            <input
              id="product-sku"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="e.g. SHOE-BLK-42"
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label htmlFor="product-stock" className="mb-2 block text-sm font-bold">
              Stock Quantity *
            </label>
            <input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              required
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              placeholder="10"
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 outline-none focus:border-black"
            />
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-xl font-bold">Product Status</h2>
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-5">
          <div>
            <p className="font-bold">Available for sale</p>
            <p className="mt-1 text-sm text-slate-600">
              Turn this off to mark the product as unavailable.
            </p>
          </div>
          <input
            aria-label="Available for sale"
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
          className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-bold hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-black px-7 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "💾 Add Product"}
        </button>
      </div>
    </form>
  </div>
</main>
```

);
}
