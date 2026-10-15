import "server-only";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public empresas?: { id: string; nombre: string }[],
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(
      `${process.env.API_URL ?? "http://127.0.0.1:3100"}${path}`,
      {
        method: options.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.token
            ? { Authorization: `Bearer ${options.token}` }
            : {}),
        },
        ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    throw new ApiError(
      503,
      "No pudimos conectar con el servidor. Comprueba que la API esté en ejecución e inténtalo otra vez.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      response.status >= 500
        ? "El servidor no pudo completar la operación. Inténtalo de nuevo."
        : Array.isArray(data.message)
          ? data.message.join(". ")
          : data.message;
    throw new ApiError(
      response.status,
      typeof message === "string"
        ? message
        : "No se pudo completar la solicitud.",
      data.empresas,
    );
  }
  return data as T;
}
