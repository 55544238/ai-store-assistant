
"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

const STORE_ID = "138ee5b7-d235-4cfa-b620-8adcfb8b5838";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string | null;
  status: string | null;
};

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock_quantity: number | null;
  price_override: number | string | null;
};

function EditProductContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("1");
  const [status, setStatus] = useState("active");

  const [imageId, setImageId] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        setMessage("No product was selected.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, category, price, status")
        .eq("id", productId)
        .eq("store_id", STORE_ID)
        .single();

      if (error || !data) {
        setMessage(error?.message || "Product not found.");
        setLoading(false);
        return;
      }

      const foundProduct = data as Product;

      setProduct(foundProduct);
      setName(foundProduct.name || "");
      setDescription(foundProduct.description || "");
      setCategory(foundProduct.category || "");
      setStatus(foundProduct.status || "active");

      const { data: variants, error: variantError } = await supabase
        .from("product_variants")
        .select("id, size, color, sku, stock_quantity, price_override")
        .eq("product_id", productId)
        .limit(1);

      if (variantError) {
        setMessage(variantError.message);
        setLoading(false);
        return;
      }

      const foundVariant = (variants?.[0] as Variant | undefined) || null;

      setVariant(foundVariant);

      if (foundVariant) {
        setPrice(
          String(foundVariant.price_override ?? foundProduct.price ?? "")
        );
        setSize(foundVariant.size || "");
        setColor(foundVariant.color || "");
        setSku(foundVariant.sku || "");
        setStock(String(foundVariant.stock_quantity ?? 1));
      } else {
        setPrice(String(foundProduct.price ?? ""));
      }

      const { data: images, error: imageError } = await supabase
        .from("product_images")
        .select("id, image_url, sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (imageError) {
        setMessage(
          `Product loaded, but its image could not be loaded: ${imageError.message}`
        );
      } else if (images && images.length > 0) {
        setImageId(images[0].id);
        setCurrentImageUrl(images[0].image_url);
      }

      setLoading(false);
    }

    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setMessage("The image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setMessage("");
    setSelectedImage(file);
  }

  async function saveProductImage(): Promise<string | null> {
    if (!product || !selectedImage) return null;

    const safeName = selectedImage.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${STORE_ID}/${product.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, selectedImage, {
        contentType: selectedImage.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    if (imageId) {
      const { error } = await supabase
        .from("product_images")
        .update({
          image_url: imageUrl,
          sort_order: 0,
        })
        .eq("id", imageId)
        .eq("product_id", product.id);

      if (error) {
        throw new Error(`Image record update failed: ${error.message}`);
      }
    } else {
      const { data, error } = await supabase
        .from("product_images")
        .insert({
          product_id: product.id,
          image_url: imageUrl,
          sort_order: 0,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(`Image record creation failed: ${error.message}`);
      }

      setImageId(data.id);
    }

    setCurrentImageUrl(imageUrl);
    setSelectedImage(null);

    return imageUrl;
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!product) return;

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (
      !name.trim() ||
      !price.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setMessage("Enter a product name and a valid price.");
      return;
    }

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      setMessage("Stock must be a whole number of zero or more.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          status,
        })
        .eq("id", product.id)
        .eq("store_id", STORE_ID);

      if (productError) throw productError;

      if (variant) {
        const { error: variantError } = await supabase
          .from("product_variants")
          .update({
            size: size.trim() || null,
            color: color.trim() || null,
            sku: sku.trim() || null,
            price_override: numericPrice,
            stock_quantity: numericStock,
            status,
          })
          .eq("id", variant.id);

        if (variantError) throw variantError;
      } else {
        const { error: variantError } = await supabase
          .from("product_variants")
          .insert({
            product_id: product.id,
            size: size.trim() || null,
            color: color.trim() || null,
            sku: sku.trim() || null,
            price_override: numericPrice,
            stock_quantity: numericStock,
            status,
          });

        if (variantError) throw variantError;
      }

      if (selectedImage) {
        await saveProductImage();
      }

      setMessage("Product updated successfully!");
      setSaving(false);

      window.setTimeout(() => router.push("/products"), 1000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the product."
      );
      setSaving(false);
    }
  }


  async function deleteProduct() {
if (!product || deleting || saving) return;

const confirmed = window.confirm(
  `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
);

if (!confirmed) return;

setDeleting(true);
setMessage("");

try {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id)
    .eq("store_id", STORE_ID);

  if (error) throw error;

  router.push("/products");
} catch (error) {
  setMessage(
    error instanceof Error
      ? error.message
      : "Could not delete this product."
  );
  setDeleting(false);
}


}


  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-600">
        Loading product...
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-600">
        Loading product...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="mb-5 text-sm text-slate-500 hover:text-black"
        >
          ← Back to products
        </button>

        <h1 className="text-2xl font-bold">Edit product</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update product details, inventory, and image.
        </p>

        {message && (
          <p
            className="mt-4 rounded-xl bg-slate-100 p-3 text-sm"
            role="status"
          >
            {message}
          </p>
        )}

        {product && (
          <form onSubmit={saveChanges} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Product image
              </label>

              {previewUrl || currentImageUrl ? (
                <img
                  src={previewUrl || currentImageUrl || ""}
                  alt={name || "Product image"}
                  className="mb-3 h-56 w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
                />
              ) : (
                <div className="mb-3 flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                  No product image yet
                </div>
              )}

              <label
                htmlFor="product-image"
                className="block cursor-pointer rounded-xl border border-slate-300 px-4 py-4 text-center text-sm hover:bg-slate-50"
              >
                <span className="font-medium">
                  {selectedImage ? "Choose a different image" : "Choose or replace image"}
                </span>
                <span className="mt-1 block text-slate-500">
                  JPG, PNG, or WEBP · Maximum 5 MB
                </span>
              </label>

              <input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />

              {selectedImage && (
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-600">
                    New image: {selectedImage.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="shrink-0 text-red-600 hover:text-red-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Product name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Category
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Shoes"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Price</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Size</label>
                <input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 42 or M"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Color</label>
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Black"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Stock quantity
              </label>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            ```
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            disabled={saving || deleting}
            type="submit"
            className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving changes..." : "Save changes"}
          </button>

          <button
            disabled={saving || deleting}
            type="button"
            onClick={deleteProduct}
            className="w-full rounded-xl bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete product"}
          </button>
        </div>
```

          </form>
        )}
      </div>
    </main>
  );
}

export default function EditProductPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-8 text-slate-600">
          Loading product editor...
        </main>
      }
    >
      <EditProductContent />
    </Suspense>
  );
}