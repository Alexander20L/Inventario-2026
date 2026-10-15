import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="empty-state large-empty" role="status">
      <LoaderCircle size={27} className="spin" />
      <p>Cargando tu espacio…</p>
    </div>
  );
}
