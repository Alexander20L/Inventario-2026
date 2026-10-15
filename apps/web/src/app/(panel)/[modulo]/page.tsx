import { notFound } from "next/navigation";
import { Boxes, ClipboardList, ShoppingBag } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/ui";

const modules = {
  inventario: {
    title: "Inventario",
    description: "Existencias claras y movimientos con historial.",
    icon: ClipboardList,
    detail:
      "Aquí consultarás las cantidades disponibles y registrarás reposiciones y ajustes con su motivo.",
  },
  ventas: {
    title: "Ventas y reportes",
    description: "Consulta las operaciones de tu tienda y sus totales.",
    icon: ShoppingBag,
    detail:
      "Aquí verás las ventas registradas desde los celulares, sus productos e importes y el trabajador que las confirmó.",
  },
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  await requireAdmin();
  const { modulo } = await params;
  if (!Object.hasOwn(modules, modulo)) notFound();
  const module = modules[modulo as keyof typeof modules];
  return (
    <>
      <PageHeader title={module.title} description={module.description}>
        <span className="subtle-badge">
          <Boxes size={12} /> En preparación
        </span>
      </PageHeader>
      <section className="card">
        <div className="empty-state large-empty">
          <span className="soft-icon large">
            <module.icon size={28} strokeWidth={1.4} />
          </span>
          <h3>El siguiente paso de tu tienda</h3>
          <p>{module.detail}</p>
          <span className="pill">Módulo pendiente de implementación</span>
        </div>
      </section>
    </>
  );
}
