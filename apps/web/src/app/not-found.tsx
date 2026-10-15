import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="error-page">
      <section className="card">
        <span className="soft-icon large">
          <Search size={25} />
        </span>
        <h1>Esta página no está por aquí</h1>
        <p>La dirección no existe o cambió de lugar.</p>
        <Link href="/" className="button primary">
          Volver al inicio
        </Link>
      </section>
    </div>
  );
}
