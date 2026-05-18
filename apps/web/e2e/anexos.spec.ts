import path from 'node:path';
import { type APIRequestContext, type Page, expect, test } from '@playwright/test';

const EMAIL = process.env.E2E_USER_EMAIL ?? 'admin@preca.local';
const PASSWORD = process.env.E2E_USER_PASSWORD ?? 'admin123';
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001';

const PDF_PATH = path.join(__dirname, 'fixtures', 'sample.pdf');
const TXT_PATH = path.join(__dirname, 'fixtures', 'sample.txt');

async function loginUI(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail/i).fill(EMAIL);
  await page.getByLabel(/senha/i).fill(PASSWORD);
  await page.getByRole('button', { name: /entrar|login/i }).click();
  await page.waitForURL('/', { timeout: 10_000 });
}

async function getApiToken(request: APIRequestContext): Promise<string | null> {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email: EMAIL, senha: PASSWORD },
    failOnStatusCode: false,
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { token?: string; accessToken?: string };
  return body.token ?? body.accessToken ?? null;
}

async function createPrecatorioViaApi(
  request: APIRequestContext,
  token: string,
): Promise<string | null> {
  const stamp = Date.now();

  const cedRes = await request.post(`${API_URL}/cedentes`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { nome: `E2E Cedente Anexos ${stamp}` },
    failOnStatusCode: false,
  });
  if (!cedRes.ok()) return null;
  const cedente = (await cedRes.json()) as { id: string };

  const precRes = await request.post(`${API_URL}/precatorios`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      numeroPrecatorio: `E2E-ANX-${stamp}`,
      cedenteId: cedente.id,
      devedorTipo: 'FEDERAL',
      tipo: 'COMUM',
      valorOriginal: 100000,
    },
    failOnStatusCode: false,
  });
  if (!precRes.ok()) return null;
  const precatorio = (await precRes.json()) as { id: string };
  return precatorio.id;
}

test.describe('Anexos - upload golden path', () => {
  let precatorioId: string | null = null;

  test.beforeEach(async ({ page, request }) => {
    const token = await getApiToken(request);
    test.skip(!token, 'API indisponível para login - pulando teste de anexos');

    precatorioId = await createPrecatorioViaApi(request, token as string);
    test.skip(!precatorioId, 'Falha ao criar precatório via API - pulando teste de anexos');

    await loginUI(page);
  });

  test('faz upload de PDF válido e exibe na lista de anexos', async ({ page }) => {
    await page.goto(`/precatorios/${precatorioId}`);

    // Garante que o detail carregou (header com o número do precatório)
    await expect(page.getByRole('heading', { name: /E2E-ANX-/i })).toBeVisible({
      timeout: 10_000,
    });

    // Troca para a tab Anexos
    await page.getByRole('tab', { name: /anexos/i }).click();
    await expect(page.getByText(/arraste pdfs aqui/i)).toBeVisible();

    // Localiza o input file escondido dentro da UploadZone (accept="application/pdf")
    const fileInput = page.locator('input[type="file"][accept="application/pdf"]');
    await fileInput.setInputFiles(PDF_PATH);

    // O anexo aparece na tabela com o nome do arquivo
    const row = page.getByRole('row', { name: /sample\.pdf/i });
    await expect(row).toBeVisible({ timeout: 10_000 });

    // Status OCR inicial deve ser PROCESSANDO ou NAO_PROCESSADO (Processando.../Aguardando)
    await expect(row.getByText(/processando|aguardando/i)).toBeVisible();
  });

  test('rejeita arquivo não-PDF com alerta', async ({ page }) => {
    await page.goto(`/precatorios/${precatorioId}`);

    await expect(page.getByRole('heading', { name: /E2E-ANX-/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('tab', { name: /anexos/i }).click();
    await expect(page.getByText(/arraste pdfs aqui/i)).toBeVisible();

    // Captura o window.alert antes do upload
    const dialogPromise = page.waitForEvent('dialog', { timeout: 5_000 });

    const fileInput = page.locator('input[type="file"][accept="application/pdf"]');
    await fileInput.setInputFiles(TXT_PATH);

    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/n[ãa]o é pdf/i);
    await dialog.dismiss();

    // Garante que nenhuma linha de anexo foi adicionada à tabela
    await expect(page.getByRole('row', { name: /sample\.txt/i })).toHaveCount(0);
  });
});
