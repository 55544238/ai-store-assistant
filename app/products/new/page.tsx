
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";
const BUCKET = "product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Shoes");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("1");
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function selectPhoto(file?: File) {
    setError("");
    setMessage("");

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Your image must be 5 MB or smaller.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function saveProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError("");

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (
      !name.trim() ||
      price === "" ||
      !size.trim() ||
      !color.trim()
    ) {
      setError("Fill in the product name, price, size, and color.");
      return;
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      setError("Enter a valid price and stock quantity.");
      return;
    }

    setSaving(true);

    let uploadedPath: string | null = null;
    let createdProductId: string | null = null;

    try {
      // Upload the selected photo first, if one was chosen.
      let imageUrl: string | null = null;

      if (photoFile) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!sessionData.session) {
          throw new Error(
            "Please sign in before uploading a product photo. Your product has not been saved."
          );
        }

        const extension =
          photoFile.type === "image/png"
            ? "png"
            : photoFile.type === "image/webp"
              ? "webp"
              : "jpg";

        uploadedPath =
          `${STORE_ID}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(uploadedPath, photoFile, {
            contentType: photoFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(uploadedPath);

        imageUrl = publicData.publicUrl;
      }

      // Save the main product details.
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          store_id: STORE_ID,
          name: name.trim(),
          description: description.trim(),
          category,
          status: available ? "active" : "inactive",
        })
        .select("id")
        .single();

      if (productError) throw productError;

      createdProductId = product.id;

      // Save size, color, SKU, price, and stock.
      const { error: variantError } = await supabase
        .from("product_variants")
        .insert({
          product_id: product.id,
          sku: sku.trim() || null,
          size: size.trim(),
          color: color.trim(),
          price_override: numericPrice,
          stock_quantity: numericStock,
          status: available ? "active" : "inactive",
        });

      if (variantError) throw variantError;

      // Save the uploaded image URL in product_images.
      if (imageUrl) {
        const { error: imageRowError } = await supabase
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: imageUrl,
            sort_order: 0,
          });

        if (imageRowError) throw imageRowError;
      }

      setMessage("Product saved successfully! Redirecting...");

      window.setTimeout(() => {
        window.location.href = "/products";
      }, 1200);
    } catch (err) {
      console.error("Product save error:", err);

      // Attempt to remove the product if a later save step failed.
      if (createdProductId) {
        await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", createdProductId);

        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", createdProductId);

        await supabase
          .from("products")
          .delete()
          .eq("id", createdProductId);
      }

      setError(
        err instanceof Error
          ? err.message
          : "Could not save the product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-100";

  const labelClass = "text-sm font-medium text-stone-700";

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-8 text-stone-900 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-black"
        >
          <span aria-hidden="true">←</span>
          Back to Products
        </Link>

        <header className="mb-8 mt-7 border-b border-stone-200 pb-7">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-2xl shadow-sm">
              🛍️
            </span>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Store inventory
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Add New Product
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
                Add a product and tell your AI assistant exactly what is available.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={saveProduct} className="space-y-6">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.85fr_1.4fr]">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] sm:p-7">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Product image
                </p>
                <h2 className="mt-2 text-lg font-semibold">
                  Photo
                </h2>
                <p className="mt-1 text-sm leading-5 text-stone-500">
                  Choose a clear image of your product.
                </p>
              </div>

              <label className="group flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 bg-[#faf9f6] p-4 text-center transition hover:border-stone-500 hover:bg-stone-50 sm:min-h-[360px]">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Selected product preview"
                    className="max-h-[380px] w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-stone-200 bg-white text-2xl shadow-sm transition group-hover:scale-105">
                      📷
                    </span>
                    <span className="text-sm font-medium text-stone-800">
                      Upload product image
                    </span>
                    <span className="mt-2 max-w-[230px] text-xs leading-5 text-stone-500">
                      JPG, PNG, or WebP. Maximum size: 5 MB.
                    </span>
                    <span className="mt-5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition group-hover:border-stone-500">
                      Choose image
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    selectPhoto(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>

              {photoPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview("");
                    setPhotoFile(null);
                    setError("");
                  }}
                  className="mt-3 text-sm text-stone-500 underline underline-offset-4 transition hover:text-black"
                >
                  Remove photo
                </button>
              )}

              <p className="mt-4 text-xs leading-5 text-stone-400">
                Your selected photo will be uploaded when you save the product.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] sm:p-7">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl">
                  📦
                </span>
                <div>
                  <h2 className="text-lg font-semibold">
                    Basic Information
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Tell customers about this product.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="product-name" className={labelClass}>
                    Product Name <span className="text-stone-400">*</span>
                  </label>
                  <input
                    id="product-name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Nike Air Max"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="description" className={labelClass}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe the material, style, features, etc."
                    rows={4}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label htmlFor="category" className={labelClass}>
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className={inputClass}
                  >
                    <option>Shoes</option>
                    <option>Clothing</option>
                    <option>Bags</option>
                    <option>Accessories</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="price" className={labelClass}>
                    Price (USD) <span className="text-stone-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                      $
                    </span>
                    <input
                      id="price"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="45.00"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl">
                👟
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  Sizes, Colors &amp; Stock
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Tell the AI which version of this product is available.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="size" className={labelClass}>
                  Size <span className="text-stone-400">*</span>
                </label>
                <input
                  id="size"
                  required
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                  placeholder="42"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="color" className={labelClass}>
                  Color <span className="text-stone-400">*</span>
                </label>
                <input
                  id="color"
                  required
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  placeholder="Black"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="sku" className={labelClass}>
                  SKU
                </label>
                <input
                  id="sku"
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  placeholder="SHOE-BLK-42"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="stock" className={labelClass}>
                  Stock <span className="text-stone-400">*</span>
                </label>
                <input
                  id="stock"
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl">
                ✅
              </span>
              <div>
                <h2 className="text-lg font-semibold">Product Status</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Control whether customers can see this product.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={available}
                onChange={(event) => setAvailable(event.target.checked)}
                className="mt-1 h-4 w-4 accent-black"
              />
              <span>
                <span className="block text-sm font-medium text-stone-800">
                  Available for sale
                </span>
                <span className="mt-1 block text-xs leading-5 text-stone-500">
                  The AI assistant can recommend this product to customers.
                </span>
              </span>
            </label>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              {message}
            </p>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-stone-500">
              Fields marked * are required.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-black px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving product..." : "💾 Add Product"}
              </button>
            </div>
          </footer>
        </form>

        <p className="mt-8 text-center text-xs text-stone-400">
          Manage your collection with care.
        </p>
      </div>
    </main>
  );
}