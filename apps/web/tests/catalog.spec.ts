import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const prefix = `web-${randomUUID().slice(0, 8)}`;
test.afterAll(() => {
  execFileSync(process.execPath, ["test/cleanup-web.mjs", prefix], {
    cwd: fileURLToPath(new URL("../../api/", import.meta.url)),
    stdio: "inherit",
  });
});

test("crear y editar proveedores y productos vinculados desde la web", async ({
  page,
}, testInfo) => {
  await page.goto("/registrar-tienda");
  await page.getByLabel("Tu nombre").fill("Ana Catálogo");
  await page
    .getByLabel("Correo electrónico")
    .fill(`${prefix}-owner@example.test`);
  await page.getByLabel("Crear contraseña").fill(`Test-${randomUUID()}`);
  await page.getByLabel("Nombre de la tienda").fill("Bodega Catálogo");
  await page.getByLabel("Número de documento del negocio").fill(prefix);
  await page.getByRole("button", { name: "Crear tienda" }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await page.goto("/proveedores/nuevo");
  await page.getByLabel("Nombre del contacto").fill("Elena Torres");
  await page.getByLabel("Empresa o distribuidora").fill("Distribuidora Norte");
  await page.getByLabel("Teléfono / WhatsApp").fill("+51 999 123 456");
  await page.getByLabel("Días habituales de visita").fill("Lunes y jueves");
  await page.getByLabel("Notas").fill("Coordinar antes de la visita.");
  await page
    .getByRole("button", { name: "Guardar proveedor", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proveedores\/\d+\?guardado=1$/);
  const supplierPath = new URL(page.url()).pathname;
  await expect(
    page.getByRole("heading", { name: "Elena Torres", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir WhatsApp" }),
  ).toHaveAttribute("href", "https://wa.me/51999123456");
  await page.getByRole("link", { name: "Crear producto asociado" }).click();
  await page.getByLabel("Nombre del producto").fill("Café molido");
  await page.getByLabel("Presentación", { exact: true }).fill("Bolsa de 250 g");
  await page.getByLabel("Código de barras").fill("0001234567890");
  await page.getByLabel("Precio de venta").fill("12,50");
  await page.getByLabel("Stock mínimo").fill("10");
  await expect(
    page.getByRole("checkbox", { name: /Elena Torres/ }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Crear producto", exact: true })
    .click();
  await expect(page).toHaveURL(/\/productos\/\d+\?guardado=1$/);
  const productPath = new URL(page.url()).pathname;
  await expect(
    page.getByRole("heading", { name: "Café molido", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("S/ 12.50", { exact: true })).toBeVisible();
  await expect(page.getByText("0001234567890", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Editar producto", exact: true })
    .click();
  await page.getByLabel("Precio de venta").fill("13.20");
  await page.getByLabel("Estado del producto").selectOption("INACTIVO");
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(productPath + "\\?guardado=1$"));
  await expect(page.getByText("S/ 13.20", { exact: true })).toBeVisible();
  await expect(page.getByText("Inactivo", { exact: true })).toBeVisible();
  await page.goto("/productos");
  await expect(
    page.getByRole("row").filter({ hasText: "0001234567890" }),
  ).toContainText("Inactivo");
  await page.screenshot({
    path: testInfo.outputPath("catalogo.png"),
    fullPage: true,
  });
  await page.goto(supplierPath);
  await expect(
    page.getByText("1 producto asociado al contacto."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Café molido/ })).toContainText(
    "13.20",
  );
  await page.screenshot({
    path: testInfo.outputPath("proveedor.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Editar contacto" }).click();
  await page.getByLabel("Días habituales de visita").fill("Martes");
  await page.getByLabel("Estado del proveedor").selectOption("INACTIVO");
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(page.getByText("Martes", { exact: true })).toBeVisible();
  await expect(
    page.getByText("1 producto asociado al contacto."),
  ).toBeVisible();
  await page.goto("/proveedores?q=Caf%C3%A9");
  await expect(
    page.getByRole("heading", { name: "Elena Torres" }),
  ).toBeVisible();
  await page.goto("/productos/nuevo");
  await page.getByLabel("Nombre del producto").fill("Café duplicado");
  await page.getByLabel("Código de barras").fill("0001234567890");
  await page.getByLabel("Precio de venta").fill("15.00");
  await page
    .getByRole("button", { name: "Crear producto", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "El código de barras" }),
  ).toContainText("El código de barras ya está registrado");
  await expect(page.getByLabel("Nombre del producto")).toHaveValue(
    "Café duplicado",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(productPath + "/editar");
  await expect(page.getByLabel("Código de barras")).toHaveValue(
    "0001234567890",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("producto-movil.png"),
    fullPage: true,
  });
});
