import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";

export default async function IndexPage() {
  const user = await currentUser();
  redirect(
    !user
      ? "/iniciar-sesion"
      : user.rol === "ADMINISTRADOR"
        ? "/inicio"
        : "/acceso-limitado",
  );
}
