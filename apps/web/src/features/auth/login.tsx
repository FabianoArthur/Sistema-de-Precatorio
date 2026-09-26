import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { DEMO_CREDENCIAIS, DEMO_MODE } from '@/lib/demo-mode';
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginInput, loginSchema } from '@preca/shared';
import { AlertCircle, Loader2, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: DEMO_MODE ? DEMO_CREDENCIAIS : undefined,
  });

  async function onSubmit(data: LoginInput) {
    setErro(null);
    try {
      await login(data.email, data.senha);
      navigate('/');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha no login');
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Lado esquerdo — branding */}
      <aside className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-primary via-primary-strong to-[#3b3699] text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40 mix-blend-screen pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <header className="relative flex items-center gap-3">
          <BrandMark size={40} className="bg-white/15 ring-white/30" />
          <div className="leading-tight">
            <div className="text-base font-semibold font-display">Preca</div>
            <div className="text-xs text-primary-foreground/70">Controle de Precatórios</div>
          </div>
        </header>

        <div className="relative space-y-8 max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight font-display text-balance text-primary-foreground">
            Do recebimento à escritura, todo o pipeline em um lugar.
          </h1>

          <ul className="space-y-3 text-sm text-primary-foreground/90">
            <FeaturePill icon={Workflow}>
              Fluxo bidirecional de estágios com SLA configurável
            </FeaturePill>
            <FeaturePill icon={Sparkles}>OCR automático em PDFs federais, TJSP e TJRJ</FeaturePill>
            <FeaturePill icon={ShieldCheck}>
              Audit log completo e notificações em tempo real
            </FeaturePill>
          </ul>
        </div>

        <footer className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Preca · controle de precatórios
        </footer>
      </aside>

      {/* Lado direito — form */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-sm space-y-6 animate-fade-in"
          noValidate
        >
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <BrandMark size={32} />
            <div className="font-semibold tracking-tight">Preca</div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight font-display">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@preca.local"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.senha}
                {...register('senha')}
              />
              {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
            </div>
          </div>

          {DEMO_MODE && (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <strong className="font-medium">Demo pública.</strong> As credenciais já estão
              preenchidas. Os dados são fictícios e ficam só no seu navegador (recarregar a página
              reinicia tudo).
            </div>
          )}

          {erro && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Acesso restrito a usuários cadastrados
          </p>
        </form>
      </main>
    </div>
  );
}

function FeaturePill({
  icon: Icon,
  children,
}: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/20">
        <Icon size={14} />
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
