import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { SupplierForm } from "@/components/supplier-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Añadir proveedor" };

export default async function NewSupplierPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Añadir proveedor"
        description="Guarda a la persona o distribuidora que repone tus productos."
      >
        <Link href="/proveedores" className="button secondary">
          <ArrowLeft size={15} /> Volver a contactos
        </Link>
      </PageHeader>
      <SupplierForm />
    </>
  );
}
