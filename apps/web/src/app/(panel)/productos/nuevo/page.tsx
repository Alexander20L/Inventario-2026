import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { privateApi } from "@/lib/session";
import { catalogDetail } from "@/lib/catalog";
import type {
  CatalogPage,
  Supplier,
  SupplierDetail,
} from "@/lib/catalog-types";
import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Crear producto" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ proveedorId?: string }>;
}) {
  const { proveedorId } = await searchParams;
  const suppliers = await privateApi<CatalogPage<Supplier>>("/suppliers");
  const selected = proveedorId
    ? [
        await catalogDetail<SupplierDetail>(
          `/suppliers/${encodeURIComponent(proveedorId)}`,
        ),
      ]
    : [];
  return (
    <>
      <PageHeader
        title="Crear producto"
        description="Añade un producto a tu catálogo, sin modificar existencias."
      >
        <Link href="/productos" className="button secondary">
          <ArrowLeft size={15} /> Volver al catálogo
        </Link>
      </PageHeader>
      <ProductForm suppliers={suppliers} selected={selected} />
    </>
  );
}
