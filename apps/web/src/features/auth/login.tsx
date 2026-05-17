import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { type LoginInput, loginSchema } from '@preca/shared';
import { useAuth } from '@/contexts/auth-context';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 p-6 border border-border rounded-lg bg-card"
      >
        <h1 className="text-xl font-semibold">Entrar no Preca</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="senha" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            {...register('senha')}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            autoComplete="current-password"
          />
          {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
        </div>

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
