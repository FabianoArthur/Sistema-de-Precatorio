import { type Page, expect, test } from '@playwright/test';

// URLs relativas (sem barra inicial) para respeitar o caminho base do baseURL.

async function entrar(page: Page) {
  await page.goto('login');
  await expect(page.getByText(/demo pública/i)).toBeVisible();
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}

test('login com credenciais pré-preenchidas leva ao dashboard com KPIs e alertas de SLA', async ({
  page,
}) => {
  await entrar(page);
  await expect(page.getByText(/pipeline ativo/i)).toBeVisible();
  await expect(page.getByText(/cota[çc][õo]es pendentes/i)).toBeVisible();
  await expect(page.getByText(/\d+ alerta\(s\)/i)).toBeVisible();
});

test('filtro de estágio vai para a URL e sobrevive a abrir o link direto', async ({ page }) => {
  await entrar(page);
  await page.getByRole('link', { name: /precat[óo]rios/i }).click();
  await expect(page).toHaveURL(/\/precatorios$/);

  await page.goto('precatorios?estagioAtual=TRIAGEM');
  const linhas = page.getByRole('row').filter({ hasText: /triagem/i });
  await expect(linhas.first()).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /documenta[çc][ãa]o/i })).toHaveCount(0);
});

test('detalhe mostra divergência do OCR e aplicar corrige o valor', async ({ page }) => {
  await entrar(page);
  await page.goto('precatorios?estagioAtual=DOCUMENTACAO');
  await page
    .getByRole('row')
    .filter({ hasText: /documenta[çc][ãa]o/i })
    .first()
    .getByRole('link')
    .first()
    .click();
  await expect(page).toHaveURL(/\/precatorios\/[0-9a-f-]{36}$/);

  await expect(page.getByRole('heading', { name: /2 diverg[êe]ncias entre OCR/i })).toBeVisible();
  await page
    .getByRole('listitem')
    .filter({ hasText: /valor atualizado/i })
    .getByRole('button', { name: /aplicar ocr/i })
    .click();
  await expect(page.getByRole('heading', { name: /1 diverg[êe]ncia entre OCR/i })).toBeVisible();

  await page.getByRole('tab', { name: /anexos/i }).click();
  await expect(page.getByText(/oficio-requisitorio-tjrj\.pdf/i).first()).toBeVisible();
});

test('upload de PDF avisa que está desligado na demo', async ({ page }) => {
  await entrar(page);
  await page.goto('precatorios?estagioAtual=TRIAGEM');
  await page
    .getByRole('row')
    .filter({ hasText: /triagem/i })
    .first()
    .getByRole('link')
    .first()
    .click();
  await page.getByRole('tab', { name: /anexos/i }).click();
  await page.locator('input[type="file"][accept="application/pdf"]').setInputFiles({
    name: 'oficio.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await expect(page.getByText(/desligado na demo/i)).toBeVisible();
});
