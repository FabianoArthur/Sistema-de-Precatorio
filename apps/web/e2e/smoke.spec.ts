import { expect, test } from '@playwright/test';

const EMAIL = process.env.E2E_USER_EMAIL ?? 'admin@preca.local';
const PASSWORD = process.env.E2E_USER_PASSWORD ?? 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail/i).fill(EMAIL);
  await page.getByLabel(/senha/i).fill(PASSWORD);
  await page.getByRole('button', { name: /entrar|login/i }).click();
  await page.waitForURL('/', { timeout: 10_000 });
}

test.describe('Smoke navegação principal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard renderiza cards KPI', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/pipeline ativo/i)).toBeVisible();
    await expect(page.getByText(/cota[çc][õo]es pendentes/i)).toBeVisible();
  });

  test('navega entre Precatórios, Compradores, Parceiros', async ({ page }) => {
    await page.getByRole('link', { name: /precat[óo]rios/i }).click();
    await expect(page).toHaveURL(/\/precatorios/);
    await page.getByRole('link', { name: /compradores/i }).click();
    await expect(page).toHaveURL(/\/compradores/);
    await page.getByRole('link', { name: /parceiros/i }).click();
    await expect(page).toHaveURL(/\/parceiros/);
  });

  test('sino de notificações abre e fecha o popover', async ({ page }) => {
    const bell = page.getByRole('button', { name: /notifica[çc][õo]es/i });
    await bell.click();
    await expect(page.getByRole('heading', { name: /notifica[çc][õo]es/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('logout funciona e volta ao /login', async ({ page }) => {
    await page.getByRole('button', { name: /sair/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
