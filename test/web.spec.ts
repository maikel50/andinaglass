import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:4321";

const paginas = [
  "/",
  "/vidrios",
  "/aluminio",
  "/accesorios",
  "/catalogo",
  "/contacto",
  "/politica",
  "/terminos",
];

test("la página de inicio carga correctamente", async ({ page }) => {
  await page.goto(baseURL);

  await expect(page).toHaveTitle(/Andina Glass/i);
});

test("todas las páginas principales cargan sin error", async ({ page }) => {
  for (const ruta of paginas) {
    const response = await page.goto(`${baseURL}${ruta}`);

    expect(
      response?.status(),
      `Error cargando ${ruta}`
    ).toBeLessThan(400);
  }
});

test("no hay imágenes rotas en las páginas principales", async ({ page }) => {
  for (const ruta of paginas) {
    await page.goto(`${baseURL}${ruta}`);

    const imagenes = page.locator("img");
    const total = await imagenes.count();

    for (let i = 0; i < total; i++) {
      const imagen = imagenes.nth(i);

      await expect(imagen).toBeVisible();

      const naturalWidth = await imagen.evaluate(
        (img: HTMLImageElement) => img.naturalWidth
      );

      expect(
        naturalWidth,
        `Imagen rota encontrada en ${ruta}`
      ).toBeGreaterThan(0);
    }
  }
});

test("todos los enlaces de WhatsApp usan el número correcto", async ({ page }) => {
  for (const ruta of paginas) {
    await page.goto(`${baseURL}${ruta}`);

    const enlaces = page.locator('a[href*="wa.me/"]');
    const total = await enlaces.count();

    for (let i = 0; i < total; i++) {
      const href = await enlaces.nth(i).getAttribute("href");

      expect(href).toContain("wa.me/593997564672");
    }
  }
});

test("el correo de contacto es correcto", async ({ page }) => {
  await page.goto(`${baseURL}/contacto`);

  const email = page.locator(
    'a[href="mailto:andinaglassdistribuidora@gmail.com"]'
  );

  expect(await email.count()).toBeGreaterThan(0);
});

test("la dirección enlaza a Google Maps", async ({ page }) => {
  await page.goto(`${baseURL}/contacto`);

  const maps = page.locator(
    'a[href*="google.com/maps"]'
  );

  expect(await maps.count()).toBeGreaterThan(0);
});

test("el mapa está cargado en contacto", async ({ page }) => {
  await page.goto(`${baseURL}/contacto`);

  const iframe = page.locator('iframe[src*="google.com/maps"]');

  await expect(iframe).toBeVisible();
});

test("el formulario tiene los campos obligatorios", async ({ page }) => {
  await page.goto(`${baseURL}/contacto`);

  await expect(page.locator('input[name="nombre"]')).toHaveAttribute(
    "required",
    ""
  );

  await expect(page.locator('input[name="telefono"]')).toHaveAttribute(
    "required",
    ""
  );

  await expect(page.locator('textarea[name="mensaje"]')).toHaveAttribute(
    "required",
    ""
  );

  await expect(page.locator('input[name="privacidad"]')).toHaveAttribute(
    "required",
    ""
  );
});

test("el formulario permite rellenar los campos", async ({ page }) => {
  await page.goto(`${baseURL}/contacto`);

  await page.locator('input[name="nombre"]').fill("Prueba Playwright");
  await page.locator('input[name="telefono"]').fill("0991234567");
  await page
    .locator('input[name="correo"]')
    .fill("prueba@example.com");

  await page.locator('select[name="producto"]').selectOption("Vidrios");

  await page
    .locator('textarea[name="mensaje"]')
    .fill("Mensaje automático de prueba.");

  await page.locator('input[name="privacidad"]').check();

  await expect(page.locator('input[name="nombre"]')).toHaveValue(
    "Prueba Playwright"
  );

  await expect(page.locator('input[name="privacidad"]')).toBeChecked();
});

test("la navegación principal contiene las secciones importantes", async ({
  page,
}) => {
  await page.goto(baseURL);

  await expect(page.getByRole("link", { name: "Inicio" }).first()).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Vidrios" }).first()
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Aluminio" }).first()
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Accesorios" }).first()
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Contacto" }).first()
  ).toBeVisible();
});

test("los enlaces internos no devuelven 404", async ({ page }) => {
  await page.goto(baseURL);

  const enlaces = page.locator('a[href^="/"]');
  const total = await enlaces.count();

  const rutas = new Set<string>();

  for (let i = 0; i < total; i++) {
    const href = await enlaces.nth(i).getAttribute("href");

    if (href) {
      rutas.add(href);
    }
  }

  for (const ruta of rutas) {
    const response = await page.request.get(`${baseURL}${ruta}`);

    expect(
      response.status(),
      `Enlace roto: ${ruta}`
    ).toBeLessThan(400);
  }
});

test("no hay errores graves de JavaScript en inicio", async ({ page }) => {
  const errores: string[] = [];

  page.on("pageerror", (error) => {
    errores.push(error.message);
  });

  await page.goto(baseURL);

  await page.waitForTimeout(1000);

  expect(errores).toEqual([]);
});

test("la web funciona en tamaño móvil", async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844,
  });

  await page.goto(baseURL);

  await expect(page.locator("body")).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });

  expect(horizontalOverflow).toBe(false);
});