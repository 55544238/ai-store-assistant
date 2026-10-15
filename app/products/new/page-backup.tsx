"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewProductPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">

        {/* Back */}

        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-black"
        >
          ← Back to Products
        </Link>

        {/* Page heading */}

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

        {/* Basic Information */}

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

          {/* Product Image */}

          <div className="mt-7">

            <label className="mb-2 block text-sm font-bold text-slate-900">
              Product Image
            </label>

            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              {imagePreview ? (
                <div className="mb-5">

                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="mx-auto h-56 w-56 rounded-xl object-cover shadow-sm"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Image selected
                  </p>

                </div>
              ) : (
                <>
                  <div className="text-5xl">
                    🖼️
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-900">
                    Upload a product image
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    PNG, JPG or WEBP
                  </p>
                </>
              )}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="mx-auto mt-5 block w-full max-w-sm rounded-lg border border-slate-300 bg-white p-2 text-sm font-medium text-slate-800"
              />

            </div>

          </div>

          {/* Product information */}

          <div className="mt-7 space-y-6">

            {/* Product name */}

            <div>

              <label className="mb-2 block text-sm font-bold text-slate-900">
                Product Name
              </label>

              <input
                type="text"
                placeholder="e.g. Nike Air Max"
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 placeholder:text-slate-500 outline-none transition focus:border-black focus:ring-2 focus:ring-slate-200"
              />

            </div>

            {/* Description */}

            <div>

              <label className="mb-2 block text-sm font-bold text-slate-900">
                Description
              </label>

              <textarea
                rows={5}
                placeholder="Describe the product, material, style, features, etc."
                className="w-full resize-none rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 placeholder:text-slate-500 outline-none transition focus:border-black focus:ring-2 focus:ring-slate-200"
              />

            </div>

            {/* Category and price */}

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-900">
                  Category
                </label>

                <select
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 outline-none focus:border-black focus:ring-2 focus:ring-slate-200"
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
                    placeholder="45.00"
                    className="w-full rounded-r-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-950 placeholder:text-slate-500 outline-none focus:border-black focus:ring-2 focus:ring-slate-200"
                  />

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* Variants */}

        <section className="mb-6 rounded-2xl border border-slate-300 bg-white p-7 shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
                👟
              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-950">
                  Sizes, Colors & Stock
                </h2>

                <p className="text-sm text-slate-600">
                  Tell the AI which versions of this product are available.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              + Add Variant
            </button>

          </div>

          <div className="mt-6 rounded-xl border-2 border-slate-200 bg-slate-50 p-5">

            <div className="grid gap-5 md:grid-cols-4">

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-900">
                  Size
                </label>

                <input
                  placeholder="42"
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-900">
                  Color
                </label>

                <input
                  placeholder="Black"
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-900">
                  SKU
                </label>

                <input
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
                  placeholder="10"
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-slate-950 placeholder:text-slate-500"
                />

              </div>

            </div>

          </div>

        </section>

        {/* Product Status */}

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
              defaultChecked
              className="h-5 w-5 accent-black"
            />

          </div>

        </section>

        {/* Buttons */}

        <div className="flex justify-end gap-3 pb-10">

          <Link
            href="/products"
            className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={() => alert("ADD PRODUCT BUTTON WORKS")}
            className="rounded-xl bg-black px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
          >
            💾 Add Product
          </button>

        </div>

      </div>
    </main>
  );
}