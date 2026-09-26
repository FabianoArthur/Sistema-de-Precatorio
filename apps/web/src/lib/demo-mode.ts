/**
 * Demo estática (GitHub Pages): liga com `VITE_DEMO_MODE=true` no build. O Vite troca a
 * expressão por um literal, então no build normal o ramo morre e o código da demo não
 * entra no bundle.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_CREDENCIAIS = { email: 'demo@preca.example', senha: 'demo1234' } as const;
