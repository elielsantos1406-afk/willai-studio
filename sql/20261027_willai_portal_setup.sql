-- Portal WillAI: tabelas novas; nao altera willai_pages nem o modulo de plaquinhas
BEGIN;
CREATE TABLE IF NOT EXISTS public.willai_portal_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.willai_portal_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_portal_admins FROM anon, authenticated;
GRANT SELECT ON public.willai_portal_admins TO authenticated;
DROP POLICY IF EXISTS portal_admin_self ON public.willai_portal_admins;
CREATE POLICY portal_admin_self ON public.willai_portal_admins FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE TABLE IF NOT EXISTS public.willai_portal_content (
 slug text PRIMARY KEY CHECK (slug='main'),
 config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(config)='object'),
 published boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.willai_portal_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.willai_portal_content FROM anon,authenticated;
GRANT SELECT ON public.willai_portal_content TO anon,authenticated;
GRANT UPDATE ON public.willai_portal_content TO authenticated;
DROP POLICY IF EXISTS portal_read ON public.willai_portal_content;
CREATE POLICY portal_read ON public.willai_portal_content FOR SELECT TO anon,authenticated USING(published=true);
DROP POLICY IF EXISTS portal_admin_update ON public.willai_portal_content;
CREATE POLICY portal_admin_update ON public.willai_portal_content FOR UPDATE TO authenticated
 USING (EXISTS (SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid())))
 WITH CHECK (published=true AND EXISTS (SELECT 1 FROM public.willai_portal_admins a WHERE a.user_id=(select auth.uid())));
INSERT INTO public.willai_portal_content(slug,config,published) VALUES ('main','{}'::jsonb,true)
ON CONFLICT (slug) DO NOTHING;
COMMIT;
-- AUTORIZAR SEU EMAIL APOS CRIAR AS TABELAS:
-- INSERT INTO public.willai_portal_admins(user_id)
-- SELECT id FROM auth.users WHERE lower(email)=lower('SEU_EMAIL_DO_AUTH')
-- ON CONFLICT (user_id) DO NOTHING;
-- VALIDAR:
-- SELECT slug,published FROM public.willai_portal_content;
-- SELECT user_id FROM public.willai_portal_admins;