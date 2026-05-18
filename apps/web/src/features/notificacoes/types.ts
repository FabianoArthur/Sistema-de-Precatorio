import type { TipoNotificacao } from '@preca/shared';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  mensagem: string;
  link: string | null;
  lida: boolean;
  userId: string;
  createdAt: string;
}
