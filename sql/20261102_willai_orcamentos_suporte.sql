-- WillAI | Atendimento separado: comercial / suporte (2026-11-02)
-- Preserva pedidos de orçamento já existentes. Não altera registros nem elimina tabelas.
BEGIN;

-- A política de INSERT do orçamento já existia, porém faltava o GRANT do banco.
GRANT INSERT ON TABLE public.willai_quote_requests TO anon, authenticated;
-- As políticas de administrador já restringem o UPDATE.
GRANT UPDATE ON TABLE public.willai_quote_requests TO authenticated;

CREATE TABLE IF NOT EXISTS public.willai_support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  whatsapp text NOT NULL CHECK (char_length(btrim(whatsapp)) BETWEEN 10 AND 20 AND whatsapp ~ '^[+0-9 ()-]+$'),
  email text NOT NULL DEFAULT '' CHECK (char_length(email) <= 200),
  service text NOT NULL CHECK (char_length(btrim(service)) BETWEEN 2 AND 120),
  issue_type text NOT NULL CHECK (issue_type IN ('technical','access','qr','configuration','billing','other')),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 15 AND 4000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','in_progress','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS willai_support_requests_recent ON public.willai_support_requests(created_at DESC);
ALTER TABLE public.willai_support_requests ENABLE ROW LEVEL SECURITY;

-- Tabela exposta à Data API: somente criar pedidos anonimamente; visualizar e
-- atualizar ficam limitados aos administradores cadastrados no portal.
REVOKE ALL ON TABLE public.willai_support_requests FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.willai_support_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.willai_support_requests TO authenticated;

CREATE POLICY willai_support_create ON public.willai_support_requests
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');

CREATE POLICY willai_support_admin_read ON public.willai_support_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.willai_portal_admins adm WHERE adm.user_id=(SELECT auth.uid())));

CREATE POLICY willai_support_admin_update ON public.willai_support_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.willai_portal_admins adm WHERE adm.user_id=(SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.willai_portal_admins adm WHERE adm.user_id=(SELECT auth.uid())));

COMMIT;