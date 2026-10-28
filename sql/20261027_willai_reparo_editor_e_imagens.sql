-- WillAI: reparo não destrutivo do salvamento de conteúdo e fotos do editor.
-- PROJETO EXCLUSIVO: rnqaktkvwfsetbjsqdrj
-- Este SQL mantém as páginas e dados existentes intactos.
-- Rode somente depois de verificar o projeto e fazer backup.
BEGIN;
-- A tabela e o administrador foram criados na instalação inicial do portal.
DO $$
BEGIN
 IF to_regclass('public.willai_portal_admins') IS NULL OR to_regclass('public.willai_portal_content') IS NULL THEN
   RAISE EXCEPTION 'A instalação inicial do portal não foi executada. Faça primeiro sql/20261027_willai_portal_setup.sql';
 END IF;
END $$;

ALTER TABLE public.willai_portal_content ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.willai_portal_content TO anon,authenticated;
GRANT UPDATE (config,updated_at) ON public.willai_portal_content TO authenticated;

DROP POLICY IF EXISTS portal_admin_update ON public.willai_portal_content;
CREATE POLICY portal_admin_update ON public.willai_portal_content
FOR UPDATE TO authenticated
USING (EXISTS(SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid())))
WITH CHECK (published=true AND EXISTS(SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid())));

DROP POLICY IF EXISTS portal_read ON public.willai_portal_content;
CREATE POLICY portal_read ON public.willai_portal_content
FOR SELECT TO anon,authenticated USING(published=true);

-- Não sobrescreve os textos/imagens já salvos.
INSERT INTO public.willai_portal_content(slug,config,published)
VALUES('main','{}'::jsonb,true) ON CONFLICT(slug) DO NOTHING;

-- Bucket dedicado às capas, banners e logotipos públicos.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('willai-public','willai-public',true,10485760,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT(id) DO UPDATE SET
 public=true,
 file_size_limit=EXCLUDED.file_size_limit,
 allowed_mime_types=EXCLUDED.allowed_mime_types;

-- Apenas superadministradores autenticados e dentro de sua pasta podem criar arquivos.
DROP POLICY IF EXISTS willai_portal_admin_upload ON storage.objects;
CREATE POLICY willai_portal_admin_upload ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
 bucket_id='willai-public'
 AND (storage.foldername(name))[1] = (select auth.uid())::text
 AND EXISTS (SELECT 1 FROM public.willai_portal_admins adm WHERE adm.user_id=(select auth.uid()))
);

COMMIT;

-- Resultados de verificação, sem alterar dados:
SELECT slug,published,updated_at,octet_length(config::text) AS bytes_config
FROM public.willai_portal_content WHERE slug='main';
SELECT id,public,file_size_limit,allowed_mime_types
FROM storage.buckets WHERE id='willai-public';
SELECT schemaname,tablename,policyname,cmd
FROM pg_policies WHERE (schemaname='public' AND tablename='willai_portal_content')
OR (schemaname='storage' AND tablename='objects' AND policyname='willai_portal_admin_upload')
ORDER BY schemaname,tablename,policyname;
