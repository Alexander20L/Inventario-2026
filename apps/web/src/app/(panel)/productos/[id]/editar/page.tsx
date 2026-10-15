import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { privateApi } from "@/lib/session";
import { catalogDetail } from "@/lib/catalog";
import type { CatalogPage, Product, Supplier } from "@/lib/catalog-types";
import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Editar producto" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await catalogDetail<Product>(
    `/products/${encodeURIComponent(id)}`,
  );
  const suppliers = await privateApi<CatalogPage<Supplier>>("/suppliers");
  return (
    <>
      <PageHeader
        title="Editar producto"
        description="Actualiza el catálogo conservando la identidad del producto."
      >
        <Link href={`/productos/${product.id}`} className="button secondary">
          <ArrowLeft size={15} /> Volver al producto
        </Link>
      </PageHeader>
      <ProductForm product={product} suppliers={suppliers} />
    </>
  );
}
