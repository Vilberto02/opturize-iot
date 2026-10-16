import { expect, test, type Page } from '@playwright/test';
import { place, recommendation } from '../fixtures';

const destinations = [
  place(1, { name: 'Museo de la Historia y del Patrimonio Cultural de Lima', district: 'Miraflores' }),
  place(2, { name: 'Huaca de Barranco', traffic_state: 'ROJO', current_occupancy: 120, occupancy_percentage: 120 }),
  ...Array.from({ length: 6 }, (_, index) => place(index + 3)),
];

async function mockApi(page: Page) {
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/history/')) return route.fulfill({ json: [] });
    if (url.pathname.endsWith('/control/')) return route.fulfill({ json: { status: 'ok', device_id: 'ESP32-1', topic: 'control/1', payload: {} } });
    if (url.pathname.includes('recommendations')) return route.fulfill({ json: { count: 1, model_applied: 'B = MAP', results: [recommendation(1)] } });
    return route.fulfill({ json: { count: destinations.length, next: null, results: destinations } });
  });
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test('desktop, tablet y móvil conservan lectura, controles y modal completo', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByText('8 de 8 destinos', { exact: false })).toBeVisible();
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoPageOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`turista-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Gestor IoT', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Control de aforo turístico' })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`gestor-${width}.png`), fullPage: true });
    const command = page.getByRole('button', { name: 'Comandar', exact: true });
    await command.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(901);
    await page.screenshot({ path: testInfo.outputPath(`modal-${width}.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(command).toBeFocused();
    await page.getByRole('button', { name: 'Vista turista', exact: true }).click();
  }
  expect(errors).toEqual([]);
});

test('búsqueda compartida, filtros, vacíos y selección de ruta', async ({ page }) => {
  await mockApi(page); await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Buscar atractivos' });
  await search.fill('Miraflores');
  await expect(page.getByText('1 de 8 destinos', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Huaca de Barranco' })).toHaveCount(0);
  await search.fill('Sin coincidencias');
  await expect(page.getByText('No encontramos atractivos con estos filtros')).toBeVisible();
  await expect(page.getByText('No hay lugares en el mapa con estos filtros.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click();
  await expect(search).toHaveValue('');
  await search.fill('Miraflores');
  await page.getByRole('button', { name: 'Explorar ruta', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByText('Seleccionado:', { exact: false })).toContainText('Huaca de Barranco');
  await page.getByRole('combobox', { name: 'Filtrar por estado' }).click();
  await page.getByRole('option', { name: 'Saturado (Rojo)' }).click();
  await expect(page.getByText('1 de 8 destinos', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Gestor IoT', exact: true }).click();
  await expect(page.getByText('8 nodos ESP32', { exact: true })).toBeVisible();
});

test('carga inicial, fallo recuperable y zoom', async ({ page }) => {
  let failed = true;
  let releaseFailure!: () => void;
  const firstResponse = new Promise<void>(resolve => { releaseFailure = resolve; });
  await mockApi(page);
  await page.route(url => url.pathname === '/api/places/' && url.searchParams.get('page') === '1', async route => {
    if (failed) {
      await firstResponse;
      return route.fulfill({ status: 503, json: { detail: 'No disponible' } });
    }
    return route.fulfill({ json: { count: destinations.length, next: null, results: destinations } });
  });
  await page.goto('/');
  await expect(page.getByRole('status', { name: 'Cargando información' }).first()).toBeVisible();
  releaseFailure();
  await expect(page.getByText('No pudimos actualizar la información')).toBeVisible();
  await expect(page.getByText('Todos los atractivos turísticos se encuentran actualmente con aforo normal y libre.')).toHaveCount(0);
  failed = false;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).first().click();
  await expect(page.getByText('8 de 8 destinos', { exact: false })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await expectNoPageOverflow(page);
  await page.getByRole('button', { name: 'Gestor IoT', exact: true }).click();
  await expectNoPageOverflow(page);
});
