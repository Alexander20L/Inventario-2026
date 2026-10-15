import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const prefix = `web-${randomUUID().slice(0, 8)}`;
const password = `Test-${randomUUID()}`;
const ownerEmail = `${prefix}-owner@example.test`;
const workerEmail = `${prefix}-worker@example.test`;

test.afterAll(() => {
  execFileSync(process.execPath, ["test/cleanup-web.mjs", prefix], {
    cwd: fileURLToPath(new URL("../../api/", import.meta.url)),
    stdio: "inherit",
  });
});

test("registro, invitación, acceso por rol y revocación desde la web", async ({
  page,
  browser,
}, testInfo) => {
  await page.goto("/usuarios");
  await expect(page).toHaveURL(/iniciar-sesion/);
  await page.goto("/iniciar-sesion");
  await page.screenshot({
    path: testInfo.outputPath("iniciar-sesion.png"),
    fullPage: true,
  });
  await page.goto("/registrar-tienda");
  await page.getByLabel("Tu nombre").fill("Ana Prueba Web");
  await page.getByLabel("Correo electrónico").fill(ownerEmail);
  await page.getByLabel("Crear contraseña").fill(password);
  await page.getByLabel("Nombre de la tienda").fill("Bodega Prueba Web");
  await page.getByLabel("Número de documento del negocio").fill(prefix);
  await page.getByRole("button", { name: "Crear tienda" }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(
    page.getByRole("heading", { name: "Buen día, Ana" }),
  ).toBeVisible();
  const cookie = (await page.context().cookies()).find(
    (value) => value.name === "enstock_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => window.localStorage.length)).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath("inicio.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "Usuarios", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Ana Prueba Web" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Invitar persona" }).click();
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill(workerEmail);
  await page
    .getByRole("button", { name: "Crear invitación", exact: true })
    .click();
  const linkField = page.getByLabel("Enlace de invitación", { exact: true });
  await expect(linkField).toHaveValue(/#token=[a-f0-9]{64}$/);
  const link = await linkField.inputValue();
  await expect(
    page.getByRole("cell", { name: "Pendiente", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("invitaciones.png"),
    fullPage: true,
  });

  const workerContext = await browser.newContext();
  try {
    const worker = await workerContext.newPage();
    await worker.goto(link);
    await expect(
      worker.getByRole("heading", { name: "Te invitaron a Bodega Prueba Web" }),
    ).toBeVisible();
    await expect(worker).toHaveURL(/\/aceptar-invitacion$/);
    await expect(worker.getByLabel("Correo electrónico")).toHaveValue(
      workerEmail,
    );
    await worker.getByLabel("Tu nombre").fill("Luis Prueba Web");
    await worker.getByLabel("Crear contraseña").fill(password);
    await worker
      .getByRole("button", { name: "Crear cuenta y aceptar" })
      .click();
    await expect(worker).toHaveURL(/acceso-limitado$/);
    await expect(
      worker.getByRole("heading", {
        name: "Luis, tu lugar está en el equipo.",
      }),
    ).toBeVisible();
    await worker.goto("/usuarios");
    await expect(worker).toHaveURL(/acceso-limitado$/);

    await page.goto("/usuarios");
    const row = page.getByRole("row").filter({ hasText: workerEmail });
    await expect(row).toContainText("Activo");
    await row.getByRole("button", { name: "Deshabilitar acceso" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Deshabilitar", exact: true })
      .click();
    await expect(row).toContainText("Deshabilitado");
    await worker.reload();
    await expect(worker).toHaveURL(/iniciar-sesion/);

    await row.getByRole("button", { name: "Reactivar acceso" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Reactivar", exact: true })
      .click();
    await expect(row).toContainText("Activo");
    await worker.getByLabel("Correo electrónico").fill(workerEmail);
    await worker.getByLabel("Contraseña", { exact: true }).fill(password);
    await worker.getByRole("button", { name: "Entrar a mi tienda" }).click();
    await expect(worker).toHaveURL(/acceso-limitado$/);
    await worker.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(worker).toHaveURL(/iniciar-sesion$/);
    await worker.goto(link);
    await expect(
      worker.getByText("Esta invitación ya se utilizó."),
    ).toBeVisible();
  } finally {
    await workerContext.close();
  }

  await page.goto("/usuarios/invitaciones");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill(`${prefix}-revoked@example.test`);
  await page
    .getByRole("button", { name: "Crear invitación", exact: true })
    .click();
  await expect(page.getByLabel("Enlace de invitación")).toHaveValue(/#token=/);
  const revokedLink = await page
    .getByLabel("Enlace de invitación")
    .inputValue();
  const revokedRow = page
    .getByRole("row")
    .filter({ hasText: `${prefix}-revoked@example.test` });
  await revokedRow
    .getByRole("button", { name: "Revocar", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Revocar invitación", exact: true })
    .click();
  await expect(revokedRow).toContainText("Revocada");
  const guest = await browser.newContext();
  try {
    const acceptance = await guest.newPage();
    await acceptance.goto(revokedLink);
    await expect(
      acceptance.getByText("La administración revocó esta invitación."),
    ).toBeVisible();
  } finally {
    await guest.close();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("link", { name: "Usuarios", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Usuarios", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Abrir menú" }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("complementary", { name: "Navegación principal" }),
  ).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("usuarios-movil.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/iniciar-sesion$/);
  await page.screenshot({
    path: testInfo.outputPath("iniciar-sesion-movil.png"),
    fullPage: true,
  });
  await page.goto("/inicio");
  await expect(page).toHaveURL(/iniciar-sesion/);
});
