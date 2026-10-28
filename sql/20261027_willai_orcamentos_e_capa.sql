-- WillAI: solicitações de orçamento e uploads do editor visual.
-- Execute apenas no Supabase do projeto rnqaktkvwfsetbjsqdrj.
-- Cria tabelas/políticas adicionais; não remove nem altera os dados atuais.
BEGIN;
CREATE TABLE IF NOT EXISTS public.willai_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  whatsapp text NOT NULL CHECK (char_length(trim(whatsapp)) BETWEEN 10 AND 20 AND whatsapp ~ '^[+0-9 ()-]+$'),
  email text NOT NULL DEFAULT '' CHECK (char_length(email) <= 200),
  service text NOT NULL CHECK (char_length(trim(service)) BETWEEN 2 AND 100),
  description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 15 AND 4000),
  status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','in_progress','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS willai_quotes_created_idx ON public.willai_quote_requests (created_at DESC);
ALTER TABLE public.willai_quote_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_quote_requests FROM PUBLIC,anon,authenticated;
-- A pessoa sem login pode ENVIAR somente dados de contato; não pode definir status.
GRANT INSERT(name,whatsapp,email,service,description) ON public.willai_quote_requests TO anon,authenticated;
-- Somente administrador consegue LER/ATUALIZAR os pedidos.
GRANT SELECT ON public.willai_quote_requests TO authenticated;
GRANT UPDATE(status,updated_at) ON public.willai_quote_requests TO authenticated;
DROP POLICY IF EXISTS willai_quote_create ON public.willai_quote_requests;
CREATE POLICY willai_quote_create ON public.willai_quote_requests
FOR INSERT TO anon,authenticated WITH CHECK (status='new');
DROP POLICY IF EXISTS willai_quote_admin_read ON public.willai_quote_requests;
CREATE POLICY willai_quote_admin_read ON public.willai_quote_requests
FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.willai_portal_admins adm WHERE adm.user_id=(select auth.uid()))
);
DROP POLICY IF EXISTS willai_quote_admin_update ON public.willai_quote_requests;
CREATE POLICY willai_quote_admin_update ON public.willai_quote_requests
FOR UPDATE TO authenticated USING (
  EXISTS(SELECT 1 FROM public.willai_portal_admins adm WHERE adm.user_id=(select auth.uid()))
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.willai_portal_admins adm WHERE adm.user_id=(select auth.uid()))
);

-- Upload de banner/capas por usuários autorizados, sem service_role no navegador.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('willai-public','willai-public',true,10485760,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS willai_portal_admin_upload ON storage.objects;
CREATE POLICY willai_portal_admin_upload ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
 bucket_id='willai-public'
 AND (storage.foldername(name))[1] = (select auth.uid())::text
 AND EXISTS (SELECT 1 FROM public.willai_portal_admins adm WHERE adm.user_id=(select auth.uid()))
);
COMMIT;

-- VERIFICAÇÃO:
-- SELECT to_regclass('public.willai_quote_requests');
-- SELECT id,name,public FROM storage.buckets WHERE id='willai-public';
-- SELECT policyname,tablename FROM pg_policies
-- WHERE (schemaname='public' AND tablename='willai_quote_requests')
--    OR (schemaname='storage' AND tablename='objects' AND policyname='willai_portal_admin_upload');
