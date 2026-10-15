"use client";

import { RefreshCw, Unplug } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-page">
      <section className="card">
        <span className="soft-icon large">
          <Unplug size={26} />
        </span>
        <h1>No pudimos cargar este espacio</h1>
        <p>
          Comprueba que la API esté en ejecución y que haya conexión con SQL
          Server. Tus datos no se han perdido.
        </p>
        <button className="button primary" onClick={reset}>
          <RefreshCw size={16} /> Intentar nuevamente
        </button>
      </section>
    </div>
  );
}
