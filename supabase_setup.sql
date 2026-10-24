-- Execute no Supabase SQL Editor do projeto rnqaktkvwfsetbjsqdrj.
-- Não execute em um projeto diferente.
-- Os usuários administradores devem ser criados em Authentication > Users.
-- Cada usuário só pode editar suas próprias páginas (owner_id = auth.uid()).
CREATE TABLE IF NOT EXISTS public.willai_pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL,
 mode text NOT NULL DEFAULT 'reviews' CHECK(mode IN ('reviews','business')),
 config jsonb NOT NULL DEFAULT '{}'::jsonb,
 published boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.willai_pages ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.willai_pages TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.willai_pages TO authenticated;
DROP POLICY IF EXISTS willai_public_read ON public.willai_pages;
DROP POLICY IF EXISTS willai_owner_read ON public.willai_pages;
DROP POLICY IF EXISTS willai_owner_insert ON public.willai_pages;
DROP POLICY IF EXISTS willai_owner_update ON public.willai_pages;
DROP POLICY IF EXISTS willai_owner_delete ON public.willai_pages;
CREATE POLICY willai_public_read ON public.willai_pages FOR SELECT TO anon,authenticated USING (published = true);
CREATE POLICY willai_owner_read ON public.willai_pages FOR SELECT TO authenticated USING ((select auth.uid()) = owner_id);
CREATE POLICY willai_owner_insert ON public.willai_pages FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = owner_id);
CREATE POLICY willai_owner_update ON public.willai_pages FOR UPDATE TO authenticated USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);
CREATE POLICY willai_owner_delete ON public.willai_pages FOR DELETE TO authenticated USING ((select auth.uid()) = owner_id);
CREATE INDEX IF NOT EXISTS willai_pages_published_slug_idx ON public.willai_pages(slug) WHERE published = true;

-- Bucket público: somente membros autenticados inserem arquivos dentro da própria pasta UID/.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('willai-public','willai-public',true,10485760,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=true,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS willai_owner_insert_assets ON storage.objects;
DROP POLICY IF EXISTS willai_owner_update_assets ON storage.objects;
DROP POLICY IF EXISTS willai_owner_delete_assets ON storage.objects;
DROP POLICY IF EXISTS willai_public_read_assets ON storage.objects;
CREATE POLICY willai_public_read_assets ON storage.objects FOR SELECT TO anon,authenticated USING (bucket_id='willai-public');
CREATE POLICY willai_owner_insert_assets ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='willai-public' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY willai_owner_update_assets ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='willai-public' AND (storage.foldername(name))[1] = (select auth.uid())::text) WITH CHECK (bucket_id='willai-public' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY willai_owner_delete_assets ON storage.objects FOR DELETE TO authenticated USING (bucket_id='willai-public' AND (storage.foldername(name))[1] = (select auth.uid())::text);

-- Verificação no SQL Editor:
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='willai_pages';
SELECT id,name,public FROM storage.buckets WHERE id='willai-public';
