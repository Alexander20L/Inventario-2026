import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { catalogDetail } from "@/lib/catalog";
import type { SupplierDetail } from "@/lib/catalog-types";
import { SupplierForm } from "@/components/supplier-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Editar proveedor" };

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await catalogDetail<SupplierDetail>(
    `/suppliers/${encodeURIComponent(id)}`,
  );
  return (
    <>
      <PageHeader
        title="Editar proveedor"
        description="Actualiza los datos de tu contacto de reposición."
      >
        <Link href={`/proveedores/${supplier.id}`} className="button secondary">
          <ArrowLeft size={15} /> Volver al contacto
        </Link>
      </PageHeader>
      <SupplierForm supplier={supplier} />
    </>
  );
}
