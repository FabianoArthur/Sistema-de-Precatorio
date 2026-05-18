import { expect, test } from '@playwright/test';

const EMAIL = process.env.E2E_USER_EMAIL ?? 'admin@preca.local';
const PASSWORD = process.env.E2E_USER_PASSWORD ?? 'admin123';

test.describe('Auth flow', () => {
  test('redireciona usuário não autenticado para /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading')).toContainText(/preca|login/i);
  });

  test('login válido leva ao dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/e-?mail/i).fill(EMAIL);
    await page.getByLabel(/senha/i).fill(PASSWORD);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('login inválido mantém na tela e mostra erro', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/e-?mail/i).fill('nao-existe@preca.local');
    await page.getByLabel(/senha/i).fill('senha-errada-123');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
