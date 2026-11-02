
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

const BUCKET = "product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    let failedAt = "Form validation";
    let uploadedImagePath: string | null = null;
    let productId: string | null = null;

    try {
      // 1. Validate the form
      const numericPrice = Number(price);
      const numericStock = Number(stock);

      if (!name.trim() || price === "" || !size.trim() || !color.trim()) {
        throw new Error("Fill in the product name, price, size, and color.");
      }

      if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0 ||
        !Number.isInteger(numericStock) ||
        numericStock < 0
      ) {
        throw new Error("Enter a valid price and stock quantity.");
      }

      // 2. Get the signed-in user
      failedAt = "Checking your login";

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Please sign in again before adding a product.");
      }

      // 3. Find the user's store
      failedAt = "Finding your store";

      const { data: membership, error: membershipError } = await supabase
        .from("store_members")
        .select("store_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError) throw membershipError;

      if (!membership?.store_id) {
        throw new Error("Your account does not have a store yet.");
      }

      const storeId = membership.store_id;

      // 4. Create the product
      failedAt = "Creating the product";

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          store_id: storeId,
          name: name.trim(),
          description: description.trim(),
          category,
          price: numericPrice,
          status: available ? "active" : "inactive",
        })
        .select("id")
        .single();

      if (productError) throw productError;

      productId = product.id;

      // 5. Create the product variant
      failedAt = "Creating the product variant";

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert({
          product_id: product.id,
          size: size.trim(),
          color: color.trim(),
          sku: sku.trim() || null,
          stock_quantity: numericStock,
          price_override: null,
        });

      if (variantError) throw variantError;

      // 6. Upload and save the image, if selected
      if (photoFile) {
        const extension =
          photoFile.type === "image/png"
            ? "png"
            : photoFile.type === "image/webp"
              ? "webp"
              : "jpg";

        uploadedImagePath = `${storeId}/${crypto.randomUUID()}.${extension}`;

        failedAt = "Uploading the product photo to Supabase Storage";

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(uploadedImagePath, photoFile, {
            contentType: photoFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: imageData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(uploadedImagePath);

        failedAt = "Saving the product photo record";

        const { error: imageError } = await supabase
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: imageData.publicUrl,
            sort_order: 0,
          });

        if (imageError) throw imageError;
      }

      // 7. Success
      setMessage("Product added successfully.");

      setTimeout(() => {
        window.location.href = "/products";
      }, 1000);

      setName("");
      setDescription("");
      setPrice("");
      setSize("");
      setColor("");
      setSku("");
      setStock("1");
      setAvailable(true);
      setPhotoFile(null);

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoPreview(null);
    } catch (err) {
      console.error("Product save failed at:", failedAt, err);

      const errorDetails =
        err instanceof Error
          ? err.message
          : "An unknown error occurred.";

      setError(`${failedAt} failed: ${errorDetails}`);

      // Clean up the product and its related records if creation failed.
      if (productId) {
        const { error: imageCleanupError } = await supabase
          .from("product_images")
          .delete()
          .eq("product_id", productId);

        if (imageCleanupError) {
          console.error("Image record cleanup failed:", imageCleanupError);
        }

        const { error: variantCleanupError } = await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", productId);

        if (variantCleanupError) {
          console.error("Variant cleanup failed:", variantCleanupError);
        }

        const { error: productCleanupError } = await supabase
          .from("products")
          .delete()
          .eq("id", productId);

        if (productCleanupError) {
          console.error("Product cleanup failed:", productCleanupError);
        }
      }

      if (uploadedImagePath) {
        const { error: storageCleanupError } = await supabase.storage
          .from(BUCKET)
          .remove([uploadedImagePath]);

        if (storageCleanupError) {
          console.error("Photo cleanup failed:", storageCleanupError);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-100 dark:border-[#303030] dark:bg-[#111111] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-stone-500 dark:focus:ring-stone-800";

  const labelClass =
    "text-sm font-medium text-stone-700 dark:text-stone-300";

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-8 text-stone-900 transition-colors dark:bg-black dark:text-white sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-black dark:text-stone-400 dark:hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Back to Products
        </Link>

        <header className="mb-8 mt-7 border-b border-stone-200 pb-7 dark:border-[#262626]">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-2xl shadow-sm dark:border-[#303030] dark:bg-[#111111] dark:shadow-none">
              🛍️
            </span>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
                Store inventory
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Add New Product
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500 dark:text-stone-400">
                Add a product and tell your AI assistant exactly what is available.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={saveProduct} className="space-y-6">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.85fr_1.4fr]">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] dark:border-[#262626] dark:bg-[#0a0a0a] dark:shadow-none sm:p-7">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
                  Product image
                </p>
                <h2 className="mt-2 text-lg font-semibold">Photo</h2>
                <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-stone-400">
                  Choose a clear image of your product.
                </p>
              </div>

              <label className="group flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 bg-[#faf9f6] p-4 text-center transition hover:border-stone-500 hover:bg-stone-50 dark:border-[#383838] dark:bg-[#111111] dark:hover:border-stone-500 dark:hover:bg-[#171717] sm:min-h-[360px]">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Selected product preview"
                    className="max-h-[380px] w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-stone-200 bg-white text-2xl shadow-sm transition group-hover:scale-105 dark:border-[#303030] dark:bg-[#1b1b1b] dark:shadow-none">
                      📷
                    </span>
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      Upload product image
                    </span>
                    <span className="mt-2 max-w-[230px] text-xs leading-5 text-stone-500 dark:text-stone-400">
                      JPG, PNG, or WebP. Maximum size: 5 MB.
                    </span>
                    <span className="mt-5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition group-hover:border-stone-500 dark:border-[#383838] dark:bg-[#202020] dark:text-stone-200 dark:group-hover:border-stone-500">
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
                    URL.revokeObjectURL(photoPreview);
                    setPhotoPreview(null);
                    setPhotoFile(null);
                    setError("");
                  }}
                  className="mt-3 text-sm text-stone-500 underline underline-offset-4 transition hover:text-black dark:text-stone-400 dark:hover:text-white"
                >
                  Remove photo
                </button>
              )}

              <p className="mt-4 text-xs leading-5 text-stone-400 dark:text-stone-500">
                Your selected photo will be uploaded when you save the product.
              </p>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] dark:border-[#262626] dark:bg-[#0a0a0a] dark:shadow-none sm:p-7">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl dark:bg-[#1c1c1c]">
                  📦
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Basic Information</h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 dark:text-stone-500">
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

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] dark:border-[#262626] dark:bg-[#0a0a0a] dark:shadow-none sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl dark:bg-[#1c1c1c]">
                👟
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  Sizes, Colors &amp; Stock
                </h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
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

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] dark:border-[#262626] dark:bg-[#0a0a0a] dark:shadow-none sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl dark:bg-[#1c1c1c]">
                ✅
              </span>
              <div>
                <h2 className="text-lg font-semibold">Product Status</h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
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
                <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
                  Available for sale
                </span>
                <span className="mt-1 block text-xs leading-5 text-stone-500 dark:text-stone-400">
                  The AI assistant can recommend this product to customers.
                </span>
              </span>
            </label>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-[#200b0b] dark:text-red-300"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-[#0b1b10] dark:text-green-300"
            >
              {message}
            </p>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 dark:border-[#262626] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">
              Fields marked * are required.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:border-[#383838] dark:bg-[#111111] dark:text-stone-200 dark:hover:bg-[#202020]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-black px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-stone-200 dark:focus:ring-offset-black"
              >
                {saving ? "Saving product..." : "💾 Add Product"}
              </button>
            </div>
          </footer>
        </form>

        <p className="mt-8 text-center text-xs text-stone-400 dark:text-stone-600">
          Manage your collection with care.
        </p>
      </div>
    </main>
  );
}
