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
        const variants
